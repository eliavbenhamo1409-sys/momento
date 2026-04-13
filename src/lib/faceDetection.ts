import { supabase } from './supabase'
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
  /** AWS Rekognition face ID (used for match-based clustering) */
  awsFaceId?: string
  /** Face IDs that Rekognition matched this face to */
  matchedFaceIds?: string[]
}

type ProgressCb = (done: number, total: number, msg?: string) => void

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
 * Convert Rekognition BoundingBox (relative 0-1) to absolute pixels
 * in the resized canvas coordinate system.
 */
function rekognitionBoxToAbsolute(
  bbox: { Width: number; Height: number; Left: number; Top: number },
  canvasWidth: number,
  canvasHeight: number,
): [number, number, number, number] {
  return [
    bbox.Left * canvasWidth,
    bbox.Top * canvasHeight,
    bbox.Width * canvasWidth,
    bbox.Height * canvasHeight,
  ]
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

/* ─── Edge function call ─────────────────────────────────────────────── */

interface RekognitionFaceResult {
  awsFaceId: string
  confidence: number
  boundingBox: { Width: number; Height: number; Left: number; Top: number }
  faceIndexInPhoto: number
  matches: Array<{ awsFaceId: string; similarity: number }>
}

async function callDetectFaces(
  photoId: string,
  imageBase64: string,
): Promise<RekognitionFaceResult[]> {
  const { data, error } = await supabase.functions.invoke('detect-faces', {
    body: { photoId, imageBase64 },
  })

  if (error) {
    console.error(`[FaceDetection] Edge function error for ${photoId}:`, error)
    throw error
  }

  return data?.faces ?? []
}

/* ─── Detection ──────────────────────────────────────────────────────── */

export async function detectFacesInPhotos(
  photos: Photo[],
  onProgress?: ProgressCb,
): Promise<DetectedFace[]> {
  const all: DetectedFace[] = []

  let loadFailures = 0
  let detectFailures = 0

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i]
    const url = photo.fullUrl || photo.thumbnailUrl
    if (!url) continue

    try {
      const img = await loadImage(url)
      const { canvas, scale } = resizeForDetection(img)

      const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.85)
      const imageBase64 = jpegDataUrl.replace(/^data:image\/jpeg;base64,/, '')

      const faces = await callDetectFaces(photo.id, imageBase64)

      if (faces.length > 0) {
        console.log(
          `[FaceDetection] Photo ${photo.id}: ${faces.length} faces, ` +
          `confidence: [${faces.map((f) => f.confidence.toFixed(1)).join(', ')}]`,
        )

        for (const face of faces) {
          const box = rekognitionBoxToAbsolute(
            face.boundingBox,
            canvas.width,
            canvas.height,
          )
          const cropUrl = cropFace(img, box, scale)

          all.push({
            photoId: photo.id,
            photoUrl: photo.fullUrl || photo.thumbnailUrl,
            box,
            embedding: [],
            cropDataUrl: cropUrl,
            faceIndexInPhoto: face.faceIndexInPhoto,
            awsFaceId: face.awsFaceId,
            matchedFaceIds: face.matches.map((m) => m.awsFaceId),
          })
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
    `(${loadFailures} failures, ${detectFailures} no-face)`,
  )

  return all
}

/* ─── Clustering by Rekognition match graph ──────────────────────────── */

const MIN_PHOTOS_FOR_PERSON = 3

/**
 * Union-Find for grouping faces by Rekognition match results.
 */
class UnionFind {
  private parent: Map<string, string> = new Map()

  find(x: string): string {
    if (!this.parent.has(x)) this.parent.set(x, x)
    let root = x
    while (this.parent.get(root) !== root) root = this.parent.get(root)!
    let cur = x
    while (cur !== root) {
      const next = this.parent.get(cur)!
      this.parent.set(cur, root)
      cur = next
    }
    return root
  }

  union(a: string, b: string): void {
    const ra = this.find(a)
    const rb = this.find(b)
    if (ra !== rb) this.parent.set(rb, ra)
  }
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

  const uf = new UnionFind()
  const faceIdToIdx = new Map<string, number>()

  for (let i = 0; i < faces.length; i++) {
    const f = faces[i]
    if (f.awsFaceId) {
      faceIdToIdx.set(f.awsFaceId, i)
      uf.find(f.awsFaceId)
    }
  }

  for (const face of faces) {
    if (!face.awsFaceId || !face.matchedFaceIds) continue
    for (const matchId of face.matchedFaceIds) {
      if (faceIdToIdx.has(matchId)) {
        uf.union(face.awsFaceId, matchId)
      }
    }
  }

  const groups = new Map<string, DetectedFace[]>()
  for (const face of faces) {
    const key = face.awsFaceId ? uf.find(face.awsFaceId) : `solo_${face.photoId}_${face.faceIndexInPhoto}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(face)
  }

  const clusters = [...groups.values()]

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
