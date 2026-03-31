import type {
  EditorSpread,
  DesignFamily,
  SpreadSequenceSlot,
  SpreadDesign,
  SpreadDesignBackground,
  SpreadElement,
  PhotoElement,
  QuoteElement,
  DecorativeElement,
  SlotDefinition,
  FinalSlotData,
  EnrichedSlotData,
  ResolvedSpreadStyle,
  SlotImportance,
  QuotePlacement,
  SpreadPlanDesign,
  SpreadRole,
  ScriptOverlayConfig,
  GradientWashConfig,
} from '../types'
import type { MoodPack } from './moodPacks'
import { getTemplate } from './layoutGrammar'
import { getEffectiveAdjustments } from './templateVariants'

/**
 * Builds a SpreadDesign from a resolved EditorSpread.
 * Converts template slot positions + family tokens + variant adjustments
 * + optional AI overrides into absolutely-positioned elements.
 */
export function buildSpreadDesign(
  spread: EditorSpread,
  family: DesignFamily,
  sequenceSlot?: SpreadSequenceSlot,
  aiOverrides?: SpreadPlanDesign,
  moodPack?: MoodPack,
  generatedBgUrl?: string | null,
  backgroundMode?: 'white' | 'ai-generated',
): SpreadDesign {
  const template = getTemplate(spread.templateId)
  const style = spread.resolvedStyle ?? buildFallbackStyle(family)
  const adj = getEffectiveAdjustments(family.id, spread.templateId)

  const isWhiteBg = backgroundMode === 'white'
  const matPadding = isWhiteBg ? 6 : undefined
  const margin = isWhiteBg ? 1.5 : (aiOverrides?.marginOverride ?? style.spacing.pageMarginPercent)
  const elements: SpreadElement[] = []

  if (template) {
    const slotDataMap = new Map(
      (spread.slots ?? []).map((s) => [s.slotId, s]),
    )

    const filledSlots = template.slots.filter((s) => slotDataMap.get(s.id)?.photoUrl)

    for (let si = 0; si < template.slots.length; si++) {
      const slotDef = template.slots[si]
      const slotData = slotDataMap.get(slotDef.id)
      if (!slotData?.photoUrl) continue

      const enriched = slotData as EnrichedSlotData | FinalSlotData
      const importance: SlotImportance =
        'importance' in enriched ? enriched.importance : slotDef.importance

      const clipPath = isWhiteBg ? undefined : (moodPack?.photoShapes[importance] ?? undefined)

      const photoElement = buildPhotoElement(
        slotDef,
        slotData,
        importance,
        margin,
        style,
        family,
        adj,
        aiOverrides,
        si,
        filledSlots.length,
        clipPath,
        matPadding,
      )
      elements.push(photoElement)

      const shouldSpan = template.spanning
        || (template.spanningSlotIds?.includes(slotDef.id))
      if (shouldSpan && slotDef.page === 'left') {
        const origElement = photoElement as PhotoElement
        const mirrorElement: PhotoElement = {
          ...origElement,
          slotId: `${slotDef.id}-mirror`,
          photoId: `${origElement.photoId}-mirror`,
          page: 'right',
          objectPosition: 'right center',
        }
        ;(photoElement as PhotoElement).objectPosition = 'left center'
        elements.push(mirrorElement)
      }
    }
  } else {
    buildLegacyPhotoElements(spread, margin, style, elements)
  }

  if (spread.emptyPageFill) {
    const fill = spread.emptyPageFill
    if ((fill.type === 'quote' || fill.type === 'ai-background') && fill.text) {
      const existingOnSide = elements.filter(
        el => el.type === 'photo' && (el as PhotoElement).page === fill.side,
      ) as PhotoElement[]
      const maxBottom = existingOnSide.reduce(
        (max, el) => Math.max(max, el.y + el.height), 0,
      )
      const quoteY = maxBottom > 5 ? maxBottom + 5 : 35
      const availHeight = Math.max(20, 95 - quoteY)

      const fillQuote: QuoteElement = {
        type: 'quote',
        text: fill.text,
        page: fill.side,
        x: 10,
        y: quoteY,
        width: 80,
        height: Math.min(availHeight, 40),
        fontFamily: style.typography.quoteFont,
        fontWeight: style.typography.quoteWeight,
        fontSize: 22,
        italic: style.typography.quoteItalic,
        color: style.palette.text,
        align: 'center',
        letterSpacing: style.typography.quoteLetterSpacing,
        lineHeight: 1.6,
        zIndex: 10,
        quoteMarks: style.decorative.quoteMarks,
      }
      elements.push(fillQuote)
    } else if (fill.type === 'quote' && !fill.text) {
      // no-op: no text available
    }
  }

  if (spread.quote) {
    const quotePlacement = adj.quotePlacement
      ?? family.layoutBehavior.preferredQuotePlacement[0]
      ?? 'center'
    const quoteElement = buildQuoteElement(
      spread.quote,
      quotePlacement,
      template?.quotePosition ?? 'right-center',
      margin,
      style,
      aiOverrides,
    )
    elements.push(quoteElement)
  }

  const role = sequenceSlot?.role ?? spread.role ?? 'standard'

  if (!isWhiteBg) {
    if (style.decorative.cornerOrnaments) {
      elements.push(...buildCornerOrnaments(style.palette.accent, margin))
    }

    if (style.decorative.scriptOverlays) {
      const packScript = moodPack
        ? { ...style.decorative.scriptOverlays, color: moodPack.scriptColor, opacity: moodPack.scriptOpacity }
        : style.decorative.scriptOverlays
      const scriptEl = buildScriptOverlay(packScript, role, margin, spread.id)
      if (scriptEl) elements.push(scriptEl)
    }

    const accentColor = moodPack?.accentLineColor
      ?? style.decorative.accentLineColor
      ?? style.palette.border
    if (style.decorative.accentLines) {
      elements.push(...buildAccentLines(accentColor, margin, role))
    }

    if (style.decorative.dividers !== 'none' && spread.quote) {
      const divEl = buildDivider(style.decorative.dividers, style.palette.border)
      if (divEl) elements.push(divEl)
    }

    if (style.decorative.flourishes && style.decorative.flourishColor) {
      elements.push(...buildFlourishes(style.decorative.flourishColor, margin, role))
    }

    if (moodPack) {
      elements.push(...buildMoodDecorations(moodPack, margin))
    }
  }

  let background = isWhiteBg
    ? buildWhiteBackground()
    : buildBackground(spread, style, aiOverrides, family, role, moodPack, generatedBgUrl)

  if (spread.emptyPageFill?.gradient && spread.emptyPageFill.type === 'gradient') {
    background = {
      ...background,
      gradientWash: spread.emptyPageFill.gradient,
      gradientWashOpacity: 0.6,
    }
  }

  return { elements, background }
}

