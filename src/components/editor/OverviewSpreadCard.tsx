import React, { useState, useMemo } from 'react'
import type { PhotoElement } from '../../types'
import type { OverviewMode } from './OverviewSidebar'
import { useEditorStore } from '../../store/editorStore'
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

function PhotoSlot({
  element,
  spreadId,
  spreadIndex,
  mode,
  isSwapSource,
  thumbnailUrl,
  onClick,
  onRemoveSlot,
}: {
  element: PhotoElement
  spreadId: string
  spreadIndex: number
  mode: OverviewMode
  isSwapSource: boolean
  thumbnailUrl: string | null
  onClick: (spreadId: string, slotId: string, spreadIndex: number) => void
  onRemoveSlot: (spreadId: string, slotId: string) => void
}) {
  const hasPhoto = !!element.photoUrl
  const [imgLoaded, setImgLoaded] = useState(false)
  const imgSrc = thumbnailUrl || element.photoUrl

  const clickable = isPhotoClickMode(mode) && hasPhoto && !isSwapSource
  const showSwapIcon = mode === 'swap-target' && hasPhoto && !isSwapSource
  const showReplaceIcon = mode === 'replace' && hasPhoto
  const showRemoveIcon = mode === 'remove' && hasPhoto

  return (
    <div
      className={`absolute overflow-hidden group/slot ${clickable ? 'cursor-pointer' : ''}`}
      style={{
        left: `${element.x}%`,
        top: `${element.y}%`,
        width: `${element.width}%`,
        height: `${element.height}%`,
        borderRadius: element.borderRadius,
        zIndex: element.zIndex,
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
              objectPosition: element.objectPosition,
              opacity: imgLoaded ? 1 : 0,
              transition: 'opacity 0.15s ease',
            }}
            draggable={false}
            loading="lazy"
            decoding="async"
            onLoad={() => setImgLoaded(true)}
          />
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-black/[0.03] border border-dashed border-black/[0.08] rounded-[inherit]">
          <Icon name="add_photo_alternate" size={14} className="text-secondary/25" />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemoveSlot(spreadId, element.slotId) }}
            className="absolute top-1 left-1 w-5 h-5 rounded-full bg-error/80 hover:bg-error flex items-center justify-center shadow-sm opacity-0 group-hover/slot:opacity-100 transition-opacity duration-150 z-20"
          >
            <Icon name="close" size={11} className="text-white" />
          </button>
        </div>
      )}

      {isSwapSource && (
        <div className="absolute inset-0 rounded-[inherit] ring-2 ring-primary/60 bg-primary/10 pointer-events-none z-10">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-white/90 shadow flex items-center justify-center">
              <Icon name="check" size={14} className="text-primary" />
            </div>
          </div>
        </div>
      )}

      {clickable && !isSwapSource && (
        <div className="absolute inset-0 rounded-[inherit] bg-black/0 hover:bg-black/15 transition-colors duration-100 z-10 flex items-center justify-center opacity-0 hover:opacity-100">
          <div className="w-7 h-7 rounded-full bg-white/90 shadow-md flex items-center justify-center">
            {showSwapIcon && <Icon name="swap_horiz" size={15} className="text-deep-brown" />}
            {showReplaceIcon && <Icon name="swap_horiz" size={15} className="text-deep-brown" />}
            {showRemoveIcon && <Icon name="delete" size={15} className="text-red-500" />}
            {mode === 'swap-source' && <Icon name="touch_app" size={15} className="text-deep-brown" />}
          </div>
        </div>
      )}
    </div>
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

  if (!spread) return null

  const design = spread.design
  const hasDesign = design && design.elements.length > 0
  const label = getSpreadLabel(spreadIndex, total)

  const leftElements = useMemo(
    () => hasDesign ? design.elements.filter((e) => e.type === 'photo' && (e.page === 'left' || e.page === 'full')) as PhotoElement[] : [],
    [hasDesign, design?.elements],
  )
  const rightElements = useMemo(
    () => hasDesign ? design.elements.filter((e) => e.type === 'photo' && e.page === 'right') as PhotoElement[] : [],
    [hasDesign, design?.elements],
  )

  const bgColor = design?.background.color || '#FFFFFF'
  const genBgUrl = design?.background.generatedBgUrl
  const genBgLeftUrl = design?.background.generatedBgLeftUrl
  const genBgRightUrl = design?.background.generatedBgRightUrl

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

  return (
    <div className="flex flex-col gap-2">
      <div
        className={`overview-card relative rounded-xl overflow-hidden cursor-pointer group ${ringClass}`}
        onClick={handleClick}
        style={{ aspectRatio: '2 / 1' }}
      >
        {/* Background */}
        <div className="absolute inset-0" style={{ backgroundColor: bgColor }}>
          {genBgUrl && (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${genBgUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: design?.background.generatedBgOpacity ?? 1,
              }}
            />
          )}
          {genBgLeftUrl && (
            <div
              className="absolute inset-y-0 left-0 w-1/2"
              style={{
                backgroundImage: `url(${genBgLeftUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: design?.background.generatedBgLeftOpacity ?? 1,
              }}
            />
          )}
          {genBgRightUrl && (
            <div
              className="absolute inset-y-0 right-0 w-1/2"
              style={{
                backgroundImage: `url(${genBgRightUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: design?.background.generatedBgRightOpacity ?? 1,
              }}
            />
          )}
        </div>

        {/* Spine */}
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-black/[0.08] z-20 pointer-events-none" />

        {/* Left page elements */}
        <div className="absolute inset-y-0 left-0 w-1/2">
          {hasDesign ? (
            leftElements.map((el) => (
              <PhotoSlot
                key={el.slotId}
                element={el}
                spreadId={spread.id}
                spreadIndex={spreadIndex}
                mode={activeMode}
                isSwapSource={swapSourceSlotId === el.slotId}
                thumbnailUrl={el.photoId ? (thumbnailLookup[el.photoId] || null) : null}
                onClick={onClickPhoto}
                onRemoveSlot={onRemoveSlot}
              />
            ))
          ) : (
            spread.leftPhotos.map((src, i) =>
              src ? (
                <img key={i} src={src} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
              ) : null,
            )
          )}
        </div>

        {/* Right page elements */}
        <div className="absolute inset-y-0 right-0 w-1/2">
          {hasDesign ? (
            rightElements.map((el) => (
              <PhotoSlot
                key={el.slotId}
                element={el}
                spreadId={spread.id}
                spreadIndex={spreadIndex}
                mode={activeMode}
                isSwapSource={swapSourceSlotId === el.slotId}
                thumbnailUrl={el.photoId ? (thumbnailLookup[el.photoId] || null) : null}
                onClick={onClickPhoto}
                onRemoveSlot={onRemoveSlot}
              />
            ))
          ) : (
            spread.rightPhotos.map((src, i) =>
              src ? (
                <img key={i} src={src} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
              ) : null,
            )
          )}
        </div>

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
