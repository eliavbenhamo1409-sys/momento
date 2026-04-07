import React, { useState, useMemo } from 'react'
import type { PhotoElement, QuoteElement, DecorativeElement, SpreadDesignBackground } from '../../types'
import type { OverviewMode } from './OverviewSidebar'
import { useEditorStore } from '../../store/editorStore'
import { applyPageMarginToPercentRect } from '../../lib/layoutInset'
import { DEFAULT_STYLE, getTexturePattern } from './editorDefaults'
import Icon from '../shared/Icon'

const SPREAD_LABELS: Record<number, string> = { 0: 'כריכה' }
function getSpreadLabel(index: number, total: number): string {
  if (SPREAD_LABELS[index]) return SPREAD_LABELS[index]
  if (index === total - 1 && total > 2) return 'סיום'
  return `עמוד ${index * 2 + 1}–${index * 2 + 2}`
}

interface Props {
  spreadIndex: number
  total: number
  isCurrent: boolean
  activeMode: OverviewMode
  swapSourceSlotId: string | null
  thumbnailLookup: Record<string, string>
  onClickPhoto: (spreadId: string, slotId: string, spreadIndex: number) => void
  onClickSpread: (spreadId: string, spreadIndex: number) => void
  onRemoveSlot: (spreadId: string, slotId: string) => void
  onJumpToSpread: (index: number) => void
}

function isPhotoClickMode(mode: OverviewMode) {
  return mode === 'replace' || mode === 'swap-source' || mode === 'swap-target' || mode === 'remove'
}

function isSpreadClickMode(mode: OverviewMode) {
  return mode === 'bg-color' || mode === 'bg-ai' || mode === 'bg-ai-panel' || mode === 'delete-spread'
}

