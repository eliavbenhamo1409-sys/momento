import { useRef, useEffect, useCallback, useState, useMemo } from 'react'
import type {
  EditorSpread,
  SpreadDesign,
  ResolvedSpreadStyle,
  EnrichedSlotData,
} from '../../types'
import {
  AbsolutePhotoElement,
  AbsoluteQuoteElement,
  AbsoluteDecorativeElement,
  LegacyPhotoSlot,
  LegacyQuoteBlock,
  LegacyCornerOrnaments,
} from '../editor/EditorCanvas'
import { DEFAULT_STYLE, getTexturePattern } from '../editor/editorDefaults'
import { getTemplate } from '../../lib/layoutGrammar'
import { ALBUM_SIZES } from '../../lib/constants'

const RENDER_WIDTH_PER_PAGE = 600

interface OffScreenSpreadRendererProps {
  spreads: EditorSpread[]
  albumSizeId: string
  onSpreadReady: (index: number, element: HTMLDivElement) => Promise<void>
  onComplete: () => void
  onError: (error: Error) => void
}

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
        {!bg.generatedBgUrl && bg.backgroundLayers?.map((layer, i) => (
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

function ExportAbsoluteElements({
  spread,
  design,
  side,
  layoutInsetPercent,
}: {
  spread: EditorSpread
  design: SpreadDesign
  side: 'left' | 'right'
  layoutInsetPercent: number
}) {
  const elements = design.elements.filter((e) => e.page === side)

  return (
    <>
      {elements.map((el, i) => {
        if (el.type === 'photo') {
          return (
            <AbsolutePhotoElement
              key={`${spread.id}-${el.slotId}`}
              element={el}
              spreadId={spread.id}
              elementIndex={i}
              isSelected={false}
              isSwapping={false}
              onSelect={() => {}}
              layoutInsetPercent={layoutInsetPercent}
              collectivePaddingPx={null}
              collectiveBorderRadiusPx={null}
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

  const template = spread.templateId ? getTemplate(spread.templateId) : undefined
  const pageSlots = template?.slots.filter((s) => s.page === side) ?? []

  if (template && pageSlots.length > 0 && photos.length > 0) {
    return (
      <div className="w-full h-full relative z-[1]" style={{ padding: `${margin}%` }}>
        <div className="w-full h-full relative">
          {pageSlots.map((slot, i) => {
            const src = photos[i]
            if (!src) return null
            const slotData = slotDataByUrl.get(src) as EnrichedSlotData | undefined
            const frame = slotData?.frame ?? style.frame
            return (
              <div
                key={`${spread.id}-${side}-${i}`}
                className="absolute [&>*]:!w-full [&>*]:!h-full"
                style={{
                  left: `${slot.x}%`,
                  top: `${slot.y}%`,
                  width: `${slot.width}%`,
                  height: `${slot.height}%`,
                }}
              >
                <LegacyPhotoSlot
                  src={src}
                  isSelected={false}
                  onSelect={() => {}}
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
      <div className="w-full h-full flex flex-col relative z-[1]" style={{ padding: `${margin}%`, gap: 0 }}>
        {photos.map((src, i) => {
          if (!src) return <div key={`empty-${i}`} className="flex-1 min-h-0" />
          const slotData = slotDataByUrl.get(src) as EnrichedSlotData | undefined
          const frame = slotData?.frame ?? style.frame
          return (
            <LegacyPhotoSlot
              key={`${spread.id}-left-${i}`}
              src={src}
              isSelected={false}
              onSelect={() => {}}
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
    <div className="w-full h-full grid grid-cols-2 relative z-[1]" style={{ padding: `${margin}%`, gap: 0 }}>
      {photos.map((src, i) => {
        if (!src) return <div key={`empty-${i}`} />
        const slotData = slotDataByUrl.get(src) as EnrichedSlotData | undefined
        const frame = slotData?.frame ?? style.frame
        return (
          <LegacyPhotoSlot
            key={`${spread.id}-right-${i}`}
            src={src}
            isSelected={false}
            onSelect={() => {}}
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

function ExportSinglePage({
  spread,
  side,
}: {
  spread: EditorSpread
  side: 'left' | 'right'
}) {
  const design = spread.design
  const style = spread.resolvedStyle ?? DEFAULT_STYLE
  const useAbs = !!design && design.elements.length > 0
  const bgColor = useAbs ? design!.background.color : style.background.color
  const heroPhotoSrc = spread.leftPhotos?.[0] ?? spread.rightPhotos?.[0] ?? null

  return (
    <div
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

/**
 * Renders album spreads off-screen one at a time for high-res export.
 * Mounts the current spread, calls onSpreadReady with the DOM element,
 * waits for the capture to complete, then advances to the next spread.
 */
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
    const timer = setTimeout(processCurrentSpread, 100)
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
        <ExportSinglePage spread={spread} side="right" />
        <ExportSinglePage spread={spread} side="left" />
      </div>
    </div>
  )
}
