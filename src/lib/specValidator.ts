/**
 * Spec Validator & Normalizer
 *
 * Takes raw AISpreadSpec objects from the AI and produces clean, safe
 * SpreadDesign objects ready for rendering. Enforces constraint bounds,
 * clamps values, validates colors, and converts AI types to renderer types.
 */

import type {
  AISpreadSpec,
  AIPhotoSlotSpec,
  AITextBlockSpec,
  AIDecorationSpec,
  SpreadDesign,
  SpreadDesignBackground,
  SpreadElement,
  PhotoElement,
  QuoteElement,
  DecorativeElement,
  DecorativeElementType,
  DesignFamily,
  SlotImportance,
  TextureType,
} from '../types'
import { SPREAD_CONSTRAINTS, PRIMITIVE_CATALOG } from './spreadPrimitives'

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

const CSS_COLOR_RE = /^(#[0-9a-fA-F]{3,8}|rgba?\([\d\s,./]+\)|hsla?\([\d\s%,./]+\)|[a-z]+)$/i

function isValidCssColor(color: string): boolean {
  return CSS_COLOR_RE.test(color.trim())
}

function safeColor(color: string | undefined, fallback: string): string {
  if (!color) return fallback
  return isValidCssColor(color) ? color : fallback
}

function safeTexture(t: string | undefined): TextureType {
  const valid = SPREAD_CONSTRAINTS.validTextures as readonly string[]
  if (t && valid.includes(t)) return t as TextureType
  return 'none'
}

function getBounds(primitiveType: string) {
  return PRIMITIVE_CATALOG.find((p) => p.type === primitiveType)?.bounds
}

function roleToImportance(role: string): SlotImportance {
  switch (role) {
    case 'hero': return 'hero'
    case 'support': return 'primary'
    case 'accent': return 'accent'
    default: return 'secondary'
  }
}

function validateBackground(
  bg: AISpreadSpec['background'],
  family: DesignFamily,
): SpreadDesignBackground {
  let baseColor = safeColor(bg?.baseColor, family.palette.background)

  if (family.constraints.forbidDarkBackgrounds) {
    const hex = baseColor.replace('#', '')
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16)
      const g = parseInt(hex.slice(2, 4), 16)
      const b = parseInt(hex.slice(4, 6), 16)
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
      if (luminance < 0.4) {
        baseColor = family.palette.background
      }
    }
  }

  const result: SpreadDesignBackground = {
    color: baseColor,
  }

  if (bg?.blurPhotoSlot && (bg.blurOpacity ?? 0) > 0 && family.background.allowPhotoBlur) {
    result.blurOpacity = clamp(bg.blurOpacity ?? 0.06, 0, 0.2)
    result.blurPx = family.background.photoBlurPx || 60
  }

  if (bg?.texture) {
    const tex = safeTexture(bg.texture)
    if (tex !== 'none') {
      result.texture = tex
      result.textureOpacity = clamp(bg.textureOpacity ?? 0.04, 0, 0.15)
    }
  }

  if (bg?.gradient) {
    const gradColors = (bg.gradient.colors ?? []).map((c) => safeColor(c, 'transparent'))
    const gradType = bg.gradient.type === 'linear' ? 'linear-gradient' : 'radial-gradient'
    const position = bg.gradient.position || '50% 50%'

    if (gradColors.length >= 2) {
      const gradientStr = gradType === 'radial-gradient'
        ? `radial-gradient(circle at ${position}, ${gradColors.join(', ')})`
        : `linear-gradient(${position}, ${gradColors.join(', ')})`
      result.gradientWash = gradientStr
      result.gradientWashOpacity = clamp(bg.textureOpacity ?? 0.08, 0, 0.3)
      result.gradientBlendMode = 'multiply'
    }
  }

  return result
}