function buildPhotoElement(
  slotDef: SlotDefinition,
  slotData: FinalSlotData | EnrichedSlotData,
  importance: SlotImportance,
  margin: number,
  _style: ResolvedSpreadStyle,
  family: DesignFamily,
  adj: ReturnType<typeof getEffectiveAdjustments>,
  aiOverrides?: SpreadPlanDesign,
  slotIndex?: number,
  totalSlots?: number,
  clipPath?: string,
  matPaddingOverride?: number,
): PhotoElement {
  const frame = 'frame' in slotData
    ? (slotData as EnrichedSlotData).frame
    : { ...family.photoFrame, ...(family.slotFrameOverrides[importance] ?? {}) }

  const aiSlotOvr = aiOverrides?.slotOverrides?.[slotDef.id]

  const scale = (aiSlotOvr?.scale ?? adj.scalePhotos ?? 1)
  const isHero = importance === 'hero'
  const offset = isHero && adj.offsetPrimaryPhoto ? adj.offsetPrimaryPhoto : { x: 0, y: 0 }

  const rotRange = adj.photoRotation ?? frame.rotationRange
  const rotation = aiSlotOvr?.rotation
    ?? (rotRange[0] === 0 && rotRange[1] === 0
      ? 0
      : rotRange[0] + seededRandom(slotDef.id) * (rotRange[1] - rotRange[0]))

  const rawX = slotDef.x
  const rawY = slotDef.y
  const rawW = slotDef.width
  const rawH = slotDef.height

  let marginL = margin
  let marginR = margin
  let marginT = margin
  let marginB = margin

  if (adj.marginBias) {
    const biasShift = margin * 0.4
    switch (adj.marginBias) {
      case 'left': marginL += biasShift; marginR -= biasShift; break
      case 'right': marginR += biasShift; marginL -= biasShift; break
      case 'top': marginT += biasShift; marginB -= biasShift; break
      case 'bottom': marginB += biasShift; marginT -= biasShift; break
    }
  }

  const availW = 100 - marginL - marginR
  const availH = 100 - marginT - marginB

  const scaledW = rawW * (availW / 100) * scale
  const scaledH = rawH * (availH / 100) * scale

  let x = marginL + rawX * (availW / 100) + offset.x + (rawW * (availW / 100) - scaledW) / 2
  let y = marginT + rawY * (availH / 100) + offset.y + (rawH * (availH / 100) - scaledH) / 2

  if (adj.allowOverlap && adj.overlapAmount && !isHero && (slotIndex ?? 0) > 0) {
    const overlapPx = adj.overlapAmount
    const overlapPct = overlapPx * 0.15
    x -= overlapPct * seededRandom(slotDef.id + '-ox')
    y -= overlapPct * 0.5 * seededRandom(slotDef.id + '-oy')
  }

  if (adj.enforceAsymmetry && (totalSlots ?? 0) > 1) {
    const asymOffset = 1.5 * seededRandom(slotDef.id + '-asym')
    if ((slotIndex ?? 0) % 2 === 0) {
      x += asymOffset
      y -= asymOffset * 0.5
    } else {
      x -= asymOffset * 0.5
      y += asymOffset
    }
  }

  const zOrder: Record<SlotImportance, number> = { hero: 1, primary: 2, secondary: 3, accent: 4 }

  return {
    type: 'photo',
    slotId: slotDef.id,
    photoId: slotData.slotId,
    photoUrl: slotData.photoUrl,
    page: slotDef.page === 'left' ? 'left' : 'right',
    x,
    y,
    width: scaledW,
    height: scaledH,
    rotation,
    borderWidth: aiSlotOvr?.borderWidth ?? frame.borderWidth,
    borderColor: aiSlotOvr?.borderColor ?? frame.borderColor,
    borderRadius: frame.borderRadius,
    shadow: aiSlotOvr?.shadow ?? (frame.shadow !== 'none' ? frame.shadow : ''),
    padding: matPaddingOverride ?? aiSlotOvr?.padding ?? frame.innerPadding,
    zIndex: zOrder[importance] ?? 3,
    objectPosition: slotData.objectPosition || '50% 50%',
    objectFit: slotData.objectFit || 'cover',
    importance,
    clipPath: clipPath ?? undefined,
  }
}

