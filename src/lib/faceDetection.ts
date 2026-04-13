import type { Photo, AlbumPerson } from '../types'

/* ─── Types ──────────────────────────────────────────────────────────── */

export interface DetectedFace {
  photoId: string
  /** fullUrl — matches what spreads store in pe.photoUrl */
  photoUrl: string
  box: [number, number, number, number]
  embedding: number[]
  cropDataUrl: string
  /** 0-based index among faces detected in the same photo (sorted by box area desc) */
  faceIndexInPhoto: number
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
      detector: { enabled: true, rotation: true, maxDetected: 20, minConfidence: 0.15 },
      mesh: { enabled: true },
      attention: { enabled: false },
      iris: { enabled: false },
      description: { enabled: true, minConfidence: 0 },
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
  await humanInstance.warmup()
  return humanInstance
}

/* ─── Image helpers ──────────────────────────────────────────────────── */

const DETECT_MAX_DIM = 1280
const CROP_SIZE = 128

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

/**
 * Resize an image for WebGL detection — caps at DETECT_MAX_DIM on longest side.
 * Returns the canvas and the scale factor used.
 */
function resizeForDetection(img: HTMLImageElement): { canvas: HTMLCanvasElement; scale: number } {
  const { naturalWidth: w, naturalHeight: h } = img
  const scale = Math.min(1, DETECT_MAX_DIM / Math.max(w, h))
  const cw = Math.round(w * scale)
  const ch = Math.round(h * scale)

  const canvas = document.createElement('canvas')
  canvas.width = cw
  canvas.height = ch
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, cw, ch)
  return { canvas, scale }
}

/**
 * Crop face region from the ORIGINAL (non-resized) image.
 * `box` is in resized coords, `scale` maps back to original.
 */
function cropFace(
  origImg: HTMLImageElement,
  box: [number, number, number, number],
  scale: number,
): string {
  const [bx, by, bw, bh] = box.map((v) => v / scale)

  const pad = Math.max(bw, bh) * 0.4
  const cx = bx + bw / 2
  const cy = by + bh / 2
  const side = Math.max(bw, bh) + pad * 2
  const sx = Math.max(0, cx - side / 2)
  const sy = Math.max(0, cy - side / 2)
  const sw = Math.min(side, origImg.naturalWidth - sx)
  const sh = Math.min(side, origImg.naturalHeight - sy)

  const canvas = document.createElement('canvas')
  canvas.width = CROP_SIZE
  canvas.height = CROP_SIZE
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(origImg, sx, sy, sw, sh, 0, 0, CROP_SIZE, CROP_SIZE)
  return canvas.toDataURL('image/jpeg', 0.88)
}

/* ─── Detection ──────────────────────────────────────────────────────── */

const RETRY_CROP_SIZE = 512
const MIN_FACE_SCORE = 0.15

/**
 * When the descriptor fails to produce an embedding for a detected face,
 * crop and enlarge just that face region and re-run detection to get the embedding.
 */
async function retryEmbeddingForFace(
  human: import('@vladmandic/human').default,
  origImg: HTMLImageElement,
  box: [number, number, number, number],
  scale: number,
): Promise<number[] | null> {
  try {
    const [bx, by, bw, bh] = box.map((v) => v / scale)
    const pad = Math.max(bw, bh) * 0.6
    const cx = bx + bw / 2
    const cy = by + bh / 2
    const side = Math.max(bw, bh) + pad * 2
    const sx = Math.max(0, cx - side / 2)
    const sy = Math.max(0, cy - side / 2)
    const sw = Math.min(side, origImg.naturalWidth - sx)
    const sh = Math.min(side, origImg.naturalHeight - sy)

    const canvas = document.createElement('canvas')
    canvas.width = RETRY_CROP_SIZE
    canvas.height = RETRY_CROP_SIZE
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(origImg, sx, sy, sw, sh, 0, 0, RETRY_CROP_SIZE, RETRY_CROP_SIZE)

    const result = await human.detect(canvas)
    if (result.face?.[0]?.embedding?.length) {
      return result.face[0].embedding
    }
  } catch { /* ignore retry failures */ }
  return null
}

