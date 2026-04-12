import { useRef, useEffect, useCallback, useState, useMemo } from 'react'
import type {
  EditorSpread,
  SpreadDesign,
  ResolvedSpreadStyle,
  ResolvedFrame,
  EnrichedSlotData,
  PhotoElement,
  TemplateVariant,
} from '../../types'
import {
  AbsoluteQuoteElement,
  AbsoluteDecorativeElement,
  LegacyQuoteBlock,
  LegacyCornerOrnaments,
} from '../editor/EditorCanvas'
import { useEditorStore } from '../../store/editorStore'
import { DEFAULT_STYLE, getTexturePattern } from '../editor/editorDefaults'
import { getTemplate } from '../../lib/layoutGrammar'
import { applyPageMarginToPercentRect } from '../../lib/layoutInset'
import { ALBUM_SIZES } from '../../lib/constants'

const RENDER_WIDTH_PER_PAGE = 1200

interface OffScreenSpreadRendererProps {
  spreads: EditorSpread[]
  albumSizeId: string
  onSpreadReady: (index: number, element: HTMLDivElement) => Promise<void>
  onComplete: () => void
  onError: (error: Error) => void
}

// ─── Export-only photo renderer (background-image, no <img>) ──────────

function ExportPhoto({
  src,
  objectPosition,
  objectFit,
  transform,
  transformOrigin,
}: {
  src: string
  objectPosition?: string
  objectFit?: string
  transform?: string
  transformOrigin?: string
}) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundImage: `url("${src}")`,
        backgroundSize: objectFit || 'cover',
        backgroundPosition: objectPosition || '50% 35%',
        backgroundRepeat: 'no-repeat',
        transform,
        transformOrigin,
      }}
    />
  )
}

// ─── Export AbsolutePhotoElement (replaces editor's interactive version) ──

function ExportAbsolutePhotoElement({
  element,
  layoutInsetPercent,
  collectivePaddingPx,
  collectiveBorderRadiusPx,
}: {
  element: PhotoElement
  layoutInsetPercent: number
  collectivePaddingPx: number | null
  collectiveBorderRadiusPx: number | null
}) {
  if (!element.photoUrl) return null

  const layoutRect = applyPageMarginToPercentRect(
    element.x,
    element.y,
    element.width,
    element.height,
    layoutInsetPercent,
  )
  const pad = collectivePaddingPx != null ? collectivePaddingPx : element.padding
  const radius = collectiveBorderRadiusPx != null ? collectiveBorderRadiusPx : element.borderRadius
  const currentScale = element.scale ?? 1
  const objPos = element.objectPosition || '50% 35%'

  return (
    <div
      style={{
        position: 'absolute',
        left: `${layoutRect.x}%`,
        top: `${layoutRect.y}%`,
        width: `${layoutRect.width}%`,
        height: `${layoutRect.height}%`,
        zIndex: element.zIndex,
        borderWidth: element.borderWidth > 0 && !element.clipPath ? element.borderWidth : undefined,
        borderColor: element.borderWidth > 0 && !element.clipPath ? element.borderColor : undefined,
        borderStyle: element.borderWidth > 0 && !element.clipPath ? 'solid' : undefined,
        borderRadius: element.clipPath ? undefined : radius,
        boxShadow: element.shadow || undefined,
        padding: pad > 0 && !element.clipPath ? pad : undefined,
        backgroundColor: pad > 0 && !element.clipPath ? '#FFFFFF' : undefined,
        transform: element.rotation !== 0 ? `rotate(${element.rotation.toFixed(1)}deg)` : undefined,
        overflow: 'hidden',
        clipPath: element.clipPath || undefined,
        WebkitClipPath: element.clipPath || undefined,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          borderRadius: radius > 8
            ? Math.max(4, radius * 0.6)
            : Math.max(0, radius - pad),
        }}
      >
        <ExportPhoto
          src={element.photoUrl}
          objectPosition={objPos}
          objectFit={element.objectFit || 'cover'}
          transform={`scale(${Math.max(1.12, currentScale)})`}
          transformOrigin={objPos}
        />
      </div>
    </div>
  )
}