/**
 * Fallback for legacy spreads without template slot definitions.
 * Distributes photos in a simple grid layout.
 */
function buildLegacyPhotoElements(
  spread: EditorSpread,
  margin: number,
  style: ResolvedSpreadStyle,
  elements: SpreadElement[],
): void {
  const leftPhotos = spread.leftPhotos.filter(Boolean) as string[]
  const rightPhotos = spread.rightPhotos.filter(Boolean) as string[]

  const gap = style.spacing.photoGapPx / 8 // approximate px to % conversion
  const availW = 100 - margin * 2
  const availH = 100 - margin * 2

  distributePhotosInPage(leftPhotos, 'left', margin, availW, availH, gap, style, elements)
  distributePhotosInPage(rightPhotos, 'right', margin, availW, availH, gap, style, elements)
}

function distributePhotosInPage(
  photoUrls: string[],
  page: 'left' | 'right',
  margin: number,
  availW: number,
  availH: number,
  gap: number,
  style: ResolvedSpreadStyle,
  elements: SpreadElement[],
): void {
  if (photoUrls.length === 0) return

  const count = photoUrls.length
  const cols = count <= 1 ? 1 : count <= 4 ? 2 : 3
  const rows = Math.ceil(count / cols)
  const cellW = (availW - gap * (cols - 1)) / cols
  const cellH = (availH - gap * (rows - 1)) / rows

  photoUrls.forEach((url, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)

    elements.push({
      type: 'photo',
      slotId: `${page}-legacy-${i}`,
      photoId: `${page}-${i}`,
      photoUrl: url,
      page,
      x: margin + col * (cellW + gap),
      y: margin + row * (cellH + gap),
      width: cellW,
      height: cellH,
      rotation: 0,
      borderWidth: style.frame.borderWidth,
      borderColor: style.frame.borderColor,
      borderRadius: style.frame.borderRadius,
      shadow: style.frame.shadow !== 'none' ? style.frame.shadow : '',
      padding: style.frame.innerPadding,
      zIndex: 2,
      objectPosition: '50% 50%',
      objectFit: 'cover',
      importance: i === 0 ? 'primary' : 'secondary',
    })
  })
}

