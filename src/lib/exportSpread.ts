/**
 * Spread Export Module
 *
 * Captures rendered spread DOM nodes as high-quality JPG images
 * using html2canvas for DOM-to-image conversion.
 */

import html2canvas from 'html2canvas'

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

/**
 * Exports a single spread DOM element to a JPG data URL.
 */
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

/**
 * Exports a single spread DOM element and triggers a file download.
 */
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

/**
 * Exports a single spread to a Blob.
 */
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

/**
 * Exports all spreads in the album. Expects an array of DOM refs.
 * Returns an array of data URLs.
 */
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