function validatePhotoSlot(
  slot: AIPhotoSlotSpec,
  family: DesignFamily,
): PhotoElement {
  const bounds = getBounds('photo-slot')!

  const x = clamp(slot.x ?? 0, bounds.x[0], bounds.x[1])
  const y = clamp(slot.y ?? 0, bounds.y[0], bounds.y[1])
  const w = clamp(slot.w ?? 30, bounds.w[0], bounds.w[1])
  const h = clamp(slot.h ?? 30, bounds.h[0], bounds.h[1])

  const page = slot.page === 'right' ? 'right' : 'left'
  if (page === 'left' && x + w > 48) {
    /* slot bleeds into gutter — clamp width */
  }
  if (page === 'right' && x < 52) {
    /* slot starts in gutter — will be okay if mostly on right */
  }

  const rotation = family.layoutBehavior.canRotatePhotos
    ? clamp(slot.rotation ?? 0, bounds.rotation[0], bounds.rotation[1])
    : 0

  return {
    type: 'photo',
    slotId: slot.id || `slot-${Math.random().toString(36).slice(2, 6)}`,
    photoId: '',
    photoUrl: null,
    page,
    x,
    y,
    width: w,
    height: h,
    rotation,
    borderWidth: clamp(slot.frame?.borderWidth ?? family.photoFrame.borderWidth, 0, 8),
    borderColor: safeColor(slot.frame?.borderColor, family.photoFrame.borderColor),
    borderRadius: clamp(slot.radius ?? family.photoFrame.borderRadius, 0, 24),
    shadow: slot.frame?.shadow ?? family.photoFrame.shadow,
    padding: clamp(slot.frame?.padding ?? family.photoFrame.innerPadding, 0, 20),
    zIndex: clamp(slot.zIndex ?? 2, bounds.zIndex[0], bounds.zIndex[1]),
    objectPosition: '50% 50%',
    objectFit: 'cover',
    importance: roleToImportance(slot.role),
  }
}

function validateTextBlock(
  block: AITextBlockSpec,
  family: DesignFamily,
): QuoteElement | DecorativeElement {
  const bounds = getBounds('text-block')!

  const x = clamp(block.x ?? 0, bounds.x[0], bounds.x[1])
  const y = clamp(block.y ?? 0, bounds.y[0], bounds.y[1])
  const w = clamp(block.w ?? 30, bounds.w[0], bounds.w[1])
  const h = clamp(block.h ?? 10, bounds.h[0], bounds.h[1])
  const page = block.page === 'right' ? 'right' : 'left'

  if (block.type === 'quote' || block.type === 'caption') {
    return {
      type: 'quote',
      text: (block.content || '').slice(0, family.textBehavior.quoteMaxLength + 50),
      page,
      x,
      y,
      width: w,
      height: h,
      fontFamily: block.fontFamily || family.typography.quoteFont,
      fontWeight: clamp(block.fontWeight ?? family.typography.quoteWeight, 100, 900),
      fontSize: clamp(block.fontSize ?? 16, 10, 48),
      italic: block.italic ?? family.typography.quoteItalic,
      color: safeColor(block.color, family.palette.text),
      align: (['start', 'center', 'end'].includes(block.align) ? block.align : family.typography.quoteAlign) as 'start' | 'center' | 'end',
      letterSpacing: block.letterSpacing || family.typography.quoteLetterSpacing,
      lineHeight: clamp(block.lineHeight ?? family.typography.quoteLineHeight, 1.0, 3.0),
      zIndex: clamp(block.zIndex ?? 10, bounds.zIndex[0], bounds.zIndex[1]),
      quoteMarks: family.decorative.quoteMarks,
    } satisfies QuoteElement
  }

  return {
    type: 'script-text' as DecorativeElementType,
    page,
    x,
    y,
    width: w,
    height: h,
    color: safeColor(block.color, family.palette.textMuted),
    opacity: clamp(block.opacity ?? 0.15, 0, 1),
    rotation: clamp(block.rotation ?? 0, bounds.rotation[0], bounds.rotation[1]),
    zIndex: clamp(block.zIndex ?? 1, bounds.zIndex[0], bounds.zIndex[1]),
    text: block.content || '',
    fontFamily: block.fontFamily || 'Great Vibes',
    fontSize: clamp(block.fontSize ?? 48, 20, 120),
    fontWeight: block.fontWeight,
    italic: block.italic,
  } satisfies DecorativeElement
}