// ─── Export LegacyPhotoSlot (replaces editor's motion.div + <img>) ────

function ExportLegacyPhotoSlot({
  src,
  objectPosition,
  transform,
  frame,
  variant,
  slotImportance,
}: {
  src: string
  objectPosition?: string
  transform?: string
  frame: ResolvedFrame
  variant?: TemplateVariant | null
  slotImportance?: string
}) {
  const adj = variant?.adjustments
  const scale = adj?.scalePhotos ?? 1
  const isHero = slotImportance === 'hero'
  const offset = isHero && adj?.offsetPrimaryPhoto
    ? adj.offsetPrimaryPhoto
    : null

  const rotation = useMemo(() => {
    const range = adj?.photoRotation ?? frame.rotationRange
    if (!range || (range[0] === 0 && range[1] === 0)) return 0
    let hash = 0
    for (let i = 0; i < src.length; i++) {
      hash = ((hash << 5) - hash + src.charCodeAt(i)) | 0
    }
    const pseudo = ((hash >>> 0) % 10000) / 10000
    return range[0] + pseudo * (range[1] - range[0])
  }, [adj?.photoRotation, frame.rotationRange, src])

  const frameStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    borderWidth: frame.borderWidth > 0 ? frame.borderWidth : undefined,
    borderColor: frame.borderWidth > 0 ? frame.borderColor : undefined,
    borderStyle: frame.borderWidth > 0 ? 'solid' : undefined,
    borderRadius: frame.borderRadius,
    boxShadow: frame.shadow !== 'none' ? frame.shadow : undefined,
    padding: frame.innerPadding > 0 ? frame.innerPadding : undefined,
    transform: [
      scale !== 1 ? `scale(${scale})` : '',
      rotation !== 0 ? `rotate(${rotation.toFixed(1)}deg)` : '',
      offset ? `translate(${offset.x}%, ${offset.y}%)` : '',
    ].filter(Boolean).join(' ') || undefined,
  }

  return (
    <div style={frameStyle}>
      <div
        style={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          borderRadius: Math.max(0, frame.borderRadius - frame.innerPadding),
        }}
      >
        <ExportPhoto
          src={src}
          objectPosition={objectPosition || '50% 35%'}
          objectFit="cover"
          transform={transform || undefined}
        />
      </div>
    </div>
  )
}

// ─── Page Background ──────────────────────────────────────────────────

