import React, { useRef, useCallback, useState } from 'react'
import { motion } from 'motion/react'
import type { EditorSpread, PhotoElement } from '../../types'
import Icon from '../shared/Icon'

const SPREAD_LABELS: Record<number, string> = { 0: 'כריכה' }
function getSpreadLabel(index: number, total: number): string {
  if (SPREAD_LABELS[index]) return SPREAD_LABELS[index]
  if (index === total - 1 && total > 2) return 'סיום'
  return `עמוד ${index * 2 + 1}–${index * 2 + 2}`
}

export interface DragPayload {
  spreadId: string
  slotId: string
  photoUrl: string
  photoId: string
}

export interface SlotSelection {
  spreadId: string
  slotId: string
  spreadIndex: number
  rect: DOMRect
}

interface Props {
  spread: EditorSpread
  index: number
  total: number
  isCurrent: boolean
  dropTargetSlotId: string | null
  dropTargetSpreadId: string | null
  selectedSlot: SlotSelection | null
  thumbnailLookup: Record<string, string>
  onDragStart: (payload: DragPayload, rect: DOMRect) => void
  onJumpToSpread: (index: number) => void
  onDeleteSpread: (spreadId: string) => void
  onGenerateBg: (spreadIndex: number) => void
  onOpenBgPicker: (spreadId: string, rect: DOMRect) => void
  onSelectSlot: (selection: SlotSelection | null) => void
  entranceDelay: number
}

const CARD_SPRING = { type: 'spring' as const, stiffness: 420, damping: 30, mass: 0.7 }

function PhotoSlot({
  element,
  spreadId,
  spreadIndex,
  isDropTarget,
  isSelected,
  thumbnailUrl,
  onDragStart,
  onSelect,
}: {
  element: PhotoElement
  spreadId: string
  spreadIndex: number
  isDropTarget: boolean
  isSelected: boolean
  thumbnailUrl: string | null
  onDragStart: (payload: DragPayload, rect: DOMRect) => void
  onSelect: (selection: SlotSelection | null) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const startPos = useRef<{ x: number; y: number } | null>(null)
  const didDrag = useRef(false)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!element.photoUrl) return
    e.stopPropagation()
    startPos.current = { x: e.clientX, y: e.clientY }
    didDrag.current = false
  }, [element.photoUrl])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!startPos.current || didDrag.current) return
    const dx = e.clientX - startPos.current.x
    const dy = e.clientY - startPos.current.y
    if (Math.abs(dx) + Math.abs(dy) > 5) {
      didDrag.current = true
      const rect = ref.current?.getBoundingClientRect()
      if (rect && element.photoUrl) {
        onDragStart(
          { spreadId, slotId: element.slotId, photoUrl: element.photoUrl, photoId: element.photoId },
          rect,
        )
      }
    }
  }, [spreadId, element.slotId, element.photoUrl, element.photoId, onDragStart])

  const handlePointerUp = useCallback(() => {
    if (!didDrag.current && element.photoUrl && ref.current) {
      const rect = ref.current.getBoundingClientRect()
      onSelect({ spreadId, slotId: element.slotId, spreadIndex, rect })
    }
    startPos.current = null
    didDrag.current = false
  }, [element.photoUrl, element.slotId, spreadId, spreadIndex, onSelect])

  const hasPhoto = !!element.photoUrl
  const [imgLoaded, setImgLoaded] = useState(false)
  const imgSrc = thumbnailUrl || element.photoUrl

  return (
    <div
      ref={ref}
      className={`absolute overflow-hidden transition-all duration-200 ${
        isSelected ? 'z-20' : ''
      }`}
      style={{
        left: `${element.x}%`,
        top: `${element.y}%`,
        width: `${element.width}%`,
        height: `${element.height}%`,
        borderRadius: element.borderRadius,
        zIndex: isSelected ? 20 : element.zIndex,
      }}
      onPointerDown={hasPhoto ? handlePointerDown : undefined}
      onPointerMove={hasPhoto ? handlePointerMove : undefined}
      onPointerUp={hasPhoto ? handlePointerUp : undefined}
      onPointerCancel={() => { startPos.current = null; didDrag.current = false }}
      data-slot-id={element.slotId}
      data-spread-id={spreadId}
    >
      {hasPhoto ? (
        <>
          {!imgLoaded && (
            <div className="absolute inset-0 skeleton-shimmer rounded-[inherit]"
              style={{ background: 'linear-gradient(90deg, var(--color-surface-container) 25%, var(--color-surface-container-low) 50%, var(--color-surface-container) 75%)', backgroundSize: '200% 100%' }}
            />
          )}
          <img
            src={imgSrc!}
            alt=""
            className={`w-full h-full object-cover select-none transition-all duration-200 ${
              hasPhoto ? 'hover:brightness-[1.02]' : ''
            }`}
            style={{ objectPosition: element.objectPosition, opacity: imgLoaded ? 1 : 0 }}
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

      {isSelected && (
        <div className="absolute inset-0 rounded-[inherit] ring-2 ring-primary/60 pointer-events-none z-10" />
      )}

      {isDropTarget && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 rounded-[inherit] ring-2 ring-primary/70 bg-primary/10 pointer-events-none z-10"
        />
      )}
    </div>
  )
}