function buildQuoteElement(
  text: string,
  placement: QuotePlacement,
  templatePosition: string,
  margin: number,
  style: ResolvedSpreadStyle,
  aiOverrides?: SpreadPlanDesign,
): QuoteElement {
  const typo = style.typography
  const aiQuote = aiOverrides?.quoteStyle
  const effectivePlacement = aiQuote?.position ?? placement

  const page: 'left' | 'right' = templatePosition.startsWith('left') ? 'left' : 'right'

  let x: number, y: number, w: number, h: number
  let align: 'start' | 'center' | 'end' = typo.quoteAlign

  switch (effectivePlacement) {
    case 'center':
      x = margin + 10
      y = 35
      w = 100 - margin * 2 - 20
      h = 30
      align = 'center'
      break
    case 'corner':
      x = margin + 2
      y = margin + 2
      w = 40
      h = 20
      align = 'start'
      break
    case 'sidebar':
      x = 100 - margin - 30
      y = margin + 10
      w = 28
      h = 80 - margin * 2
      align = 'center'
      break
    case 'floating':
      x = margin + 5
      y = 70 - margin
      w = 50
      h = 22
      align = 'start'
      break
    default:
      x = margin + 10
      y = 40
      w = 100 - margin * 2 - 20
      h = 20
      align = 'center'
  }

  const sizeMap: Record<string, number> = {
    'text-xs': 10, 'text-sm': 12, 'text-base': 14, 'text-lg': 16,
    'text-xl': 18, 'text-2xl': 22, 'text-3xl': 26,
  }
  const baseSize = sizeMap[typo.quoteSizeClass.split(' ')[0]] ?? 14

  return {
    type: 'quote',
    text,
    page,
    x,
    y,
    width: w,
    height: h,
    fontFamily: typo.quoteFont,
    fontWeight: aiQuote?.weight ?? typo.quoteWeight,
    fontSize: aiQuote?.fontSize ?? baseSize,
    italic: aiQuote?.italic ?? typo.quoteItalic,
    color: aiQuote?.color ?? style.palette.text,
    align,
    letterSpacing: typo.quoteLetterSpacing,
    lineHeight: typo.quoteLineHeight,
    zIndex: 10,
    quoteMarks: style.decorative.quoteMarks,
  }
}

