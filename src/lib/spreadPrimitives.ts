/**
 * Spread Primitive Vocabulary
 *
 * Defines the strict catalog of element types the AI may compose spreads from.
 * Each primitive has constraint bounds that are validated after AI generation
 * and injected into the AI prompt so it knows the allowed design space.
 */

export interface PrimitiveBounds {
  x: [number, number]
  y: [number, number]
  w: [number, number]
  h: [number, number]
  rotation: [number, number]
  zIndex: [number, number]
}

export interface PrimitiveSchema {
  type: string
  description: string
  bounds: PrimitiveBounds
  maxPerSpread: number
}

const PHOTO_SLOT: PrimitiveSchema = {
  type: 'photo-slot',
  description: 'Empty rectangle for a photo. Has position, size, rotation, frame styling, and an importance role.',
  bounds: { x: [0, 95], y: [0, 95], w: [12, 100], h: [12, 100], rotation: [-15, 15], zIndex: [1, 10] },
  maxPerSpread: 6,
}

const TEXT_BLOCK: PrimitiveSchema = {
  type: 'text-block',
  description: 'Quote, caption, or decorative script overlay. Positioned absolutely with font, size, color, alignment.',
  bounds: { x: [0, 95], y: [0, 95], w: [8, 90], h: [5, 60], rotation: [-20, 20], zIndex: [5, 20] },
  maxPerSpread: 3,
}

const LINE: PrimitiveSchema = {
  type: 'line',
  description: 'Thin accent line — horizontal, vertical, or angled. Fades gracefully with gradient transparency.',
  bounds: { x: [0, 100], y: [0, 100], w: [5, 100], h: [0.1, 2], rotation: [-90, 90], zIndex: [0, 5] },
  maxPerSpread: 4,
}

const GRADIENT_WASH: PrimitiveSchema = {
  type: 'gradient-wash',
  description: 'Soft color wash layer using a radial or linear gradient. Adds atmosphere behind content.',
  bounds: { x: [0, 100], y: [0, 100], w: [20, 100], h: [20, 100], rotation: [0, 0], zIndex: [0, 1] },
  maxPerSpread: 2,
}

const CORNER_ORNAMENT: PrimitiveSchema = {
  type: 'corner-ornament',
  description: 'L-shaped decorative bracket at a page corner. Subtle, refined.',
  bounds: { x: [0, 96], y: [0, 96], w: [3, 8], h: [3, 8], rotation: [0, 0], zIndex: [0, 5] },
  maxPerSpread: 8,
}

const FLOURISH: PrimitiveSchema = {
  type: 'flourish',
  description: 'Decorative SVG swirl or curve. Adds editorial elegance.',
  bounds: { x: [5, 90], y: [2, 95], w: [15, 60], h: [3, 12], rotation: [-180, 180], zIndex: [0, 3] },
  maxPerSpread: 2,
}

export const PRIMITIVE_CATALOG: PrimitiveSchema[] = [
  PHOTO_SLOT,
  TEXT_BLOCK,
  LINE,
  GRADIENT_WASH,
  CORNER_ORNAMENT,
  FLOURISH,
]

export const SPREAD_CONSTRAINTS = {
  pageAspectRatio: '10.5:9 (each page is half of a 21:9 spread)',
  gutterZone: { xMin: 48, xMax: 52, rule: 'No important elements should sit in the gutter zone' },
  maxElementsPerSpread: 18,
  minMarginPercent: 2,
  maxPhotosPerSpread: 6,
  maxTextBlocksPerSpread: 3,
  validTextures: ['none', 'paper', 'linen', 'watercolor', 'grain'] as const,
  validFonts: ['Heebo', 'Plus Jakarta Sans', 'Great Vibes', 'Dancing Script'] as const,
}

/**
 * Builds a human-readable description of the primitive vocabulary
 * suitable for injection into an AI system prompt.
 */
export function describePrimitivesForPrompt(): string {
  const lines: string[] = [
    'AVAILABLE PRIMITIVES (you may ONLY use these element types):',
    '',
  ]

  for (const p of PRIMITIVE_CATALOG) {
    lines.push(`### ${p.type}`)
    lines.push(p.description)
    lines.push(`  Bounds: x=${p.bounds.x[0]}-${p.bounds.x[1]}%, y=${p.bounds.y[0]}-${p.bounds.y[1]}%, w=${p.bounds.w[0]}-${p.bounds.w[1]}%, h=${p.bounds.h[0]}-${p.bounds.h[1]}%`)
    lines.push(`  Rotation: ${p.bounds.rotation[0]} to ${p.bounds.rotation[1]} degrees`)
    lines.push(`  Max per spread: ${p.maxPerSpread}`)
    lines.push('')
  }

  lines.push('SPREAD CONSTRAINTS:')
  lines.push(`- Each page is ${SPREAD_CONSTRAINTS.pageAspectRatio}`)
  lines.push(`- Gutter zone: x ${SPREAD_CONSTRAINTS.gutterZone.xMin}-${SPREAD_CONSTRAINTS.gutterZone.xMax}% — ${SPREAD_CONSTRAINTS.gutterZone.rule}`)
  lines.push(`- Max ${SPREAD_CONSTRAINTS.maxElementsPerSpread} elements per spread`)
  lines.push(`- Max ${SPREAD_CONSTRAINTS.maxPhotosPerSpread} photo slots per spread`)
  lines.push(`- Max ${SPREAD_CONSTRAINTS.maxTextBlocksPerSpread} text blocks per spread`)
  lines.push(`- Minimum margin: ${SPREAD_CONSTRAINTS.minMarginPercent}%`)
  lines.push(`- Available textures: ${SPREAD_CONSTRAINTS.validTextures.join(', ')}`)
  lines.push(`- Available fonts: ${SPREAD_CONSTRAINTS.validFonts.join(', ')}`)

  return lines.join('\n')
}
