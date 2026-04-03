import type { Photo, AlbumPerson } from '../types'

/* ─── Types ──────────────────────────────────────────────────────────── */

export interface DetectedFace {
  photoId: string
  box: [number, number, number, number]
  embedding: number[]
  cropDataUrl: string
}

type ProgressCb = (done: number, total: number, msg?: string) => void

/* ─── Lazy singleton ─────────────────────────────────────────────────── */

let humanInstance: import('@vladmandic/human').default | null = null

async function getHuman() {
  if (humanInstance) return humanInstance

  const { default: Human } = await import('@vladmandic/human')

  humanInstance = new Human({
    modelBasePath: 'https://cdn.jsdelivr.net/npm/@vladmandic/human/models/',
    backend: 'webgl' as const,
    cacheModels: true,
    debug: false,
    face: {
      enabled: true,
      detector: { enabled: true, rotation: false, maxDetected: 15, minConfidence: 0.3 },
      mesh: { enabled: false },
      attention: { enabled: false },
      iris: { enabled: false },
      description: { enabled: true, minConfidence: 0.3 },
      emotion: { enabled: false },
      antispoof: { enabled: false },
      liveness: { enabled: false },
    },
    body: { enabled: false },
    hand: { enabled: false },
    gesture: { enabled: false },
    segmentation: { enabled: false },
  } as import('@vladmandic/human').Config)

  await humanInstance.load()
  return humanInstance
}

/* ─── Image helpers ──────────────────────────────────────────────────── */

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

const CROP_SIZE = 96

function cropFace(
  img: HTMLImageElement,
  box: [number, number, number, number],
): string {
  const [bx, by, bw, bh] = box

  const pad = Math.max(bw, bh) * 0.35
  const cx = bx + bw / 2
  const cy = by + bh / 2
  const side = Math.max(bw, bh) + pad * 2
  const sx = Math.max(0, cx - side / 2)
  const sy = Math.max(0, cy - side / 2)
  const sw = Math.min(side, img.naturalWidth - sx)
  const sh = Math.min(side, img.naturalHeight - sy)

  const canvas = document.createElement('canvas')
  canvas.width = CROP_SIZE
  canvas.height = CROP_SIZE
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, CROP_SIZE, CROP_SIZE)
  return canvas.toDataURL('image/jpeg', 0.85)
}

/* ─── Detection ──────────────────────────────────────────────────────── */

export async function detectFacesInPhotos(
  photos: Photo[],
  onProgress?: ProgressCb,
): Promise<DetectedFace[]> {
  const human = await getHuman()
  const all: DetectedFace[] = []

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i]
    const url = photo.fullUrl || photo.thumbnailUrl
    if (!url) continue

    try {
      const img = await loadImage(url)
      const result = await human.detect(img)

      if (result.face) {
        for (const face of result.face) {
          if (!face.embedding || face.embedding.length === 0) continue
          if ((face.score ?? 0) < 0.35) continue

          const cropUrl = cropFace(img, face.box)
          all.push({
            photoId: photo.id,
            box: face.box,
            embedding: face.embedding,
            cropDataUrl: cropUrl,
          })
        }
      }
    } catch (err) {
      console.warn(`[FaceDetection] Failed for photo ${photo.id}:`, err)
    }

    onProgress?.(i + 1, photos.length)
  }

  return all
}

/* ─── Clustering by embedding similarity ─────────────────────────────── */

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0
  let magA = 0
  let magB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    magA += a[i] * a[i]
    magB += b[i] * b[i]
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB)
  return denom === 0 ? 0 : dot / denom
}

const SIMILARITY_THRESHOLD = 0.52

export function clusterFaces(
  faces: DetectedFace[],
  existingLabels?: Map<string, string>,
): AlbumPerson[] {
  if (faces.length === 0) return []

  const clusters: DetectedFace[][] = []

  for (const face of faces) {
    let bestCluster = -1
    let bestSim = -1

    for (let ci = 0; ci < clusters.length; ci++) {
      let maxSim = -1
      for (const member of clusters[ci]) {
        const sim = cosineSimilarity(face.embedding, member.embedding)
        if (sim > maxSim) maxSim = sim
      }
      if (maxSim > bestSim) {
        bestSim = maxSim
        bestCluster = ci
      }
    }

    if (bestSim >= SIMILARITY_THRESHOLD && bestCluster >= 0) {
      clusters[bestCluster].push(face)
    } else {
      clusters.push([face])
    }
  }

  return clusters.map((cluster, idx) => {
    const photoIds = [...new Set(cluster.map((f) => f.photoId))]

    const best = cluster.reduce((a, b) => {
      const aArea = a.box[2] * a.box[3]
      const bArea = b.box[2] * b.box[3]
      return bArea > aArea ? b : a
    })

    const label = existingLabels?.get(best.photoId)
    const displayName = label || `אדם ${idx + 1}`

    return {
      id: crypto.randomUUID(),
      displayName,
      photoIds,
      avatarPhotoId: best.photoId,
      avatarCropUrl: best.cropDataUrl,
    }
  })
}