function buildCornerOrnaments(color: string, margin: number): DecorativeElement[] {
  const size = 4
  const inset = margin + 1
  return [
    { type: 'ornament', page: 'left', x: inset, y: inset, width: size, height: size, color, opacity: 0.18, rotation: 0, zIndex: 5 },
    { type: 'ornament', page: 'left', x: 100 - inset - size, y: inset, width: size, height: size, color, opacity: 0.18, rotation: 0, zIndex: 5 },
    { type: 'ornament', page: 'left', x: inset, y: 100 - inset - size, width: size, height: size, color, opacity: 0.18, rotation: 0, zIndex: 5 },
    { type: 'ornament', page: 'left', x: 100 - inset - size, y: 100 - inset - size, width: size, height: size, color, opacity: 0.18, rotation: 0, zIndex: 5 },
    { type: 'ornament', page: 'right', x: inset, y: inset, width: size, height: size, color, opacity: 0.18, rotation: 0, zIndex: 5 },
    { type: 'ornament', page: 'right', x: 100 - inset - size, y: inset, width: size, height: size, color, opacity: 0.18, rotation: 0, zIndex: 5 },
    { type: 'ornament', page: 'right', x: inset, y: 100 - inset - size, width: size, height: size, color, opacity: 0.18, rotation: 0, zIndex: 5 },
    { type: 'ornament', page: 'right', x: 100 - inset - size, y: 100 - inset - size, width: size, height: size, color, opacity: 0.18, rotation: 0, zIndex: 5 },
  ]
}

function buildScriptOverlay(
  config: ScriptOverlayConfig,
  role: SpreadRole,
  _margin: number,
  spreadId: string,
): DecorativeElement | null {
  if (!config.roles.includes(role)) return null

  const word = config.words[hashString(spreadId) % config.words.length]
  const placement = config.placements[hashString(spreadId + 'p') % config.placements.length]
  const fontSize = config.sizeRange[0] + seededRandom(spreadId + 'sz') * (config.sizeRange[1] - config.sizeRange[0])

  let x: number, y: number, w: number, h: number, page: 'left' | 'right', rotation: number

  switch (placement) {
    case 'corner':
      x = 60
      y = 72
      w = 38
      h = 20
      page = seededRandom(spreadId + 'pg') > 0.5 ? 'right' : 'left'
      rotation = -8 + seededRandom(spreadId + 'rot') * 16
      break
    case 'behind-photo':
      x = 10
      y = 15
      w = 55
      h = 25
      page = 'left'
      rotation = -12 + seededRandom(spreadId + 'rot') * 24
      break
    case 'page-edge':
      x = 75
      y = 5
      w = 24
      h = 90
      page = seededRandom(spreadId + 'pg') > 0.5 ? 'right' : 'left'
      rotation = 90
      break
    case 'centered':
    default:
      x = 20
      y = 40
      w = 60
      h = 20
      page = 'right'
      rotation = -3 + seededRandom(spreadId + 'rot') * 6
      break
  }

  return {
    type: 'script-text',
    page,
    x, y,
    width: w,
    height: h,
    color: config.color,
    opacity: config.opacity,
    rotation,
    zIndex: 0,
    text: word,
    fontFamily: config.font,
    fontSize: Math.round(fontSize),
    fontWeight: config.weight,
    italic: config.italic,
  }
}

function buildAccentLines(
  color: string,
  margin: number,
  role: SpreadRole,
): DecorativeElement[] {
  const lines: DecorativeElement[] = []

  if (role === 'breathing' || role === 'text' || role === 'closing') {
    lines.push({
      type: 'accent-line',
      page: 'left',
      x: margin + 10,
      y: 50,
      width: 80 - margin * 2,
      height: 0.3,
      color,
      opacity: 0.4,
      rotation: 0,
      zIndex: 0,
    })
  }

  if (role === 'hero' || role === 'cover') {
    lines.push({
      type: 'accent-line',
      page: 'right',
      x: 15,
      y: margin + 3,
      width: 70,
      height: 0.3,
      color,
      opacity: 0.3,
      rotation: 0,
      zIndex: 0,
    })
    lines.push({
      type: 'accent-line',
      page: 'right',
      x: 15,
      y: 100 - margin - 3,
      width: 70,
      height: 0.3,
      color,
      opacity: 0.3,
      rotation: 0,
      zIndex: 0,
    })
  }

  if (lines.length === 0) {
    lines.push({
      type: 'accent-line',
      page: 'left',
      x: margin + 6,
      y: margin + 2,
      width: 88 - margin * 2,
      height: 0.2,
      color,
      opacity: 0.22,
      rotation: 0,
      zIndex: 0,
    })
  }

  return lines
}

