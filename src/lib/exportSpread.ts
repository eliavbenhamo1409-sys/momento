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

/**
 * html2canvas cannot parse oklab() / oklch() color functions used by Tailwind v4.
 * Before rendering, walk all elements in the cloned document and replace any
 * computed oklab/oklch values with a hex fallback via a temporary canvas context.
 */
function sanitizeCloneColors(doc: Document) {
  const ctx = doc.createElement('canvas').getContext('2d')
  if (!ctx) return

  const elements = doc.querySelectorAll('*')
  const colorProps = ['color', 'background-color', 'border-color', 'outline-color'] as const

  for (const el of elements) {
    const style = (el as HTMLElement).style
    if (!style) continue
    const computed = doc.defaultView?.getComputedStyle(el)
    if (!computed) continue

    for (const prop of colorProps) {
      const val = computed.getPropertyValue(prop)
      if (val && (val.includes('oklab') || val.includes('oklch'))) {
        ctx.fillStyle = val
        const hex = ctx.fillStyle
        style.setProperty(prop, hex, 'important')
      }
    }
  }
}

/**
 * html2canvas does not support object-fit:cover on <img> elements — it renders
 * the raw image at natural pixel dimensions, producing extreme zoom-in artifacts.
 * This walks the cloned DOM and replaces every object-fit:cover <img> with a
 * <div> using background-image + background-size:cover, which html2canvas
 * renders correctly.
 */
function fixObjectFitImages(doc: Document) {
  const win = doc.defaultView
  if (!win) return

  const images = doc.querySelectorAll('img')
  for (const img of images) {
    const computed = win.getComputedStyle(img)
    const objectFit = computed.objectFit
    if (objectFit !== 'cover' && objectFit !== 'contain') continue

    const src = img.getAttribute('src') || img.src
    if (!src || src.startsWith('data:')) continue

    const div = doc.createElement('div')

    div.style.width = computed.width
    div.style.height = computed.height
    div.style.minWidth = computed.minWidth
    div.style.minHeight = computed.minHeight
    div.style.maxWidth = computed.maxWidth
    div.style.maxHeight = computed.maxHeight
    div.style.flexGrow = computed.flexGrow
    div.style.flexShrink = computed.flexShrink
    div.style.flexBasis = computed.flexBasis

    div.style.backgroundImage = `url("${src}")`
    div.style.backgroundSize = objectFit
    div.style.backgroundPosition = computed.objectPosition || 'center'
    div.style.backgroundRepeat = 'no-repeat'

    if (computed.transform && computed.transform !== 'none') {
      div.style.transform = computed.transform
    }
    if (computed.transformOrigin) {
      div.style.transformOrigin = computed.transformOrigin
    }

    div.style.borderRadius = computed.borderRadius
    div.style.overflow = computed.overflow

    img.parentNode?.replaceChild(div, img)
  }
}

/**
 * All onclone fixups combined into a single pass.
 */
function prepareCloneForCapture(doc: Document) {
  sanitizeCloneColors(doc)
  fixObjectFitImages(doc)
}

/**
 * Pre-loads all images referenced in the element tree (both <img> tags and
 * CSS background-image urls) so html2canvas finds them already in the browser
 * cache and doesn't silently fail on slow / CORS-redirected fetches.
 */
async function preloadImages(element: HTMLElement): Promise<void> {
  const urls = new Set<string>()

  const imgs = element.querySelectorAll('img')
  for (const img of imgs) {
    if (img.src && !img.src.startsWith('data:')) urls.add(img.src)
  }

  const allEls = element.querySelectorAll('*')
  for (const el of allEls) {
    const computed = window.getComputedStyle(el)
    const bg = computed.backgroundImage
    if (bg && bg !== 'none') {
      const match = bg.match(/url\(["']?(https?:\/\/[^"')]+)["']?\)/)
      if (match?.[1]) urls.add(match[1])
    }
  }

  if (urls.size === 0) return

  const loadSingle = (url: string): Promise<void> =>
    new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve()
      img.onerror = () => resolve()
      img.src = url
      setTimeout(resolve, 8000)
    })

  await Promise.all([...urls].map(loadSingle))
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

const EXPORT_TIMEOUT_MS = 45_000
const MIN_VALID_BLOB_BYTES = 10_000

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    promise.then(
      (v) => { clearTimeout(timer); resolve(v) },
      (e) => { clearTimeout(timer); reject(e) },
    )
  })
}

export async function exportSpreadToDataUrl(
  element: HTMLElement,
  options?: ExportOptions,
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  await preloadImages(element)

  const canvas = await withTimeout(
    html2canvas(element, {
      scale: opts.scale,
      backgroundColor: opts.backgroundColor,
      useCORS: true,
      allowTaint: true,
      logging: false,
      onclone: (_doc) => { prepareCloneForCapture(_doc) },
    }),
    EXPORT_TIMEOUT_MS,
    'html2canvas',
  )

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

async function captureToBlob(
  element: HTMLElement,
  opts: Required<ExportOptions>,
): Promise<Blob> {
  await preloadImages(element)

  const canvas = await withTimeout(
    html2canvas(element, {
      scale: opts.scale,
      backgroundColor: opts.backgroundColor,
      useCORS: true,
      allowTaint: true,
      logging: false,
      onclone: (_doc) => { prepareCloneForCapture(_doc) },
    }),
    EXPORT_TIMEOUT_MS,
    'html2canvas',
  )

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
 * Exports a DOM element to a JPEG blob with built-in retry logic.
 * Retries up to 2 times if the blob is suspiciously small (< 10 KB),
 * which typically indicates a blank or corrupted capture.
 */
export async function exportSpreadToBlob(
  element: HTMLElement,
  options?: ExportOptions,
): Promise<Blob> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const maxAttempts = 3

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const blob = await captureToBlob(element, opts)

      if (blob.size >= MIN_VALID_BLOB_BYTES || attempt === maxAttempts) {
        return blob
      }

      await new Promise((r) => setTimeout(r, 500 * attempt))
    } catch (err) {
      if (attempt === maxAttempts) throw err
      await new Promise((r) => setTimeout(r, 500 * attempt))
    }
  }

  throw new Error('Export failed after maximum retries')
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