const OverviewSpreadCard = React.memo(function OverviewSpreadCard({
  spread,
  index,
  total,
  isCurrent,
  dropTargetSlotId,
  dropTargetSpreadId,
  selectedSlot,
  thumbnailLookup,
  onDragStart,
  onJumpToSpread,
  onDeleteSpread,
  onGenerateBg,
  onOpenBgPicker,
  onSelectSlot,
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

  const bgBtnRef = useRef<HTMLButtonElement>(null)

  const handleCardClick = useCallback(() => {
    onJumpToSpread(index)
  }, [onJumpToSpread, index])

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
          isCurrent
            ? 'ring-2 ring-primary/50 shadow-[0_4px_20px_rgba(96,92,72,0.15)]'
            : 'ring-1 ring-black/[0.06] shadow-[0_2px_8px_rgba(45,40,35,0.05)] hover:shadow-[0_6px_20px_rgba(45,40,35,0.10)] hover:ring-black/[0.10]'
        }`}
        onClick={handleCardClick}
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
                isDropTarget={dropTargetSpreadId === spread.id && dropTargetSlotId === el.slotId}
                isSelected={selectedSlot?.spreadId === spread.id && selectedSlot?.slotId === el.slotId}
                thumbnailUrl={el.photoId ? (thumbnailLookup[el.photoId] || null) : null}
                onDragStart={onDragStart}
                onSelect={onSelectSlot}
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
                isDropTarget={dropTargetSpreadId === spread.id && dropTargetSlotId === el.slotId}
                isSelected={selectedSlot?.spreadId === spread.id && selectedSlot?.slotId === el.slotId}
                thumbnailUrl={el.photoId ? (thumbnailLookup[el.photoId] || null) : null}
                onDragStart={onDragStart}
                onSelect={onSelectSlot}
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

        {/* Quick actions (hover) */}
        <div className="absolute top-2 left-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onGenerateBg(index) }}
            className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white hover:shadow-md transition-all"
            title="רקע AI"
          >
            <Icon name="auto_awesome" size={14} className="text-primary/70" />
          </button>
          <button
            ref={bgBtnRef}
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              const rect = bgBtnRef.current?.getBoundingClientRect()
              if (rect) onOpenBgPicker(spread.id, rect)
            }}
            className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white hover:shadow-md transition-all"
            title="צבע רקע"
          >
            <Icon name="palette" size={14} className="text-primary/70" />
          </button>
          {total > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDeleteSpread(spread.id) }}
              className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-red-50 hover:shadow-md transition-all"
              title="מחק עמוד"
            >
              <Icon name="delete" size={14} className="text-red-400" />
            </button>
          )}
        </div>

        {/* Current badge */}
        {isCurrent && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-primary/90 text-white text-[9px] font-bold z-30">
            נוכחי
          </div>
        )}
      </motion.div>

      {/* Label */}
      <span className={`text-xs font-medium text-center ${isCurrent ? 'text-primary' : 'text-secondary/50'}`}>
        {label}
      </span>
    </motion.div>
  )
})

export default OverviewSpreadCard