function MiniPhotoSlot({
  element,
  spreadId,
  spreadIndex,
  mode,
  isSwapSource,
  thumbnailUrl,
  onClick,
  onRemoveSlot,
  layoutInsetPercent,
  collectivePaddingPx,
  collectiveBorderRadiusPx,
}: {
  element: PhotoElement
  spreadId: string
  spreadIndex: number
  mode: OverviewMode
  isSwapSource: boolean
  thumbnailUrl: string | null
  onClick: (spreadId: string, slotId: string, spreadIndex: number) => void
  onRemoveSlot: (spreadId: string, slotId: string) => void
  layoutInsetPercent: number
  collectivePaddingPx: number | null
  collectiveBorderRadiusPx: number | null
}) {
  const hasPhoto = !!element.photoUrl
  const [imgLoaded, setImgLoaded] = useState(false)
  const imgSrc = thumbnailUrl || element.photoUrl

  const clickable = isPhotoClickMode(mode) && hasPhoto && !isSwapSource

  const rect = applyPageMarginToPercentRect(
    element.x, element.y, element.width, element.height, layoutInsetPercent,
  )

  const pad = collectivePaddingPx != null ? collectivePaddingPx : element.padding
  const radius = collectiveBorderRadiusPx != null ? collectiveBorderRadiusPx : element.borderRadius
  const scale = element.scale ?? 1

  return (
    <div
      className={`absolute overflow-hidden group/slot ${clickable ? 'cursor-pointer' : ''}`}
      style={{
        left: `${rect.x}%`,
        top: `${rect.y}%`,
        width: `${rect.width}%`,
        height: `${rect.height}%`,
        borderRadius: radius,
        zIndex: element.zIndex,
        padding: pad > 0 && !element.clipPath ? pad * 0.4 : undefined,
        backgroundColor: pad > 0 && !element.clipPath ? '#FFFFFF' : undefined,
        boxShadow: element.shadow && element.shadow !== 'none' ? element.shadow : undefined,
        transform: element.rotation !== 0 ? `rotate(${element.rotation.toFixed(1)}deg)` : undefined,
        clipPath: element.clipPath || undefined,
        WebkitClipPath: element.clipPath || undefined,
      }}
      onClick={(e) => {
        if (clickable) {
          e.stopPropagation()
          onClick(spreadId, element.slotId, spreadIndex)
        }
      }}
      data-slot-id={element.slotId}
      data-spread-id={spreadId}
    >
      {hasPhoto ? (
        <>
          {!imgLoaded && (
            <div className="absolute inset-0 bg-surface-container animate-pulse rounded-[inherit]" />
          )}
          <img
            src={imgSrc!}
            alt=""
            className="w-full h-full object-cover select-none"
            style={{
              objectPosition: element.objectPosition || '50% 35%',
              transform: scale > 1 ? `scale(${Math.max(1.12, scale)})` : undefined,
              transformOrigin: element.objectPosition || '50% 35%',
              opacity: imgLoaded ? 1 : 0,
              transition: 'opacity 0.15s ease',
              borderRadius: radius > 8
                ? Math.max(4, radius * 0.6)
                : Math.max(0, radius - (pad * 0.4)),
            }}
            draggable={false}
            loading="lazy"
            decoding="async"
            onLoad={() => setImgLoaded(true)}
          />
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-black/[0.03] border border-dashed border-black/[0.08] rounded-[inherit]">
          <Icon name="add_photo_alternate" size={10} className="text-secondary/20" />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemoveSlot(spreadId, element.slotId) }}
            className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-error/80 hover:bg-error flex items-center justify-center shadow-sm opacity-0 group-hover/slot:opacity-100 transition-opacity duration-150 z-20"
          >
            <Icon name="close" size={9} className="text-white" />
          </button>
        </div>
      )}

      {isSwapSource && (
        <div className="absolute inset-0 rounded-[inherit] ring-2 ring-primary/60 bg-primary/10 pointer-events-none z-10">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-5 h-5 rounded-full bg-white/90 shadow flex items-center justify-center">
              <Icon name="check" size={11} className="text-primary" />
            </div>
          </div>
        </div>
      )}

      {clickable && !isSwapSource && (
        <div className="absolute inset-0 rounded-[inherit] bg-black/0 hover:bg-black/15 transition-colors duration-100 z-10 flex items-center justify-center opacity-0 hover:opacity-100">
          <div className="w-5 h-5 rounded-full bg-white/90 shadow-md flex items-center justify-center">
            {mode === 'swap-target' && <Icon name="swap_horiz" size={11} className="text-deep-brown" />}
            {mode === 'replace' && <Icon name="swap_horiz" size={11} className="text-deep-brown" />}
            {mode === 'remove' && <Icon name="delete" size={11} className="text-red-500" />}
            {mode === 'swap-source' && <Icon name="touch_app" size={11} className="text-deep-brown" />}
          </div>
        </div>
      )}
    </div>
  )
}

function MiniQuoteElement({ element, layoutInsetPercent }: { element: QuoteElement; layoutInsetPercent: number }) {
  const rect = applyPageMarginToPercentRect(element.x, element.y, element.width, element.height, layoutInsetPercent)
  return (
    <div
      className="absolute pointer-events-none flex items-center justify-center overflow-hidden"
      style={{
        left: `${rect.x}%`,
        top: `${rect.y}%`,
        width: `${rect.width}%`,
        height: `${rect.height}%`,
        zIndex: element.zIndex,
        padding: '2%',
      }}
    >
      <p
        className="text-center leading-tight overflow-hidden"
        style={{
          fontFamily: element.fontFamily,
          fontWeight: element.fontWeight,
          fontStyle: element.italic ? 'italic' : 'normal',
          fontSize: Math.max(4, element.fontSize * 0.28),
          color: element.color,
          lineHeight: element.lineHeight,
          letterSpacing: element.letterSpacing,
          textAlign: element.align,
        }}
      >
        {element.text}
      </p>
    </div>
  )
}

