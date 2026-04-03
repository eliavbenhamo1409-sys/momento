import React, { useState } from 'react'
import { motion } from 'motion/react'
import type { EditorSpread, PhotoElement } from '../../types'
import type { OverviewMode } from './OverviewSidebar'
import Icon from '../shared/Icon'

const SPREAD_LABELS: Record<number, string> = { 0: 'כריכה' }
function getSpreadLabel(index: number, total: number): string {
  if (SPREAD_LABELS[index]) return SPREAD_LABELS[index]
  if (index === total - 1 && total > 2) return 'סיום'
  return `עמוד ${index * 2 + 1}–${index * 2 + 2}`
}

interface Props {
  spread: EditorSpread
  index: number
  total: number
  isCurrent: boolean
  activeMode: OverviewMode
  swapSourceSlotId: string | null
  thumbnailLookup: Record<string, string>
  onClickPhoto: (spreadId: string, slotId: string, spreadIndex: number) => void
  onClickSpread: (spreadId: string, spreadIndex: number) => void
  onJumpToSpread: (index: number) => void
  entranceDelay: number
}

const CARD_SPRING = { type: 'spring' as const, stiffness: 420, damping: 30, mass: 0.7 }

function isPhotoClickMode(mode: OverviewMode) {
  return mode === 'replace' || mode === 'swap-source' || mode === 'swap-target' || mode === 'remove'
}

function isSpreadClickMode(mode: OverviewMode) {
  return mode === 'bg-color' || mode === 'bg-ai' || mode === 'delete-spread'
}

function PhotoSlot({
  element,
  spreadId,
  spreadIndex,
  mode,
  isSwapSource,
  thumbnailUrl,
  onClick,
}: {
  element: PhotoElement
  spreadId: string
  spreadIndex: number
  mode: OverviewMode
  isSwapSource: boolean
  thumbnailUrl: string | null
  onClick: (spreadId: string, slotId: string, spreadIndex: number) => void
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
      className={`absolute overflow-hidden transition-all duration-150 ${
        clickable ? 'cursor-pointer' : ''
      }`}
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
            <div
              className="absolute inset-0 skeleton-shimmer rounded-[inherit]"
              style={{
                background: 'linear-gradient(90deg, var(--color-surface-container) 25%, var(--color-surface-container-low) 50%, var(--color-surface-container) 75%)',
                backgroundSize: '200% 100%',
              }}
            />
          )}
          <img
            src={imgSrc!}
            alt=""
            className="w-full h-full object-cover select-none transition-all duration-150"
            style={{
              objectPosition: element.objectPosition,
              opacity: imgLoaded ? 1 : 0,
            }}
            draggable={false}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
          />
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-black/[0.03] border border-dashed border-black/[0.08] rounded-[inherit]">
          <Icon name="add_photo_alternate" size={14} className="text-secondary/25" />
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
        <div className="absolute inset-0 rounded-[inherit] bg-black/0 hover:bg-black/15 transition-colors duration-150 z-10 flex items-center justify-center opacity-0 hover:opacity-100">
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
  spread,
  index,
  total,
  isCurrent,
  activeMode,
  swapSourceSlotId,
  thumbnailLookup,
  onClickPhoto,
  onClickSpread,
  onJumpToSpread,
  entranceDelay,
}: Props) {
  const design = spread.design
  const hasDesign = design && design.elements.length > 0
  const label = getSpreadLabel(index, total)

  const leftElements = hasDesign
    ? (design.elements.filter((e) => e.type === 'photo' && (e.page === 'left' || e.page === 'full')) as PhotoElement[])
    : []
  const rightElements = hasDesign
    ? (design.elements.filter((e) => e.type === 'photo' && e.page === 'right') as PhotoElement[])
    : []

  const bgColor = design?.background.color || '#FFFFFF'
  const genBgUrl = design?.background.generatedBgUrl
  const genBgLeftUrl = design?.background.generatedBgLeftUrl
  const genBgRightUrl = design?.background.generatedBgRightUrl

  const spreadClickable = isSpreadClickMode(activeMode)

  const handleClick = () => {
    if (spreadClickable) {
      onClickSpread(spread.id, index)
    } else if (activeMode === 'idle') {
      onJumpToSpread(index)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ ...CARD_SPRING, delay: entranceDelay }}
      className="flex flex-col gap-2"
    >
      <motion.div
        whileHover={{ scale: 1.012 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={`relative rounded-xl overflow-hidden cursor-pointer group transition-shadow duration-300 ${
          spreadClickable
            ? 'ring-1 ring-primary/30 shadow-[0_2px_8px_rgba(45,40,35,0.05)] hover:ring-2 hover:ring-primary/50 hover:shadow-[0_6px_24px_rgba(96,92,72,0.18)]'
            : isCurrent
              ? 'ring-2 ring-primary/30 shadow-[0_4px_20px_rgba(96,92,72,0.12)]'
              : 'ring-1 ring-black/[0.06] shadow-[0_2px_8px_rgba(45,40,35,0.05)] hover:shadow-[0_6px_20px_rgba(45,40,35,0.10)] hover:ring-black/[0.10]'
        }`}
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
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-black/[0.08] z-20" />

        {/* Left page elements */}
        <div className="absolute inset-y-0 left-0 w-1/2">
          {hasDesign ? (
            leftElements.map((el) => (
              <PhotoSlot
                key={el.slotId}
                element={el}
                spreadId={spread.id}
                spreadIndex={index}
                mode={activeMode}
                isSwapSource={swapSourceSlotId === el.slotId}
                thumbnailUrl={el.photoId ? (thumbnailLookup[el.photoId] || null) : null}
                onClick={onClickPhoto}
              />
            ))
          ) : (
            spread.leftPhotos.map((src, i) =>
              src ? (
                <img key={i} src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
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
                spreadIndex={index}
                mode={activeMode}
                isSwapSource={swapSourceSlotId === el.slotId}
                thumbnailUrl={el.photoId ? (thumbnailLookup[el.photoId] || null) : null}
                onClick={onClickPhoto}
              />
            ))
          ) : (
            spread.rightPhotos.map((src, i) =>
              src ? (
                <img key={i} src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
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
      </motion.div>

      {/* Label */}
      <span className={`text-xs font-medium text-center ${isCurrent ? 'text-primary/70' : 'text-secondary/50'}`}>
        {label}
      </span>
    </motion.div>
  )
})

export default OverviewSpreadCard
