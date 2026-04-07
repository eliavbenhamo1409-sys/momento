import html2canvas from 'html2canvas'
import { ALBUM_SIZES } from './constants'

export interface ExportOptions {
  quality?: number
  scale?: number
  backgroundColor?: string
}

const DEFAULT_OPTIONS: Required<ExportOptions> = {
  quality: 0.92,
  scale: 2,
  backgroundColor: '#FFFFFF',
}

const TARGET_DPI = 300
const CM_PER_INCH = 2.54

/**
 * Computes the html2canvas scale factor needed to produce a 300 DPI output
 * for a given album size. The rendered DOM element width is compared to the
 * target pixel width derived from the album's physical open dimensions.
 */
export function calc300DpiScale(renderedWidthPx: number, albumSizeId: string): number {
  const size = ALBUM_SIZES.find((s) => s.id === albumSizeId)
  if (!size || renderedWidthPx <= 0) return DEFAULT_OPTIONS.scale

  const targetWidthPx = (size.openW / CM_PER_INCH) * TARGET_DPI
  const scale = targetWidthPx / renderedWidthPx

  const MAX_SCALE = 12
  return Math.min(scale, MAX_SCALE)
}

export async function exportSpreadToDataUrl(
  element: HTMLElement,
  options?: ExportOptions,
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  const canvas = await html2canvas(element, {
    scale: opts.scale,
    backgroundColor: opts.backgroundColor,
    useCORS: true,
    allowTaint: true,
    logging: false,
  })

  return canvas.toDataURL('image/jpeg', opts.quality)
}

export async function downloadSpreadAsJpg(
  element: HTMLElement,
  filename: string,
  options?: ExportOptions,
): Promise<void> {
  const dataUrl = await exportSpreadToDataUrl(element, options)

  const link = document.createElement('a')
  link.download = filename.endsWith('.jpg') ? filename : `${filename}.jpg`
  link.href = dataUrl
  link.click()
}

export async function exportSpreadToBlob(
  element: HTMLElement,
  options?: ExportOptions,
): Promise<Blob> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  const canvas = await html2canvas(element, {
    scale: opts.scale,
    backgroundColor: opts.backgroundColor,
    useCORS: true,
    allowTaint: true,
    logging: false,
  })

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Failed to create blob from canvas'))
      },
      'image/jpeg',
      opts.quality,
    )
  })
}

export async function exportAlbumSpreads(
  elements: HTMLElement[],
  options?: ExportOptions,
): Promise<string[]> {
  const results: string[] = []
  for (const el of elements) {
    const dataUrl = await exportSpreadToDataUrl(el, options)
    results.push(dataUrl)
  }
  return results
}

/**
 * Exports all spread elements as 300 DPI JPEG blobs.
 * Calculates the correct scale factor based on album physical dimensions.
 * Calls onProgress(index, total) after each spread is rendered.
 */
export async function exportAllSpreadsAsBlobs(
  elements: HTMLElement[],
  albumSizeId: string,
  onProgress?: (index: number, total: number) => void,
): Promise<Blob[]> {
  const blobs: Blob[] = []

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i]
    const scale = calc300DpiScale(el.offsetWidth, albumSizeId)

    const blob = await exportSpreadToBlob(el, {
      scale,
      quality: 0.92,
      backgroundColor: '#FFFFFF',
    })

    blobs.push(blob)
    onProgress?.(i + 1, elements.length)
  }

  return blobs
}