function validateDecoration(
  dec: AIDecorationSpec,
  family: DesignFamily,
): DecorativeElement | null {
  const typeMap: Record<string, DecorativeElementType> = {
    'line': 'accent-line',
    'gradient-wash': 'gradient-wash',
    'flourish': 'flourish',
    'corner-ornament': 'ornament',
  }

  const mappedType = typeMap[dec.type]
  if (!mappedType) return null

  const primType = dec.type === 'corner-ornament' ? 'corner-ornament' : dec.type
  const bounds = getBounds(primType) ?? getBounds('line')!

  const x = clamp(dec.x ?? 0, bounds.x[0], bounds.x[1])
  const y = clamp(dec.y ?? 0, bounds.y[0], bounds.y[1])
  const w = clamp(dec.w ?? 20, bounds.w[0], bounds.w[1])
  const h = clamp(dec.h ?? 2, bounds.h[0], bounds.h[1])
  const page = dec.page === 'right' ? 'right' : 'left'

  return {
    type: mappedType,
    page,
    x,
    y,
    width: w,
    height: h,
    color: safeColor(dec.color, family.palette.accent),
    opacity: clamp(dec.opacity ?? 0.3, 0, 1),
    rotation: clamp(dec.rotation ?? 0, bounds.rotation[0], bounds.rotation[1]),
    zIndex: clamp(dec.zIndex ?? 1, bounds.zIndex[0], bounds.zIndex[1]),
    gradient: dec.gradient,
    blendMode: dec.blendMode,
    strokeWidth: dec.strokeWidth,
    svgPath: dec.svgPath,
    style: dec.style,
  }
}

/**
 * Validates a single AISpreadSpec and returns a clean SpreadDesign.
 */
export function validateSpreadSpec(
  spec: AISpreadSpec,
  family: DesignFamily,
): SpreadDesign {
  const elements: SpreadElement[] = []

  const maxPhotos = Math.min(
    SPREAD_CONSTRAINTS.maxPhotosPerSpread,
    family.constraints.maxPhotosHardLimit,
  )
  const photoSlots = (spec.photoSlots ?? []).slice(0, maxPhotos)
  for (const slot of photoSlots) {
    elements.push(validatePhotoSlot(slot, family))
  }

  const textBlocks = (spec.textBlocks ?? []).slice(0, SPREAD_CONSTRAINTS.maxTextBlocksPerSpread)
  for (const block of textBlocks) {
    elements.push(validateTextBlock(block, family))
  }

  const decorations = (spec.decorations ?? [])
  const maxDecorations = SPREAD_CONSTRAINTS.maxElementsPerSpread - elements.length
  for (const dec of decorations.slice(0, maxDecorations)) {
    const validated = validateDecoration(dec, family)
    if (validated) elements.push(validated)
  }

  const background = validateBackground(spec.background ?? { baseColor: family.palette.background }, family)

  if (spec.background?.blurPhotoSlot && background.blurOpacity) {
    const blurSlot = elements.find(
      (e) => e.type === 'photo' && (e as PhotoElement).slotId === spec.background.blurPhotoSlot,
    )
    if (blurSlot) {
      background.blurPhotoUrl = undefined
    }
  }

  return { elements, background }
}

/**
 * Validates an array of AI spread specs into SpreadDesign objects.
 */
export function validateAllSpreadSpecs(
  specs: AISpreadSpec[],
  family: DesignFamily,
): SpreadDesign[] {
  return specs.map((spec) => validateSpreadSpec(spec, family))
}
