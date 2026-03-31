import React, { useMemo, useCallback } from 'react'
import type {
  EditorSpread,
  SpreadDesign,
  ResolvedSpreadStyle,
  ResolvedFrame,
  EnrichedSlotData,
  TemplateVariant,
  PhotoElement,
  QuoteElement,
} from '../../types'
import {
  AbsolutePhotoElement,
  AbsoluteQuoteElement,
  AbsoluteDecorativeElement,
  EmptySlot,
  LegacyPhotoSlot,
  LegacyQuoteBlock,
  LegacyCornerOrnaments,
} from './EditorCanvas'
import { useEditorStore } from '../../store/editorStore'
import { DEFAULT_STYLE, getTexturePattern } from './editorDefaults'
import { getTemplate } from '../../lib/layoutGrammar'

const NOOP_SELECT_PHOTO: (id: string | null) => void = () => {}
const NOOP_SELECT_TEXT: (idx: number | null) => void = () => {}
const NOOP_SLOT = (_id: string) => {}

interface SpreadPageProps {
  spread: EditorSpread
  side: 'left' | 'right'
  spreadIndex: number
}

function PageBackground({
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
    return (
      <>
        {bg.generatedBgUrl && (
          <div
            className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
          >
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
          <div
            className="absolute z-0 rounded-md overflow-hidden"
            style={{
              inset: '3%',
            }}
          >
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
          <div
            className="absolute z-0 rounded-md overflow-hidden"
            style={{
              inset: '3%',
            }}
          >
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
      </>
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

const MemoPhotoWrapper = React.memo(function MemoPhotoWrapper({
  element,
  spreadId,
  elementIndex,
  pid,
  isSelected,
  isSwapping,
  onPhotoClick,
}: {
  element: PhotoElement
  spreadId: string
  elementIndex: number
  pid: string
  isSelected: boolean
  isSwapping: boolean
  onPhotoClick: (slotId: string, pid: string) => void
}) {
  const handleSelect = useCallback(() => {
    onPhotoClick(element.slotId, pid)
  }, [onPhotoClick, element.slotId, pid])

  return (
    <AbsolutePhotoElement
      element={element}
      spreadId={spreadId}
      elementIndex={elementIndex}
      isSelected={isSelected}
      isSwapping={isSwapping}
      onSelect={handleSelect}
    />
  )
})

const MemoQuoteWrapper = React.memo(function MemoQuoteWrapper({
  element,
  elementIndex,
  isSelected,
  onQuoteClick,
}: {
  element: QuoteElement
  elementIndex: number
  isSelected: boolean
  onQuoteClick: (gIdx: number) => void
}) {
  const handleSelect = useCallback(() => {
    onQuoteClick(elementIndex)
  }, [onQuoteClick, elementIndex])

  return (
    <AbsoluteQuoteElement
      element={element}
      elementIndex={elementIndex}
      isSelected={isSelected}
      onSelect={handleSelect}
    />
  )
})

function AbsolutePageElements({
  spread,
  design,
  side,
  selectedPhotoId,
  selectedTextIndex,
  selectPhoto,
  selectText,
  swapPhase,
  swapSourceSlotId: _swapSourceSlotId,
  onSwapClick,
}: {
  spread: EditorSpread
  design: SpreadDesign
  side: 'left' | 'right'
  selectedPhotoId: string | null
  selectedTextIndex: number | null
  selectPhoto: (id: string | null) => void
  selectText: (idx: number | null) => void
  swapPhase: 'off' | 'pick-source' | 'pick-target'
  swapSourceSlotId: string | null
  onSwapClick: (slotId: string) => void
}) {
  const isSwapping = swapPhase !== 'off'

  const elementIndexMap = useMemo(() => {
    const map = new Map<string, number>()
    design.elements.forEach((el, globalIdx) => {
      const key = `${el.page}-${el.type}-${el.x}-${el.y}`
      map.set(key, globalIdx)
    })
    return map
  }, [design.elements])

  const getGlobalIndex = useCallback((el: { page: string; type: string; x: number; y: number }) => {
    return elementIndexMap.get(`${el.page}-${el.type}-${el.x}-${el.y}`) ?? -1
  }, [elementIndexMap])

  const elements = design.elements.filter((e) => e.page === side)

  const handlePhotoClick = useCallback((slotId: string, pid: string) => {
    if (isSwapping && onSwapClick) {
      onSwapClick(slotId)
    } else {
      selectPhoto(selectedPhotoId === pid ? null : pid)
    }
  }, [isSwapping, onSwapClick, selectPhoto, selectedPhotoId])

  const handleQuoteClick = useCallback((gIdx: number) => {
    selectText(gIdx)
  }, [selectText])

  return (
    <>
      {elements.map((el, i) => {
        if (el.type === 'photo') {
          const pid = `${spread.id}-${el.slotId}`
          return (
            <MemoPhotoWrapper
              key={pid}
              element={el}
              spreadId={spread.id}
              elementIndex={getGlobalIndex(el)}
              pid={pid}
              isSelected={!isSwapping && selectedPhotoId === pid}
              isSwapping={isSwapping}
              onPhotoClick={handlePhotoClick}
            />
          )
        }
        if (el.type === 'quote') {
          const gIdx = getGlobalIndex(el)
          return (
            <MemoQuoteWrapper
              key={`q-${side}-${gIdx}`}
              element={el}
              elementIndex={gIdx}
              isSelected={selectedTextIndex === gIdx}
              onQuoteClick={handleQuoteClick}
            />
          )
        }
        return <AbsoluteDecorativeElement key={`d-${side}-${i}-${el.x}-${el.y}`} element={el} />
      })}
    </>
  )
}

const MemoLegacyPhotoSlot = React.memo(function MemoLegacyPhotoSlot({
  src,
  photoId,
  isSelected,
  onToggleSelect,
  objectPosition,
  transform,
  frame,
  variant,
  slotImportance,
}: {
  src: string
  photoId: string
  isSelected: boolean
  onToggleSelect: (photoId: string) => void
  objectPosition?: string
  transform?: string
  frame: ResolvedFrame
  variant: TemplateVariant | null
  slotImportance?: string
}) {
  const handleSelect = useCallback(() => {
    onToggleSelect(photoId)
  }, [onToggleSelect, photoId])

  return (
    <LegacyPhotoSlot
      src={src}
      isSelected={isSelected}
      onSelect={handleSelect}
      objectPosition={objectPosition}
      transform={transform}
      frame={frame}
      variant={variant}
      slotImportance={slotImportance}
    />
  )
})

const OVERLAY_TEMPLATES: Record<string, 'left' | 'right'> = {
  'photo-over-photo': 'left',
  'photo-over-photo-right': 'right',
}

function OverlayPageElements({
  spread,
  style,
  variant,
  side,
  selectedPhotoId,
  selectPhoto,
}: {
  spread: EditorSpread
  style: ResolvedSpreadStyle
  variant: TemplateVariant | null
  side: 'left' | 'right'
  selectedPhotoId: string | null
  selectPhoto: (id: string | null) => void
}) {
  const slotDataByUrl = useMemo(
    () => new Map((spread.slots ?? []).map((s) => [s.photoUrl, s])),
    [spread.slots],
  )

  const handleToggleSelect = useCallback((photoId: string) => {
    selectPhoto(selectedPhotoId === photoId ? null : photoId)
  }, [selectPhoto, selectedPhotoId])

  const photos = side === 'left' ? spread.leftPhotos : spread.rightPhotos
  const bgSrc = photos[0]
  const overlaySrc = photos[1]

  const bgSlotData = bgSrc ? slotDataByUrl.get(bgSrc) as EnrichedSlotData | undefined : undefined
  const overlaySlotData = overlaySrc ? slotDataByUrl.get(overlaySrc) as EnrichedSlotData | undefined : undefined

  return (
    <div className="w-full h-full relative z-[1]">
      {bgSrc ? (
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ borderRadius: style.frame.borderRadius }}
        >
          <MemoLegacyPhotoSlot
            src={bgSrc}
            photoId={`${spread.id}-${side}-0`}
            isSelected={selectedPhotoId === `${spread.id}-${side}-0`}
            onToggleSelect={handleToggleSelect}
            objectPosition={bgSlotData?.objectPosition}
            transform={bgSlotData?.transform}
            frame={{ ...style.frame, borderWidth: 0, shadow: 'none', innerPadding: 0 }}
            variant={variant}
            slotImportance="hero"
          />
        </div>
      ) : (
        <EmptySlot spreadId={spread.id} side={side} index={0} className="absolute inset-0" />
      )}

      {overlaySrc && (
        <div
          className="absolute z-10"
          style={{
            right: side === 'left' ? '6%' : undefined,
            left: side === 'right' ? '6%' : undefined,
            bottom: '6%',
            width: '38%',
            aspectRatio: '1',
          }}
        >
          <div
            className="w-full h-full rounded-xl overflow-hidden"
            style={{
              boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.15)',
              border: '3px solid rgba(255,255,255,0.85)',
            }}
          >
            <MemoLegacyPhotoSlot
              src={overlaySrc}
              photoId={`${spread.id}-${side}-1`}
              isSelected={selectedPhotoId === `${spread.id}-${side}-1`}
              onToggleSelect={handleToggleSelect}
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

function LegacyPageElements({
  spread,
  style,
  variant,
  side,
  selectedPhotoId,
  selectPhoto,
}: {
  spread: EditorSpread
  style: ResolvedSpreadStyle
  variant: TemplateVariant | null
  side: 'left' | 'right'
  selectedPhotoId: string | null
  selectPhoto: (id: string | null) => void
}) {
  const slotDataByUrl = useMemo(
    () => new Map((spread.slots ?? []).map((s) => [s.photoUrl, s])),
    [spread.slots],
  )

  const handleToggleSelect = useCallback((photoId: string) => {
    selectPhoto(selectedPhotoId === photoId ? null : photoId)
  }, [selectPhoto, selectedPhotoId])

  const adj = variant?.adjustments
  const gapPx = adj?.gapOverride ?? style.spacing.photoGapPx
  const margin = style.spacing.pageMarginPercent
  const photos = side === 'left' ? spread.leftPhotos : spread.rightPhotos

  const overlaySide = spread.templateId ? OVERLAY_TEMPLATES[spread.templateId] : undefined
  if (overlaySide === side) {
    return (
      <OverlayPageElements
        spread={spread}
        style={style}
        variant={variant}
        side={side}
        selectedPhotoId={selectedPhotoId}
        selectPhoto={selectPhoto}
      />
    )
  }

  const template = spread.templateId ? getTemplate(spread.templateId) : undefined
  const allPageSlots = template?.slots.filter((s) => s.page === side) ?? []
  const pageSlots = allPageSlots

  if (template && pageSlots.length > 0 && photos.length > 0) {
    const gapPercent = gapPx * 0.2
    return (
      <div className="w-full h-full relative z-[1]" style={{ padding: `${margin}%` }}>
        <div className="w-full h-full relative">
          {pageSlots.map((slot, i) => {
            const src = photos[i]
            const photoId = `${spread.id}-${side}-${i}`
            const isSelected = selectedPhotoId === photoId

            if (!src) return null

            const slotData = slotDataByUrl.get(src) as EnrichedSlotData | undefined
            const frame = slotData?.frame ?? style.frame

            return (
              <div
                key={photoId}
                className="absolute [&>*]:!w-full [&>*]:!h-full"
                style={{
                  left: `${slot.x + gapPercent / 2}%`,
                  top: `${slot.y + gapPercent / 2}%`,
                  width: `${slot.width - gapPercent}%`,
                  height: `${slot.height - gapPercent}%`,
                }}
              >
                <MemoLegacyPhotoSlot
                  src={src}
                  photoId={photoId}
                  isSelected={isSelected}
                  onToggleSelect={handleToggleSelect}
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
      <div
        className="w-full h-full flex flex-col relative z-[1]"
        style={{ padding: `${margin}%`, gap: gapPx }}
      >
        {photos.map((src, i) => {
          const photoId = `${spread.id}-left-${i}`
          const isSelected = selectedPhotoId === photoId
          if (!src) {
            return <EmptySlot key={photoId} spreadId={spread.id} side="left" index={i} className="flex-1 min-h-0" />
          }
          const slotData = slotDataByUrl.get(src) as EnrichedSlotData | undefined
          const frame = slotData?.frame ?? style.frame
          return (
            <MemoLegacyPhotoSlot
              key={photoId}
              src={src}
              photoId={photoId}
              isSelected={isSelected}
              onToggleSelect={handleToggleSelect}
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
    <div
      className="w-full h-full grid grid-cols-2 relative z-[1]"
      style={{ padding: `${margin}%`, gap: gapPx }}
    >
      {photos.map((src, i) => {
        const photoId = `${spread.id}-right-${i}`
        const isSelected = selectedPhotoId === photoId
        if (!src) {
          return <EmptySlot key={photoId} spreadId={spread.id} side="right" index={i} />
        }
        const slotData = slotDataByUrl.get(src) as EnrichedSlotData | undefined
        const frame = slotData?.frame ?? style.frame
        return (
          <MemoLegacyPhotoSlot
            key={photoId}
            src={src}
            photoId={photoId}
            isSelected={isSelected}
            onToggleSelect={handleToggleSelect}
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

const SpreadPage = React.memo(React.forwardRef<HTMLDivElement, SpreadPageProps>(
  function SpreadPage({ spread, side, spreadIndex }, ref) {
    const isCurrent = useEditorStore((s) => s.currentSpreadIndex === spreadIndex)
    const selectedPhotoId = useEditorStore((s) =>
      s.currentSpreadIndex === spreadIndex ? s.selectedPhotoId : null,
    )
    const selectedTextIndex = useEditorStore((s) =>
      s.currentSpreadIndex === spreadIndex ? s.selectedTextIndex : null,
    )
    const selectPhoto = useEditorStore((s) => s.selectPhoto)
    const selectText = useEditorStore((s) => s.selectText)
    const swapPhase = useEditorStore((s) =>
      s.currentSpreadIndex === spreadIndex ? s.swapPhase : ('off' as const),
    )
    const swapSourceSlotId = useEditorStore((s) =>
      s.currentSpreadIndex === spreadIndex ? s.swapSourceSlotId : null,
    )

    const onSwapClick = useCallback((slotId: string) => {
      const { swapPhase: phase, setSwapSource, executeSwap } = useEditorStore.getState()
      if (phase === 'pick-source') setSwapSource(slotId)
      else if (phase === 'pick-target') executeSwap(slotId)
    }, [])

    const globalPhotoGapPx = useEditorStore((s) => s.globalPhotoGapPx)
    const globalPageMarginPercent = useEditorStore((s) => s.globalPageMarginPercent)

    const design = spread.design
    const baseStyle = spread.resolvedStyle ?? DEFAULT_STYLE
    const style = useMemo<ResolvedSpreadStyle>(() => {
      if (globalPhotoGapPx === null && globalPageMarginPercent === null) return baseStyle
      return {
        ...baseStyle,
        spacing: {
          ...baseStyle.spacing,
          ...(globalPhotoGapPx !== null ? { photoGapPx: globalPhotoGapPx } : {}),
          ...(globalPageMarginPercent !== null ? { pageMarginPercent: globalPageMarginPercent } : {}),
        },
      }
    }, [baseStyle, globalPhotoGapPx, globalPageMarginPercent])
    const variant = spread.variant ?? null
    const useAbs = !!design && design.elements.length > 0
    const bgColor = useAbs ? design!.background.color : style.background.color
    const heroPhotoSrc = spread.leftPhotos?.[0] ?? spread.rightPhotos?.[0] ?? null

    return (
      <div
        ref={ref}
        data-density="hard"
        dir="rtl"
        style={{
          backgroundColor: bgColor,
          width: '100%',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          transform: 'scaleX(-1)',
        }}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('[data-slot-id], [data-has-photo]')) return
          document.dispatchEvent(new CustomEvent('momento:bg-click'))
        }}
      >
        <PageBackground
          design={useAbs ? design : undefined}
          style={style}
          side={side}
          heroPhotoSrc={heroPhotoSrc}
        />

        {!useAbs && style.decorative.cornerOrnaments && (
          <LegacyCornerOrnaments color={style.palette.accent} />
        )}

        {useAbs ? (
          <AbsolutePageElements
            spread={spread}
            design={design!}
            side={side}
            selectedPhotoId={isCurrent ? selectedPhotoId : null}
            selectedTextIndex={isCurrent ? selectedTextIndex : null}
            selectPhoto={isCurrent ? selectPhoto : NOOP_SELECT_PHOTO}
            selectText={isCurrent ? selectText : NOOP_SELECT_TEXT}
            swapPhase={isCurrent ? swapPhase : 'off'}
            swapSourceSlotId={isCurrent ? swapSourceSlotId : null}
            onSwapClick={isCurrent ? onSwapClick : NOOP_SLOT}
          />
        ) : (
          <LegacyPageElements
            spread={spread}
            style={style}
            variant={variant}
            side={side}
            selectedPhotoId={isCurrent ? selectedPhotoId : null}
            selectPhoto={isCurrent ? selectPhoto : NOOP_SELECT_PHOTO}
          />
        )}
      </div>
    )
  },
))

export default SpreadPage