function buildDivider(
  dividerStyle: string,
  borderColor: string,
): DecorativeElement | null {
  return {
    type: 'divider',
    page: 'right',
    x: 20,
    y: 50,
    width: 60,
    height: dividerStyle === 'ornamental' ? 0.5 : 0.2,
    color: borderColor,
    opacity: dividerStyle === 'ornamental' ? 0.5 : 0.3,
    rotation: 0,
    zIndex: 6,
    style: dividerStyle as 'thin-line' | 'ornamental' | 'dotted',
  }
}

const FLOURISH_PATHS = [
  'M0,20 C10,0 30,0 40,20 S60,40 80,20',
  'M0,15 Q20,0 40,15 T80,15',
  'M5,25 C15,5 25,5 35,25 C45,5 55,5 65,25',
]

function buildFlourishes(
  color: string,
  _margin: number,
  role: SpreadRole,
): DecorativeElement[] {
  const topFlourish = (): DecorativeElement => ({
    type: 'flourish',
    page: 'right',
    x: 25,
    y: 8,
    width: 50,
    height: 6,
    color,
    opacity: 0.12,
    rotation: 0,
    zIndex: 0,
    svgPath: FLOURISH_PATHS[0],
    strokeWidth: 1.2,
  })

  if (role === 'hero' || role === 'standard') {
    return [{
      ...topFlourish(),
      opacity: 0.1,
      strokeWidth: 1,
    }]
  }

  if (role !== 'breathing' && role !== 'closing' && role !== 'cover') return []

  const elements: DecorativeElement[] = [topFlourish()]

  if (role === 'closing') {
    elements.push({
      type: 'flourish',
      page: 'right',
      x: 25,
      y: 88,
      width: 50,
      height: 6,
      color,
      opacity: 0.12,
      rotation: 180,
      zIndex: 0,
      svgPath: FLOURISH_PATHS[0],
      strokeWidth: 1.2,
    })
  }

  return elements
}

function buildGradientWash(
  config: GradientWashConfig,
  role: SpreadRole,
): { gradient: string; opacity: number; blendMode: string } | null {
  if (!config.roles.includes(role)) return null

  let gradient: string
  const c = config.color

  switch (config.position) {
    case 'top-left':
      gradient = config.type === 'radial'
        ? `radial-gradient(ellipse at 0% 0%, ${c} 0%, transparent 65%)`
        : `linear-gradient(135deg, ${c} 0%, transparent 60%)`
      break
    case 'top-right':
      gradient = config.type === 'radial'
        ? `radial-gradient(ellipse at 100% 0%, ${c} 0%, transparent 65%)`
        : `linear-gradient(225deg, ${c} 0%, transparent 60%)`
      break
    case 'bottom-right':
      gradient = config.type === 'radial'
        ? `radial-gradient(ellipse at 100% 100%, ${c} 0%, transparent 65%)`
        : `linear-gradient(315deg, ${c} 0%, transparent 60%)`
      break
    case 'center':
      gradient = `radial-gradient(ellipse at 50% 50%, ${c} 0%, transparent 70%)`
      break
    case 'full':
    default:
      gradient = `linear-gradient(180deg, ${c} 0%, transparent 100%)`
      break
  }

  return { gradient, opacity: config.opacity, blendMode: 'multiply' }
}

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function buildWhiteBackground(): SpreadDesignBackground {
  return {
    color: '#FFFFFF',
    blurPhotoUrl: undefined,
    blurOpacity: 0,
    blurPx: 0,
    texture: 'none',
    textureOpacity: 0,
    gradientWash: undefined,
    gradientWashOpacity: undefined,
    gradientBlendMode: undefined,
    conceptId: undefined,
    backgroundLayers: undefined,
    svgOverlay: undefined,
    svgOverlayOpacity: undefined,
    generatedBgUrl: undefined,
    generatedBgOpacity: undefined,
  }
}