function ExportPageBackground({
  design,
  style,
  side,
  heroPhotoSrc,
}: {
  design?: SpreadDesign
  style: ResolvedSpreadStyle
  side: 'left' | 'right'
  heroPhotoSrc?: string | null
}) {
  const offsetLeft = side === 'left' ? '0' : '-100%'

  if (design) {
    const bg = design.background
    const stackZ = bg.backgroundStackZIndex ?? 0
    return (
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ zIndex: stackZ }}
      >
        {bg.generatedBgUrl && (
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <div
              className="absolute inset-y-0"
              style={{
                width: '200%',
                left: offsetLeft,
                backgroundImage: `url(${bg.generatedBgUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: bg.generatedBgOpacity ?? 0.55,
              }}
            />
          </div>
        )}
        {side === 'left' && bg.generatedBgLeftUrl && (
          <div className="absolute z-0 rounded-md overflow-hidden" style={{ inset: '3%' }}>
            <div
              className="w-full h-full"
              style={{
                backgroundImage: `url(${bg.generatedBgLeftUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: bg.generatedBgLeftOpacity ?? 1,
                borderRadius: 'inherit',
              }}
            />
          </div>
        )}
        {side === 'right' && bg.generatedBgRightUrl && (
          <div className="absolute z-0 rounded-md overflow-hidden" style={{ inset: '3%' }}>
            <div
              className="w-full h-full"
              style={{
                backgroundImage: `url(${bg.generatedBgRightUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: bg.generatedBgRightOpacity ?? 1,
                borderRadius: 'inherit',
              }}
            />
          </div>
        )}
        {!bg.generatedBgUrl && bg.backgroundLayers && bg.backgroundLayers.length > 0 && bg.backgroundLayers.map((layer, i) => (
          <div
            key={`bg-layer-${i}`}
            className="absolute inset-0 z-0 pointer-events-none"
            style={{
              backgroundImage: layer.gradient,
              opacity: layer.opacity,
              mixBlendMode: (layer.blendMode ?? 'normal') as React.CSSProperties['mixBlendMode'],
            }}
          />
        ))}
        {bg.blurPhotoUrl && (bg.blurOpacity ?? 0) > 0 && (
          <div className="absolute inset-0 z-0 overflow-hidden">
            <div
              className="absolute inset-y-0"
              style={{
                width: '200%',
                left: offsetLeft,
                backgroundImage: `url(${bg.blurPhotoUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: `blur(${bg.blurPx ?? 60}px)`,
                opacity: bg.blurOpacity,
                transform: 'scale(1.1)',
              }}
            />
          </div>
        )}
        {bg.gradientWash && (bg.gradientWashOpacity ?? 0) > 0 && (
          <div
            className="absolute inset-0 z-0 pointer-events-none"
            style={{
              backgroundImage: bg.gradientWash,
              opacity: bg.gradientWashOpacity,
              mixBlendMode: (bg.gradientBlendMode ?? 'multiply') as React.CSSProperties['mixBlendMode'],
            }}
          />
        )}
        {bg.svgOverlay && (bg.svgOverlayOpacity ?? 0) > 0 && (
          <div className="absolute inset-x-0 bottom-0 z-0 pointer-events-none overflow-hidden" style={{ height: '30%' }}>
            <div
              className="absolute inset-y-0"
              style={{
                width: '200%',
                left: offsetLeft,
                backgroundImage: bg.svgOverlay,
                backgroundSize: 'cover',
                backgroundPosition: 'bottom center',
                backgroundRepeat: 'no-repeat',
                opacity: bg.svgOverlayOpacity,
              }}
            />
          </div>
        )}
        {bg.texture && bg.texture !== 'none' && (bg.textureOpacity ?? 0) > 0 && (
          <div
            className="absolute inset-0 z-0 pointer-events-none"
            style={{
              opacity: bg.textureOpacity,
              backgroundImage: getTexturePattern(bg.texture),
              backgroundRepeat: 'repeat',
            }}
          />
        )}
      </div>
    )
  }

  const { background } = style
  return (
    <>
      {background.allowPhotoBlur && heroPhotoSrc && (
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div
            className="absolute inset-y-0"
            style={{
              width: '200%',
              left: offsetLeft,
              backgroundImage: `url(${heroPhotoSrc})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: `blur(${background.photoBlurPx}px)`,
              opacity: background.photoBlurOpacity,
              transform: 'scale(1.1)',
            }}
          />
        </div>
      )}
      {background.allowTexture && background.textureType !== 'none' && (
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            opacity: background.textureOpacity,
            backgroundImage: getTexturePattern(background.textureType),
            backgroundRepeat: 'repeat',
          }}
        />
      )}
    </>
  )
}

// ─── Absolute Elements ────────────────────────────────────────────────

function ExportAbsoluteElements({
  spread,
  design,
  side,
  layoutInsetPercent,
  collectivePaddingPx,
  collectiveBorderRadiusPx,
}: {
  spread: EditorSpread
  design: SpreadDesign
  side: 'left' | 'right'
  layoutInsetPercent: number
  collectivePaddingPx: number | null
  collectiveBorderRadiusPx: number | null
}) {
  const elements = design.elements.filter((e) => e.page === side)

  return (
    <>
      {elements.map((el, i) => {
        if (el.type === 'photo') {
          return (
            <ExportAbsolutePhotoElement
              key={`${spread.id}-${el.slotId}`}
              element={el}
              layoutInsetPercent={layoutInsetPercent}
              collectivePaddingPx={collectivePaddingPx}
              collectiveBorderRadiusPx={collectiveBorderRadiusPx}
            />
          )
        }
        if (el.type === 'quote') {
          return (
            <AbsoluteQuoteElement
              key={`q-${side}-${i}`}
              element={el}
              elementIndex={i}
              isSelected={false}
              onSelect={() => {}}
              layoutInsetPercent={layoutInsetPercent}
            />
          )
        }
        return (
          <AbsoluteDecorativeElement
            key={`d-${side}-${i}-${el.x}-${el.y}`}
            element={el}
            layoutInsetPercent={layoutInsetPercent}
          />
        )
      })}
    </>
  )
}

// ─── Overlay Template ─────────────────────────────────────────────────

const OVERLAY_TEMPLATES: Record<string, 'left' | 'right'> = {
  'photo-over-photo': 'left',
  'photo-over-photo-right': 'right',
}

function ExportOverlayPageElements({
  spread,
  style,
  side,
}: {
  spread: EditorSpread
  style: ResolvedSpreadStyle
  side: 'left' | 'right'
}) {
  const slotDataByUrl = useMemo(
    () => new Map((spread.slots ?? []).map((s) => [s.photoUrl, s])),
    [spread.slots],
  )

  const variant = spread.variant ?? null
  const photos = side === 'left' ? spread.leftPhotos : spread.rightPhotos
  const bgSrc = photos[0]
  const overlaySrc = photos[1]

  const bgSlotData = bgSrc ? slotDataByUrl.get(bgSrc) as EnrichedSlotData | undefined : undefined
  const overlaySlotData = overlaySrc ? slotDataByUrl.get(overlaySrc) as EnrichedSlotData | undefined : undefined

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1 }}>
      {bgSrc && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            borderRadius: style.frame.borderRadius,
          }}
        >
          <ExportLegacyPhotoSlot
            src={bgSrc}
            objectPosition={bgSlotData?.objectPosition}
            transform={bgSlotData?.transform}
            frame={{ ...style.frame, borderWidth: 0, shadow: 'none', innerPadding: 0 }}
            variant={variant}
            slotImportance="hero"
          />
        </div>
      )}

      {overlaySrc && (
        <div
          style={{
            position: 'absolute',
            zIndex: 10,
            right: side === 'left' ? '6%' : undefined,
            left: side === 'right' ? '6%' : undefined,
            bottom: '6%',
            width: '38%',
            aspectRatio: '1',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.15)',
              border: '3px solid rgba(255,255,255,0.85)',
            }}
          >
            <ExportLegacyPhotoSlot
              src={overlaySrc}
              objectPosition={overlaySlotData?.objectPosition}
              transform={overlaySlotData?.transform}
              frame={{ ...style.frame, borderWidth: 0, borderRadius: 12, shadow: 'none', innerPadding: 0 }}
              variant={variant}
              slotImportance="primary"
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Legacy Elements ──────────────────────────────────────────────────

function ExportLegacyElements({
  spread,
  style,
  side,
}: {
  spread: EditorSpread
  style: ResolvedSpreadStyle
  side: 'left' | 'right'
}) {
  const slotDataByUrl = useMemo(
    () => new Map((spread.slots ?? []).map((s) => [s.photoUrl, s])),
    [spread.slots],
  )

  const margin = style.spacing.pageMarginPercent
  const photos = side === 'left' ? spread.leftPhotos : spread.rightPhotos
  const variant = spread.variant ?? null

  const overlaySide = spread.templateId ? OVERLAY_TEMPLATES[spread.templateId] : undefined
  if (overlaySide === side) {
    return (
      <ExportOverlayPageElements
        spread={spread}
        style={style}
        side={side}
      />
    )
  }

  const template = spread.templateId ? getTemplate(spread.templateId) : undefined
  const pageSlots = template?.slots.filter((s) => s.page === side) ?? []

  if (template && pageSlots.length > 0 && photos.length > 0) {
    return (
      <div style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1, padding: `${margin}%` }}>
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          {pageSlots.map((slot, i) => {
            const src = photos[i]
            if (!src) return null
            const slotData = slotDataByUrl.get(src) as EnrichedSlotData | undefined
            const frame = slotData?.frame ?? style.frame
            return (
              <div
                key={`${spread.id}-${side}-${i}`}
                style={{
                  position: 'absolute',
                  left: `${slot.x}%`,
                  top: `${slot.y}%`,
                  width: `${slot.width}%`,
                  height: `${slot.height}%`,
                }}
              >
                <ExportLegacyPhotoSlot
                  src={src}
                  objectPosition={slotData?.objectPosition}
                  transform={slotData?.transform}
                  frame={frame}
                  variant={variant}
                  slotImportance={slotData?.importance}
                />
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (side === 'left') {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1, padding: `${margin}%`, gap: 0 }}>
        {photos.map((src, i) => {
          if (!src) return <div key={`empty-${i}`} style={{ flex: 1, minHeight: 0 }} />
          const slotData = slotDataByUrl.get(src) as EnrichedSlotData | undefined
          const frame = slotData?.frame ?? style.frame
          return (
            <ExportLegacyPhotoSlot
              key={`${spread.id}-left-${i}`}
              src={src}
              objectPosition={slotData?.objectPosition}
              transform={slotData?.transform}
              frame={frame}
              variant={variant}
              slotImportance={slotData?.importance}
            />
          )
        })}
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', position: 'relative', zIndex: 1, padding: `${margin}%`, gap: 0 }}>
      {photos.map((src, i) => {
        if (!src) return <div key={`empty-${i}`} />
        const slotData = slotDataByUrl.get(src) as EnrichedSlotData | undefined
        const frame = slotData?.frame ?? style.frame
        return (
          <ExportLegacyPhotoSlot
            key={`${spread.id}-right-${i}`}
            src={src}
            objectPosition={slotData?.objectPosition}
            transform={slotData?.transform}
            frame={frame}
            variant={variant}
            slotImportance={slotData?.importance}
          />
        )
      })}
      {spread.quote && (
        <LegacyQuoteBlock
          text={spread.quote}
          typography={style.typography}
          decorative={style.decorative}
          palette={style.palette}
        />
      )}
    </div>
  )
}

// ─── Single Page ──────────────────────────────────────────────────────

function ExportSinglePage({
  spread,
  side,
  globalPhotoFramePaddingPx,
  globalPageMarginPercent,
  globalPhotoBorderRadiusPx,
}: {
  spread: EditorSpread
  side: 'left' | 'right'
  globalPhotoFramePaddingPx: number | null
  globalPageMarginPercent: number | null
  globalPhotoBorderRadiusPx: number | null
}) {
  const design = spread.design
  const baseStyle = spread.resolvedStyle ?? DEFAULT_STYLE
  const style = useMemo<ResolvedSpreadStyle>(() => {
    if (
      globalPhotoFramePaddingPx === null
      && globalPageMarginPercent === null
      && globalPhotoBorderRadiusPx === null
    ) {
      return baseStyle
    }
    return {
      ...baseStyle,
      spacing: {
        ...baseStyle.spacing,
        ...(globalPageMarginPercent !== null ? { pageMarginPercent: globalPageMarginPercent } : {}),
      },
      frame: {
        ...baseStyle.frame,
        ...(globalPhotoFramePaddingPx !== null ? { innerPadding: globalPhotoFramePaddingPx } : {}),
        ...(globalPhotoBorderRadiusPx !== null ? { borderRadius: globalPhotoBorderRadiusPx } : {}),
      },
    }
  }, [baseStyle, globalPhotoFramePaddingPx, globalPageMarginPercent, globalPhotoBorderRadiusPx])

  const useAbs = !!design && design.elements.length > 0
  const bgColor = useAbs ? design!.background.color : style.background.color
  const heroPhotoSrc = spread.leftPhotos?.[0] ?? spread.rightPhotos?.[0] ?? null

  return (
    <div
      dir="rtl"
      style={{
        width: '50%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: bgColor,
      }}
    >
      <ExportPageBackground
        design={useAbs ? design : undefined}
        style={style}
        side={side}
        heroPhotoSrc={heroPhotoSrc}
      />

      {!useAbs && style.decorative.cornerOrnaments && (
        <LegacyCornerOrnaments color={style.palette.accent} />
      )}

      {useAbs ? (
        <ExportAbsoluteElements
          spread={spread}
          design={design!}
          side={side}
          layoutInsetPercent={style.spacing.pageMarginPercent}
          collectivePaddingPx={globalPhotoFramePaddingPx}
          collectiveBorderRadiusPx={globalPhotoBorderRadiusPx}
        />
      ) : (
        <ExportLegacyElements
          spread={spread}
          style={style}
          side={side}
        />
      )}
    </div>
  )
}

// ─── Main Renderer ────────────────────────────────────────────────────

export default function OffScreenSpreadRenderer({
  spreads,
  albumSizeId,
  onSpreadReady,
  onComplete,
  onError,
}: OffScreenSpreadRendererProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const spreadRef = useRef<HTMLDivElement>(null)
  const processingRef = useRef(false)

  const globalPhotoFramePaddingPx = useEditorStore((s) => s.globalPhotoFramePaddingPx)
  const globalPageMarginPercent = useEditorStore((s) => s.globalPageMarginPercent)
  const globalPhotoBorderRadiusPx = useEditorStore((s) => s.globalPhotoBorderRadiusPx)

  const sizeObj = ALBUM_SIZES.find((s) => s.id === albumSizeId)
  const aspectRatio = sizeObj ? sizeObj.openW / sizeObj.openH : 2
  const spreadWidth = RENDER_WIDTH_PER_PAGE * 2
  const spreadHeight = spreadWidth / aspectRatio

  const processCurrentSpread = useCallback(async () => {
    if (processingRef.current) return
    if (currentIndex >= spreads.length) {
      onComplete()
      return
    }
    if (!spreadRef.current) return

    processingRef.current = true
    try {
      await onSpreadReady(currentIndex, spreadRef.current)
      setCurrentIndex((prev) => prev + 1)
    } catch (err) {
      onError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      processingRef.current = false
    }
  }, [currentIndex, spreads.length, onSpreadReady, onComplete, onError])

  useEffect(() => {
    if (currentIndex >= spreads.length) {
      onComplete()
      return
    }
    const timer = setTimeout(processCurrentSpread, 200)
    return () => clearTimeout(timer)
  }, [currentIndex, spreads.length, processCurrentSpread, onComplete])

  if (currentIndex >= spreads.length) return null

  const spread = spreads[currentIndex]

  return (
    <div
      style={{
        position: 'fixed',
        left: '-9999px',
        top: 0,
        zIndex: -1,
        pointerEvents: 'none',
        opacity: 0,
      }}
      aria-hidden="true"
    >
      <div
        ref={spreadRef}
        style={{
          width: spreadWidth,
          height: spreadHeight,
          display: 'flex',
          flexDirection: 'row',
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
        }}
      >
        <ExportSinglePage
          spread={spread}
          side="right"
          globalPhotoFramePaddingPx={globalPhotoFramePaddingPx}
          globalPageMarginPercent={globalPageMarginPercent}
          globalPhotoBorderRadiusPx={globalPhotoBorderRadiusPx}
        />
        <ExportSinglePage
          spread={spread}
          side="left"
          globalPhotoFramePaddingPx={globalPhotoFramePaddingPx}
          globalPageMarginPercent={globalPageMarginPercent}
          globalPhotoBorderRadiusPx={globalPhotoBorderRadiusPx}
        />
      </div>
    </div>
  )
}
