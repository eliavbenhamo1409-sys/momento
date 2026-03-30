import exifr from 'exifr'
import type { Photo, PhotoOrientation } from '../types'

const MAX_VISION_DIM = 512

/** Detect orientation from image dimensions */
export function detectOrientation(width: number, height: number): PhotoOrientation {
  const ratio = width / height
  if (ratio > 1.15) return 'landscape'
  if (ratio < 0.87) return 'portrait'
  return 'square'
}

/** Read actual dimensions from a File using an Image element */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    img.src = url
  })
}

/**
 * Resize an image File to maxDim (longest side) and return a base64 data URL.
 * Uses an offscreen canvas for efficiency.
 */
export function resizeToBase64(file: File, maxDim = MAX_VISION_DIM): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)

      let { naturalWidth: w, naturalHeight: h } = img
      if (w > maxDim || h > maxDim) {
        const scale = maxDim / Math.max(w, h)
        w = Math.round(w * scale)
        h = Math.round(h * scale)
      }

      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, w, h)

      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image for resize'))
    }
    img.src = url
  })
}

/**
 * Prepare a photo for the OpenAI vision API.
 * - If the photo has a local File, resize to 512px and return base64.
 * - If it's a remote URL (picsum etc.), return the URL directly.
 */
export async function preparePhotoForVision(
  photo: Photo,
): Promise<{ type: 'url'; url: string } | { type: 'base64'; dataUrl: string }> {
  if (photo.file) {
    const dataUrl = await resizeToBase64(photo.file, MAX_VISION_DIM)
    return { type: 'base64', dataUrl }
  }
  return { type: 'url', url: photo.fullUrl }
}

/** Extract capture date from EXIF metadata; falls back to file.lastModified */
export async function extractPhotoDate(file: File): Promise<Date> {
  try {
    const exif = await exifr.parse(file, { pick: ['DateTimeOriginal', 'CreateDate', 'ModifyDate'] })
    const raw = exif?.DateTimeOriginal ?? exif?.CreateDate ?? exif?.ModifyDate
    if (raw instanceof Date && !isNaN(raw.getTime())) return raw
    if (typeof raw === 'string') {
      const parsed = new Date(raw)
      if (!isNaN(parsed.getTime())) return parsed
    }
  } catch { /* EXIF not available */ }
  return new Date(file.lastModified)
}

const THUMB_MAX_DIM = 300

/**
 * Create a small thumbnail blob URL from a File.
 * Returns { thumbnailUrl, width, height } where width/height are the real image dimensions.
 */
export function createThumbnailUrl(file: File): Promise<{ thumbnailUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const { naturalWidth: w, naturalHeight: h } = img
      let tw = w, th = h
      if (w > THUMB_MAX_DIM || h > THUMB_MAX_DIM) {
        const scale = THUMB_MAX_DIM / Math.max(w, h)
        tw = Math.round(w * scale)
        th = Math.round(h * scale)
      }
      const canvas = document.createElement('canvas')
      canvas.width = tw
      canvas.height = th
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, tw, th)
      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error('Thumbnail canvas failed')); return }
          resolve({ thumbnailUrl: URL.createObjectURL(blob), width: w, height: h })
        },
        'image/jpeg',
        0.7,
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image for thumbnail'))
    }
    img.src = url
  })
}

/** Split an array into batches of a given size */
export function batchArray<T>(arr: T[], batchSize: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += batchSize) {
    result.push(arr.slice(i, i + batchSize))
  }
  return result
}