function buildBackground(
  spread: EditorSpread,
  style: ResolvedSpreadStyle,
  aiOverrides?: SpreadPlanDesign,
  family?: DesignFamily,
  role?: SpreadRole,
  moodPack?: MoodPack,
  generatedBgUrl?: string | null,
): SpreadDesignBackground {
  const heroUrl = spread.leftPhotos?.[0] ?? spread.rightPhotos?.[0] ?? undefined

  let gradientWash: string | undefined
  let gradientWashOpacity: number | undefined
  let gradientBlendMode: string | undefined

  if (family?.decorative.gradientWash && role) {
    const wash = buildGradientWash(family.decorative.gradientWash, role)
    if (wash) {
      gradientWash = wash.gradient
      gradientWashOpacity = wash.opacity
      gradientBlendMode = wash.blendMode
    }
  }

  const baseColor = moodPack?.backgroundColor
    ?? aiOverrides?.backgroundColor
    ?? style.background.color

  const texture = moodPack?.texture
    ?? (style.background.allowTexture ? style.background.textureType : 'none')
  const textureOpacity = moodPack?.textureOpacity ?? style.background.textureOpacity

  return {
    color: baseColor,
    blurPhotoUrl: style.background.allowPhotoBlur ? (heroUrl ?? undefined) : undefined,
    blurOpacity: aiOverrides?.backgroundBlurOpacity ?? style.background.photoBlurOpacity,
    blurPx: style.background.photoBlurPx,
    texture,
    textureOpacity,
    gradientWash,
    gradientWashOpacity,
    gradientBlendMode,
    conceptId: moodPack?.id,
    backgroundLayers: moodPack?.backgroundLayers,
    svgOverlay: moodPack?.svgOverlay ?? undefined,
    svgOverlayOpacity: moodPack?.svgOverlayOpacity,
    generatedBgUrl: generatedBgUrl ?? undefined,
    generatedBgOpacity: generatedBgUrl ? 0.55 : undefined,
  }
}

function buildFallbackStyle(family: DesignFamily): ResolvedSpreadStyle {
  return {
    spacing: family.spacing,
    background: family.background,
    frame: family.photoFrame,
    typography: family.typography,
    decorative: family.decorative,
    palette: family.palette,
  }
}

/**
 * Deterministic pseudo-random from a string seed.
 * Used for consistent rotation values across renders.
 */
function seededRandom(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return (Math.abs(hash) % 1000) / 1000
}

/**
 * Builds decorative SVG-pattern elements from a mood pack's SVG overlay.
 * These are low-z-index decorative elements positioned at the edges.
 */
function buildMoodDecorations(
  pack: MoodPack,
  _margin: number,
): DecorativeElement[] {
  if (!pack.svgOverlay) return []

  return [
    {
      type: 'svg-pattern',
      page: 'left',
      x: 0,
      y: 70,
      width: 100,
      height: 30,
      color: pack.palette.primary,
      opacity: pack.svgOverlayOpacity,
      rotation: 0,
      zIndex: 0,
    },
    {
      type: 'svg-pattern',
      page: 'right',
      x: 0,
      y: 70,
      width: 100,
      height: 30,
      color: pack.palette.primary,
      opacity: pack.svgOverlayOpacity * 0.8,
      rotation: 0,
      zIndex: 0,
    },
  ]
}

/**
 * Batch-build SpreadDesigns for an entire album.
 */
export function buildAlbumCompositions(
  spreads: EditorSpread[],
  family: DesignFamily,
  sequencePlan: SpreadSequenceSlot[],
  aiDesignOverrides?: (SpreadPlanDesign | undefined)[],
  moodPacks?: (MoodPack | undefined)[],
  generatedBackgrounds?: (string | null)[],
  backgroundMode?: 'white' | 'ai-generated',
): EditorSpread[] {
  return spreads.map((spread, i) => {
    const seqSlot = sequencePlan[i]
    const aiOvr = aiDesignOverrides?.[i]
    const pack = moodPacks?.[i]
    const bgUrl = generatedBackgrounds?.[i]
    const design = buildSpreadDesign(spread, family, seqSlot, aiOvr, pack, bgUrl, backgroundMode)
    return { ...spread, design }
  })
}