function MiniDecorativeElement({ element, layoutInsetPercent }: { element: DecorativeElement; layoutInsetPercent: number }) {
  const rect = applyPageMarginToPercentRect(element.x, element.y, element.width, element.height, layoutInsetPercent)
  const base: React.CSSProperties = {
    position: 'absolute',
    left: `${rect.x}%`,
    top: `${rect.y}%`,
    width: `${rect.width}%`,
    height: `${rect.height}%`,
    zIndex: element.zIndex,
    opacity: element.opacity,
    pointerEvents: 'none',
    transform: element.rotation !== 0 ? `rotate(${element.rotation}deg)` : undefined,
  }

  if (element.type === 'accent-line' || element.type === 'divider') {
    return (
      <div style={{ ...base, height: 1, background: element.color, opacity: (element.opacity ?? 1) * 0.5 }} />
    )
  }
  if (element.type === 'gradient-wash') {
    return (
      <div style={{ ...base, backgroundImage: element.gradient, mixBlendMode: (element.blendMode ?? 'multiply') as React.CSSProperties['mixBlendMode'] }} />
    )
  }
  if (element.type === 'script-text') {
    return (
      <div style={{ ...base, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{
          fontFamily: element.fontFamily ?? 'Great Vibes',
          fontSize: Math.max(4, (element.fontSize ?? 36) * 0.25),
          color: element.color,
          whiteSpace: 'nowrap',
        }}>
          {element.text}
        </span>
      </div>
    )
  }
  return null
}

function MiniPageBackground({
  design,
  side,
}: {
  design: { background: SpreadDesignBackground }
  side: 'left' | 'right'
}) {
  if (!design) return null
  const bg = design.background
  const offsetLeft = side === 'left' ? '0' : '-100%'

  return (
    <>
      {bg.generatedBgUrl && (
        <div className="absolute inset-0 z-0 overflow-hidden">
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
        <div className="absolute z-0 overflow-hidden" style={{ inset: '3%' }}>
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `url(${bg.generatedBgLeftUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: bg.generatedBgLeftOpacity ?? 1,
            }}
          />
        </div>
      )}
      {side === 'right' && bg.generatedBgRightUrl && (
        <div className="absolute z-0 overflow-hidden" style={{ inset: '3%' }}>
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `url(${bg.generatedBgRightUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: bg.generatedBgRightOpacity ?? 1,
            }}
          />
        </div>
      )}
      {!bg.generatedBgUrl && bg.backgroundLayers?.map((layer, i) => (
        <div
          key={i}
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
              filter: `blur(${(bg.blurPx ?? 60) * 0.3}px)`,
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
    </>
  )
}

const OverviewSpreadCard = React.memo(function OverviewSpreadCard({
  spreadIndex,
  total,
  isCurrent,
  activeMode,
  swapSourceSlotId,
  thumbnailLookup,
  onClickPhoto,
  onClickSpread,
  onRemoveSlot,
  onJumpToSpread,
}: Props) {
  const spread = useEditorStore((s) => s.spreads[spreadIndex])
  const globalPadding = useEditorStore((s) => s.globalPhotoFramePaddingPx)
  const globalMargin = useEditorStore((s) => s.globalPageMarginPercent)
  const globalRadius = useEditorStore((s) => s.globalPhotoBorderRadiusPx)

  if (!spread) return null

  const design = spread.design
  const hasDesign = design && design.elements.length > 0
  const label = getSpreadLabel(spreadIndex, total)

  const baseStyle = spread.resolvedStyle ?? DEFAULT_STYLE
  const layoutInset = globalMargin ?? baseStyle.spacing.pageMarginPercent

  const { leftElements, rightElements, leftQuotes, rightQuotes, leftDecorative, rightDecorative } = useMemo(() => {
    if (!hasDesign) return { leftElements: [] as PhotoElement[], rightElements: [] as PhotoElement[], leftQuotes: [] as QuoteElement[], rightQuotes: [] as QuoteElement[], leftDecorative: [] as DecorativeElement[], rightDecorative: [] as DecorativeElement[] }
    const photos = design.elements.filter((e) => e.type === 'photo') as PhotoElement[]
    const quotes = design.elements.filter((e) => e.type === 'quote') as QuoteElement[]
    const decoratives = design.elements.filter((e) => e.type !== 'photo' && e.type !== 'quote') as DecorativeElement[]
    return {
      leftElements: photos.filter((e) => e.page === 'left' || e.page === 'full'),
      rightElements: photos.filter((e) => e.page === 'right'),
      leftQuotes: quotes.filter((e) => e.page === 'left'),
      rightQuotes: quotes.filter((e) => e.page === 'right'),
      leftDecorative: decoratives.filter((e) => e.page === 'left'),
      rightDecorative: decoratives.filter((e) => e.page === 'right'),
    }
  }, [hasDesign, design?.elements])

  const bgColor = hasDesign ? design.background.color : baseStyle.background.color

  const spreadClickable = isSpreadClickMode(activeMode)

  const handleClick = () => {
    if (spreadClickable) {
      onClickSpread(spread.id, spreadIndex)
    } else if (activeMode === 'idle') {
      onJumpToSpread(spreadIndex)
    }
  }

  const ringClass = spreadClickable
    ? 'ring-1 ring-primary/30 shadow-overview-card hover:ring-2 hover:ring-primary/50 hover:shadow-overview-card-hover'
    : isCurrent
      ? 'ring-2 ring-primary/30 shadow-overview-card-active'
      : 'ring-1 ring-black/[0.06] shadow-overview-card hover:shadow-overview-card-hover hover:ring-black/[0.10]'

  const renderPage = (side: 'left' | 'right') => {
    const photos = side === 'left' ? leftElements : rightElements
    const quotes = side === 'left' ? leftQuotes : rightQuotes
    const decoratives = side === 'left' ? leftDecorative : rightDecorative

    return (
      <div className={`absolute inset-y-0 ${side === 'left' ? 'left-0' : 'right-0'} w-1/2 overflow-hidden`}>
        {hasDesign && (
          <MiniPageBackground design={design} side={side} />
        )}

        {hasDesign ? (
          <>
            {decoratives.map((el, i) => (
              <MiniDecorativeElement key={`d-${i}`} element={el} layoutInsetPercent={layoutInset} />
            ))}
            {photos.map((el) => (
              <MiniPhotoSlot
                key={el.slotId}
                element={el}
                spreadId={spread.id}
                spreadIndex={spreadIndex}
                mode={activeMode}
                isSwapSource={swapSourceSlotId === el.slotId}
                thumbnailUrl={el.photoId ? (thumbnailLookup[el.photoId] || null) : null}
                onClick={onClickPhoto}
                onRemoveSlot={onRemoveSlot}
                layoutInsetPercent={layoutInset}
                collectivePaddingPx={globalPadding}
                collectiveBorderRadiusPx={globalRadius}
              />
            ))}
            {quotes.map((el, i) => (
              <MiniQuoteElement key={`q-${i}`} element={el} layoutInsetPercent={layoutInset} />
            ))}
          </>
        ) : (
          (side === 'left' ? spread.leftPhotos : spread.rightPhotos).map((src, i) =>
            src ? (
              <img key={i} src={src} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
            ) : null,
          )
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        className={`overview-card relative rounded-xl overflow-hidden cursor-pointer group ${ringClass}`}
        onClick={handleClick}
        style={{ aspectRatio: '2 / 1' }}
      >
        {/* Base background color */}
        <div className="absolute inset-0" style={{ backgroundColor: bgColor }} />

        {/* Spine */}
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-black/[0.08] z-20 pointer-events-none" />

        {renderPage('left')}
        {renderPage('right')}

        {/* Current badge */}
        {isCurrent && activeMode === 'idle' && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-primary/90 text-white text-[9px] font-bold z-30">
            נוכחי
          </div>
        )}
      </div>

      {/* Label */}
      <span className={`text-xs font-medium text-center ${isCurrent ? 'text-primary/70' : 'text-secondary/50'}`}>
        {label}
      </span>
    </div>
  )
})

export default OverviewSpreadCard