export async function detectFacesInPhotos(
  photos: Photo[],
  onProgress?: ProgressCb,
): Promise<DetectedFace[]> {
  const human = await getHuman()
  const all: DetectedFace[] = []

  let loadFailures = 0
  let detectFailures = 0
  let noEmbeddings = 0
  let retriedEmbeddings = 0

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i]
    const url = photo.fullUrl || photo.thumbnailUrl
    if (!url) continue

    try {
      const img = await loadImage(url)
      const { canvas, scale } = resizeForDetection(img)

      const result = await human.detect(canvas)

      if (result.face && result.face.length > 0) {
        console.log(
          `[FaceDetection] Photo ${photo.id}: detected ${result.face.length} raw faces, ` +
          `scores: [${result.face.map((f) => (f.score ?? 0).toFixed(2)).join(', ')}], ` +
          `embeddings: [${result.face.map((f) => f.embedding?.length ?? 0).join(', ')}]`,
        )

        const scoredFaces = result.face
          .filter((f) => (f.score ?? 0) >= MIN_FACE_SCORE)
          .sort((a, b) => (b.box[2] * b.box[3]) - (a.box[2] * a.box[3]))

        let faceIdx = 0
        for (const face of scoredFaces) {
          let embedding = face.embedding?.length ? face.embedding : null

          if (!embedding) {
            embedding = await retryEmbeddingForFace(human, img, face.box, scale)
            if (embedding) retriedEmbeddings++
          }

          if (!embedding) {
            noEmbeddings++
            continue
          }

          const cropUrl = cropFace(img, face.box, scale)
          all.push({
            photoId: photo.id,
            photoUrl: photo.fullUrl || photo.thumbnailUrl,
            box: face.box,
            embedding,
            cropDataUrl: cropUrl,
            faceIndexInPhoto: faceIdx,
          })
          faceIdx++
        }
      } else {
        detectFailures++
      }
    } catch (err) {
      loadFailures++
      console.warn(`[FaceDetection] Failed for photo ${photo.id}:`, err)
    }

    onProgress?.(i + 1, photos.length)
  }

  console.log(
    `[FaceDetection] Summary: ${all.length} faces from ${photos.length} photos ` +
    `(${loadFailures} load failures, ${detectFailures} no-face, ` +
    `${noEmbeddings} no-embedding, ${retriedEmbeddings} recovered via retry)`,
  )

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

const SIMILARITY_THRESHOLD = 0.44
const MIN_PHOTOS_FOR_PERSON = 3

function avgEmbedding(faces: DetectedFace[]): number[] {
  const dim = faces[0].embedding.length
  const avg = new Array(dim).fill(0)
  for (const f of faces) {
    for (let i = 0; i < dim; i++) avg[i] += f.embedding[i]
  }
  for (let i = 0; i < dim; i++) avg[i] /= faces.length
  return avg
}

/**
 * @param existingLabels  Key = `${photoId}:${faceIndex}` → Hebrew label.
 *                        Falls back to legacy `photoId`-only key for compat.
 */
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
      const centroid = avgEmbedding(clusters[ci])
      const sim = cosineSimilarity(face.embedding, centroid)
      if (sim > bestSim) {
        bestSim = sim
        bestCluster = ci
      }
    }

    if (bestSim >= SIMILARITY_THRESHOLD && bestCluster >= 0) {
      clusters[bestCluster].push(face)
    } else {
      clusters.push([face])
    }
  }

  const people: AlbumPerson[] = []
  const unidentifiedPhotoIds = new Set<string>()
  const unidentifiedUrls: Record<string, string> = {}
  let unidentifiedCrop: string | undefined
  let unidentifiedAvatarId: string | undefined

  let namedIdx = 0
  for (const cluster of clusters) {
    const photoIds = [...new Set(cluster.map((f) => f.photoId))]

    const best = cluster.reduce((a, b) => {
      const aArea = a.box[2] * a.box[3]
      const bArea = b.box[2] * b.box[3]
      return bArea > aArea ? b : a
    })

    const urlLookup: Record<string, string> = {}
    for (const f of cluster) urlLookup[f.photoId] = f.photoUrl

    if (photoIds.length < MIN_PHOTOS_FOR_PERSON) {
      for (const pid of photoIds) {
        unidentifiedPhotoIds.add(pid)
        unidentifiedUrls[pid] = urlLookup[pid]
      }
      if (!unidentifiedCrop) {
        unidentifiedCrop = best.cropDataUrl
        unidentifiedAvatarId = best.photoId
      }
      continue
    }

    namedIdx++

    let label: string | undefined
    if (existingLabels) {
      const counts = new Map<string, number>()
      for (const f of cluster) {
        const perFaceKey = `${f.photoId}:${f.faceIndexInPhoto}`
        const lbl = existingLabels.get(perFaceKey) ?? existingLabels.get(f.photoId)
        if (lbl) counts.set(lbl, (counts.get(lbl) ?? 0) + 1)
      }
      if (counts.size > 0) {
        label = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0]
      }
    }
    const displayName = label || `אדם ${namedIdx}`

    people.push({
      id: crypto.randomUUID(),
      displayName,
      photoIds,
      avatarPhotoId: best.photoId,
      avatarCropUrl: best.cropDataUrl,
      photoUrlLookup: urlLookup,
    })
  }

  people.sort((a, b) => b.photoIds.length - a.photoIds.length)

  if (unidentifiedPhotoIds.size > 0) {
    people.push({
      id: crypto.randomUUID(),
      displayName: 'לא מזוהה',
      photoIds: [...unidentifiedPhotoIds],
      avatarPhotoId: unidentifiedAvatarId || '',
      avatarCropUrl: unidentifiedCrop,
      photoUrlLookup: unidentifiedUrls,
    })
  }

  return people
}
