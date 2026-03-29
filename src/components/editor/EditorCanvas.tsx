import { useRef, useMemo, useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import HTMLFlipBook from 'react-pageflip'
import { useEditorStore } from '../../store/editorStore'
import { useShallow } from 'zustand/react/shallow'
import Icon from '../shared/Icon'
import SpreadPage from './SpreadPage'
import { DEFAULT_FRAME, DEFAULT_STYLE, getTexturePattern } from './editorDefaults'
import type {
  EditorSpread,
  PhotoElement,
  QuoteElement,
  DecorativeElement,
  ResolvedSpreadStyle,
  ResolvedFrame,
  TemplateVariant,
  FamilyDecorative,
  FamilyTypography,
} from '../../types'

// Re-export defaults & texture util for consumers that import from here
export { DEFAULT_FRAME, DEFAULT_STYLE, getTexturePattern }

const NOOP_SELECT_PHOTO: (id: string | null) => void = () => {}
const NOOP_SELECT_TEXT: (idx: number | null) => void = () => {}
const NOOP_SLOT = (_id: string) => {}

// ─── Nav Arrow ───────────────────────────────────────────────────────

function SpreadNavArrow({
  direction,
  disabled,
  onClick,
}: {
  direction: 'prev' | 'next'
  disabled: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      type="button"
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.08 }}
      whileTap={{ scale: disabled ? 1 : 0.92 }}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      aria-label={direction === 'prev' ? 'עמוד קודם' : 'עמוד הבא'}
      className="shrink-0 z-[5] w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center text-secondary/40 hover:text-on-surface bg-white/60 backdrop-blur-sm hover:bg-white border border-black/[0.06] hover:border-black/[0.10] shadow-[0_2px_10px_rgba(45,40,35,0.06)] hover:shadow-[0_4px_16px_rgba(45,40,35,0.10)] disabled:opacity-0 disabled:pointer-events-none transition-all duration-300"
    >
      <Icon name={direction === 'prev' ? 'chevron_left' : 'chevron_right'} size={22} />
    </motion.button>
  )
}

// ─── Empty Slot ──────────────────────────────────────────────────────

export function EmptySlot({
  spreadId,
  side,
  index,
  className,
  style,
}: {
  spreadId: string
  side: 'left' | 'right'
  index: number
  className?: string
  style?: React.CSSProperties
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const assignSlotImageFromFile = useEditorStore((s) => s.assignSlotImageFromFile)

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className={`rounded-lg overflow-hidden relative bg-surface-container-low/30 border border-dashed border-outline-variant/25 ${className ?? ''}`}
      style={style}
      onClick={(e) => e.stopPropagation()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) assignSlotImageFromFile(spreadId, side, index, f)
          e.target.value = ''
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full h-full min-h-[4.5rem] flex flex-col items-center justify-center gap-2 text-secondary/50 hover:text-primary/70 hover:bg-primary/[0.03] transition-all px-3"
      >
        <Icon name="add_photo_alternate" size={26} className="text-primary/35" />
        <span className="text-[11px] font-medium text-center leading-snug">הוסף תמונה</span>
      </button>
    </motion.div>
  )
}

// ─── Photo Slot (legacy mode — flex/grid) ─────────────────────────────

export function LegacyPhotoSlot({
  src,
  isSelected,
  onSelect,
  objectPosition,
  transform,
  frame,
  variant,
  slotImportance,
}: {
  src: string
  isSelected: boolean
  onSelect: () => void
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
    <motion.div
      whileHover={{ scale: isSelected ? 1 : 1.008 }}
      transition={{ duration: 0.2 }}
      className={`relative overflow-hidden cursor-pointer transition-all duration-200 group ${
        isSelected
          ? 'ring-[2.5px] ring-primary ring-offset-[3px] ring-offset-white shadow-[0_0_0_1px_rgba(96,92,72,0.08),0_8px_24px_-4px_rgba(96,92,72,0.18)]'
          : ''
      }`}
      style={frameStyle}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
    >
      <div className="w-full h-full overflow-hidden" style={{ borderRadius: Math.max(0, frame.borderRadius - frame.innerPadding) }}>
        <img
          src={src}
          alt=""
          className="w-full h-full object-cover"
          style={{
            objectPosition: objectPosition || '50% 50%',
            transform: transform || undefined,
          }}
        />
      </div>

      {!isSelected && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-3">
          <span className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-primary font-medium text-xs flex items-center gap-1.5 shadow-sm">
            <Icon name="touch_app" size={14} />
            עריכה
          </span>
        </div>
      )}

      {isSelected && (
        <div className="absolute top-1.5 start-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-sm z-20">
          <Icon name="check" size={14} className="text-white" />
        </div>
      )}
    </motion.div>
  )
}

// ─── Absolute-Positioned Photo Element ───────────────────────────────

export function AbsolutePhotoElement({
  element,
  spreadId: _spreadId,
  elementIndex,
  isSelected,
  isSwapSource = false,
  isSwapTarget = false,
  isSwapping = false,
  onSelect,
}: {
  element: PhotoElement
  spreadId?: string
  elementIndex: number
  isSelected: boolean
  isSwapSource?: boolean
  isSwapTarget?: boolean
  isSwapping?: boolean
  onSelect: () => void
}) {
  const updatePos = useEditorStore((s) => s.updatePhotoObjectPosition)
  const updateScale = useEditorStore((s) => s.updatePhotoScale)
  const replaceInSlot = useEditorStore((s) => s.replacePhotoInSlot)
  const removeSlot = useEditorStore((s) => s.removePhotoSlot)
  const [isDragging, setIsDragging] = useState(false)
  const [showZoom, setShowZoom] = useState(false)
  const longPressTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const zoomHideTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const startPosRef = useRef<{ x: number; y: number; objX: number; objY: number } | null>(null)
  const didDragRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const emptyFileRef = useRef<HTMLInputElement>(null)

  const currentScale = element.scale ?? 1

  const parseObjectPosition = useCallback(() => {
    const parts = (element.objectPosition || '50% 50%').split(/\s+/)
    return {
      x: parseFloat(parts[0]) || 50,
      y: parseFloat(parts[1]) || 50,
    }
  }, [element.objectPosition])

  const nudgePosition = useCallback((dx: number, dy: number) => {
    const pos = parseObjectPosition()
    const newX = Math.min(100, Math.max(0, pos.x + dx))
    const newY = Math.min(100, Math.max(0, pos.y + dy))
    updatePos(element.slotId, `${newX.toFixed(1)}% ${newY.toFixed(1)}%`)
  }, [parseObjectPosition, updatePos, element.slotId])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!element.photoUrl) return
    e.stopPropagation()
    const pos = parseObjectPosition()
    startPosRef.current = { x: e.clientX, y: e.clientY, objX: pos.x, objY: pos.y }
    didDragRef.current = false

    longPressTimer.current = setTimeout(() => {
      setIsDragging(true)
      didDragRef.current = true
      containerRef.current?.setPointerCapture(e.pointerId)
    }, 300)
  }, [element.photoUrl, parseObjectPosition])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !startPosRef.current || !containerRef.current) return
    e.stopPropagation()
    e.preventDefault()

    const rect = containerRef.current.getBoundingClientRect()
    const dx = e.clientX - startPosRef.current.x
    const dy = e.clientY - startPosRef.current.y

    const sensitivityX = 100 / rect.width
    const sensitivityY = 100 / rect.height

    const newX = Math.min(100, Math.max(0, startPosRef.current.objX - dx * sensitivityX))
    const newY = Math.min(100, Math.max(0, startPosRef.current.objY - dy * sensitivityY))

    updatePos(element.slotId, `${newX.toFixed(1)}% ${newY.toFixed(1)}%`)
  }, [isDragging, element.slotId, updatePos])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    clearTimeout(longPressTimer.current)

    if (isDragging) {
      setIsDragging(false)
      containerRef.current?.releasePointerCapture(e.pointerId)
      return
    }

    if (!didDragRef.current) {
      e.stopPropagation()
      onSelect()
    }
    startPosRef.current = null
  }, [isDragging, onSelect])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!element.photoUrl) return
    e.stopPropagation()
    e.preventDefault()

    const delta = e.ctrlKey ? -e.deltaY * 0.01 : -e.deltaY * 0.003
    const newScale = Math.round(Math.min(3, Math.max(1, currentScale + delta)) * 100) / 100

    updateScale(element.slotId, newScale)

    setShowZoom(true)
    clearTimeout(zoomHideTimer.current)
    zoomHideTimer.current = setTimeout(() => setShowZoom(false), 800)
  }, [element.photoUrl, element.slotId, currentScale, updateScale])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const prevent = (e: WheelEvent) => {
      if (element.photoUrl) e.preventDefault()
    }
    el.addEventListener('wheel', prevent, { passive: false })
    return () => el.removeEventListener('wheel', prevent)
  }, [element.photoUrl])

  useEffect(() => {
    return () => {
      clearTimeout(longPressTimer.current)
      clearTimeout(zoomHideTimer.current)
    }
  }, [])

  const positionStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${element.x}%`,
    top: `${element.y}%`,
    width: `${element.width}%`,
    height: `${element.height}%`,
    zIndex: isDragging ? 50 : element.zIndex,
    borderWidth: element.borderWidth > 0 && !element.clipPath ? element.borderWidth : undefined,
    borderColor: element.borderWidth > 0 && !element.clipPath ? element.borderColor : undefined,
    borderStyle: element.borderWidth > 0 && !element.clipPath ? 'solid' : undefined,
    borderRadius: element.clipPath ? undefined : element.borderRadius,
    boxShadow: element.shadow || undefined,
    padding: element.padding > 0 && !element.clipPath ? element.padding : undefined,
    backgroundColor: element.padding > 0 && !element.clipPath ? '#FFFFFF' : undefined,
    transform: element.rotation !== 0 ? `rotate(${element.rotation.toFixed(1)}deg)` : undefined,
    overflow: 'hidden',
    clipPath: element.clipPath || undefined,
    WebkitClipPath: element.clipPath || undefined,
    cursor: isDragging ? 'grabbing' : 'pointer',
    touchAction: 'none',
  }

  const zoomPct = Math.round(currentScale * 100)

  const ringClass = isSwapSource
    ? 'ring-[3px] ring-amber-400 ring-offset-[3px] ring-offset-white shadow-[0_0_0_1px_rgba(217,180,30,0.15),0_8px_24px_-4px_rgba(217,180,30,0.20)]'
    : isSelected
      ? 'ring-[2.5px] ring-primary ring-offset-[3px] ring-offset-white shadow-[0_0_0_1px_rgba(96,92,72,0.08),0_8px_24px_-4px_rgba(96,92,72,0.18)]'
      : isDragging
        ? 'ring-2 ring-amber-400/60'
        : ''

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: isSwapSource ? 1.02 : 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: isSwapping ? 1.03 : isSelected && !isDragging ? 1 : 1.008 }}
      className={`group ${ringClass}`}
      style={{
        ...positionStyle,
        cursor: isSwapping ? 'pointer' : positionStyle.cursor,
      }}
      onPointerDown={isSwapping ? undefined : handlePointerDown}
      onPointerMove={isSwapping ? undefined : handlePointerMove}
      onPointerUp={isSwapping ? undefined : handlePointerUp}
      onPointerCancel={isSwapping ? undefined : () => {
        clearTimeout(longPressTimer.current)
        setIsDragging(false)
      }}
      onClick={isSwapping ? (e) => { e.stopPropagation(); onSelect() } : undefined}
      onWheel={isSwapping ? undefined : handleWheel}
    >
      <div
        className="w-full h-full overflow-hidden"
        style={{ borderRadius: element.borderRadius > 8
          ? Math.max(4, element.borderRadius * 0.6)
          : Math.max(0, element.borderRadius - element.padding) }}
      >
        {element.photoUrl ? (
          <img
            src={element.photoUrl}
            alt=""
            className="w-full h-full object-cover select-none"
            draggable={false}
            style={{
              objectPosition: element.objectPosition || '50% 50%',
              objectFit: element.objectFit,
              transformOrigin: currentScale > 1 ? (element.objectPosition || '50% 50%') : undefined,
              transform: currentScale > 1 ? `scale(${currentScale})` : undefined,
            }}
          />
        ) : (
          <div
            className="group/slot relative w-full h-full bg-surface-container-low/40 border-2 border-dashed border-outline-variant/30 rounded-lg flex flex-col items-center justify-center gap-2.5 cursor-pointer hover:bg-primary/[0.04] hover:border-primary/25 transition-all duration-200"
            onClick={(e) => { e.stopPropagation(); if (!isSwapping) emptyFileRef.current?.click() }}
          >
            <input
              ref={emptyFileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) replaceInSlot(element.slotId, f)
                e.target.value = ''
              }}
            />
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSwapping ? 'bg-amber-400/10' : 'bg-primary/[0.07]'}`}>
              <Icon name={isSwapping ? 'swap_horiz' : 'add_photo_alternate'} size={22} className={isSwapping ? 'text-amber-400/70' : 'text-primary/40'} />
            </div>
            {!isSwapping && <span className="text-[11px] font-semibold text-secondary/50">הוסף תמונה</span>}
            {!isSwapping && elementIndex >= 0 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeSlot(elementIndex) }}
                className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-error/80 hover:bg-error flex items-center justify-center shadow-sm opacity-0 group-hover/slot:opacity-100 transition-all duration-200 z-20"
                title="הסר משבצת"
              >
                <Icon name="close" size={14} className="text-white" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Swap source badge */}
      {isSwapSource && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="bg-amber-500/85 backdrop-blur-sm px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
            <Icon name="check_circle" size={15} className="text-white" />
            <span className="text-white text-xs font-bold">נבחרה</span>
          </div>
        </div>
      )}

      {/* Swap target hover indicator */}
      {isSwapTarget && !isSwapSource && (
        <div className="absolute inset-0 bg-amber-400/0 group-hover:bg-amber-400/10 transition-colors duration-200 flex items-center justify-center pointer-events-none z-20">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="bg-amber-500/80 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
              <Icon name="swap_horiz" size={15} className="text-white" />
              <span className="text-white text-xs font-bold">החלף לכאן</span>
            </div>
          </div>
        </div>
      )}

      {/* Zoom indicator */}
      {showZoom && element.photoUrl && !isSwapping && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="bg-black/55 backdrop-blur-sm px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
            <Icon name={currentScale > 1.5 ? 'zoom_in' : currentScale > 1 ? 'zoom_in' : 'zoom_out'} size={15} className="text-white/90" />
            <span className="text-white text-xs font-bold tabular-nums">{zoomPct}%</span>
          </div>
        </div>
      )}

      {/* Drag indicator */}
      {isDragging && !isSwapping && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <Icon name="open_with" size={16} className="text-white" />
            <span className="text-white text-xs font-medium">גרור למיקום</span>
          </div>
        </div>
      )}

      {!isSelected && !isDragging && !showZoom && !isSwapping && element.photoUrl && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-3">
          <span className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-primary font-medium text-xs flex items-center gap-1.5 shadow-sm">
            <Icon name="touch_app" size={14} />
            עריכה
          </span>
        </div>
      )}

      {isSelected && element.photoUrl && !isDragging && !showZoom && !isSwapping && (
        <>
          <div className="absolute top-1.5 start-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-sm z-20">
            <Icon name="check" size={14} className="text-white" />
          </div>

          {/* Position nudge controls — visible when zoomed */}
          {currentScale > 1 && (
            <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
              {/* Up */}
              <button
                className="pointer-events-auto absolute top-1.5 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-black/45 backdrop-blur-sm hover:bg-black/65 active:scale-90 flex items-center justify-center transition-all shadow-md"
                onClick={(e) => { e.stopPropagation(); nudgePosition(0, -8) }}
                aria-label="הזז למעלה"
              >
                <Icon name="expand_less" size={20} className="text-white" />
              </button>

              {/* Down */}
              <button
                className="pointer-events-auto absolute bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-black/45 backdrop-blur-sm hover:bg-black/65 active:scale-90 flex items-center justify-center transition-all shadow-md"
                onClick={(e) => { e.stopPropagation(); nudgePosition(0, 8) }}
                aria-label="הזז למטה"
              >
                <Icon name="expand_more" size={20} className="text-white" />
              </button>

              {/* Left */}
              <button
                className="pointer-events-auto absolute left-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/45 backdrop-blur-sm hover:bg-black/65 active:scale-90 flex items-center justify-center transition-all shadow-md"
                onClick={(e) => { e.stopPropagation(); nudgePosition(-8, 0) }}
                aria-label="הזז שמאלה"
              >
                <Icon name="chevron_left" size={20} className="text-white" />
              </button>

              {/* Right */}
              <button
                className="pointer-events-auto absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/45 backdrop-blur-sm hover:bg-black/65 active:scale-90 flex items-center justify-center transition-all shadow-md"
                onClick={(e) => { e.stopPropagation(); nudgePosition(8, 0) }}
                aria-label="הזז ימינה"
              >
                <Icon name="chevron_right" size={20} className="text-white" />
              </button>

              {/* Reset center */}
              <button
                className="pointer-events-auto w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 active:scale-90 flex items-center justify-center transition-all shadow-md"
                onClick={(e) => { e.stopPropagation(); updatePos(element.slotId, '50% 50%') }}
                aria-label="מרכז"
              >
                <Icon name="center_focus_strong" size={16} className="text-white" />
              </button>
            </div>
          )}
        </>
      )}
    </motion.div>
  )
}

// ─── Absolute-Positioned Quote Element ───────────────────────────────

export function AbsoluteQuoteElement({
  element,
  elementIndex,
  isSelected,
  onSelect,
}: {
  element: QuoteElement
  elementIndex: number
  isSelected: boolean
  onSelect: () => void
}) {
  const updateText = useEditorStore((s) => s.updateTextElement)
  const removeText = useEditorStore((s) => s.removeTextElement)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const startRef = useRef<{ x: number; y: number; elX: number; elY: number; elW: number; elH: number } | null>(null)
  const resizeCornerRef = useRef<string>('')

  const showQuoteMarks = element.quoteMarks !== 'none'
  const quoteMarkSize = element.quoteMarks === 'serif-large' ? 28 : element.quoteMarks === 'elegant' ? 22 : 18

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).dataset.resizeHandle) return
    e.stopPropagation()
    const parent = containerRef.current?.parentElement
    if (!parent) return
    startRef.current = {
      x: e.clientX, y: e.clientY,
      elX: element.x, elY: element.y,
      elW: element.width, elH: element.height,
    }
    setIsDragging(true)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [element.x, element.y, element.width, element.height])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!startRef.current) return
    const parent = containerRef.current?.parentElement
    if (!parent) return
    const rect = parent.getBoundingClientRect()
    const dx = e.clientX - startRef.current.x
    const dy = e.clientY - startRef.current.y

    if (isDragging) {
      const newX = Math.max(0, Math.min(95, startRef.current.elX + (dx / rect.width) * 100))
      const newY = Math.max(0, Math.min(95, startRef.current.elY + (dy / rect.height) * 100))
      updateText(elementIndex, { x: newX, y: newY })
    }

    if (isResizing) {
      const corner = resizeCornerRef.current
      const dxPct = (dx / rect.width) * 100
      const dyPct = (dy / rect.height) * 100
      let newW = startRef.current.elW
      let newH = startRef.current.elH
      let newX = startRef.current.elX
      let newY = startRef.current.elY

      if (corner.includes('r')) newW = Math.max(15, startRef.current.elW + dxPct)
      if (corner.includes('l')) { newW = Math.max(15, startRef.current.elW - dxPct); newX = startRef.current.elX + dxPct }
      if (corner.includes('b')) newH = Math.max(8, startRef.current.elH + dyPct)
      if (corner.includes('t')) { newH = Math.max(8, startRef.current.elH - dyPct); newY = startRef.current.elY + dyPct }

      updateText(elementIndex, { x: newX, y: newY, width: newW, height: newH })
    }
  }, [isDragging, isResizing, elementIndex, updateText])

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
    startRef.current = null
  }, [])

  const startResize = useCallback((e: React.PointerEvent, corner: string) => {
    e.stopPropagation()
    const parent = containerRef.current?.parentElement
    if (!parent) return
    startRef.current = {
      x: e.clientX, y: e.clientY,
      elX: element.x, elY: element.y,
      elW: element.width, elH: element.height,
    }
    resizeCornerRef.current = corner
    setIsResizing(true)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [element.x, element.y, element.width, element.height])

  const handleFontSizeChange = useCallback((delta: number) => {
    updateText(elementIndex, { fontSize: Math.max(10, Math.min(72, element.fontSize + delta)) })
  }, [elementIndex, element.fontSize, updateText])

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      style={{
        position: 'absolute',
        left: `${element.x}%`,
        top: `${element.y}%`,
        width: `${element.width}%`,
        height: `${element.height}%`,
        zIndex: isSelected ? 50 : element.zIndex,
        display: 'flex',
        flexDirection: 'column',
        alignItems: element.align === 'center' ? 'center' : element.align === 'end' ? 'flex-end' : 'flex-start',
        justifyContent: 'center',
        padding: '4%',
        cursor: isDragging ? 'grabbing' : 'pointer',
        touchAction: 'none',
      }}
      className={isSelected ? 'ring-2 ring-primary/60 ring-offset-1 ring-offset-white/50 rounded-lg bg-white/10' : 'hover:ring-1 hover:ring-primary/20 rounded-lg'}
      onClick={(e) => { e.stopPropagation(); onSelect() }}
      onPointerDown={isSelected ? handlePointerDown : undefined}
      onPointerMove={isSelected ? handlePointerMove : undefined}
      onPointerUp={isSelected ? handlePointerUp : undefined}
      onPointerCancel={isSelected ? handlePointerUp : undefined}
    >
      {showQuoteMarks && (
        <span style={{ color: element.color, opacity: 0.3 }}>
          <Icon name="format_quote" size={quoteMarkSize} className="rotate-180" />
        </span>
      )}
      <p
        style={{
          fontFamily: element.fontFamily,
          fontWeight: element.fontWeight,
          fontSize: element.fontSize,
          fontStyle: element.italic ? 'italic' : 'normal',
          lineHeight: element.lineHeight,
          letterSpacing: element.letterSpacing,
          textAlign: element.align,
          color: element.color,
          margin: 0,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {element.text}
      </p>

      {/* Selection controls */}
      {isSelected && (
        <>
          {/* Resize handles */}
          {['tl', 'tr', 'bl', 'br'].map((corner) => (
            <div
              key={corner}
              data-resize-handle="true"
              className="absolute w-3 h-3 bg-white border-2 border-primary rounded-full shadow-sm z-50 cursor-nwse-resize"
              style={{
                top: corner.includes('t') ? -6 : undefined,
                bottom: corner.includes('b') ? -6 : undefined,
                left: corner.includes('l') ? -6 : undefined,
                right: corner.includes('r') ? -6 : undefined,
                cursor: corner === 'tl' || corner === 'br' ? 'nwse-resize' : 'nesw-resize',
              }}
              onPointerDown={(e) => startResize(e, corner)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            />
          ))}

          {/* Floating toolbar */}
          <div
            className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1 rounded-xl bg-white/95 backdrop-blur-sm shadow-lg border border-black/[0.06] z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => handleFontSizeChange(-2)}
              className="w-6 h-6 rounded-md hover:bg-surface-container-high flex items-center justify-center text-secondary/70 transition-colors"
            >
              <Icon name="text_decrease" size={14} />
            </button>
            <span className="text-[10px] text-secondary/50 font-medium tabular-nums min-w-[2rem] text-center">{element.fontSize}</span>
            <button
              onClick={() => handleFontSizeChange(2)}
              className="w-6 h-6 rounded-md hover:bg-surface-container-high flex items-center justify-center text-secondary/70 transition-colors"
            >
              <Icon name="text_increase" size={14} />
            </button>
            <div className="w-px h-4 bg-black/[0.06]" />
            <button
              onClick={() => removeText(elementIndex)}
              className="w-6 h-6 rounded-md hover:bg-error/10 flex items-center justify-center text-error/60 transition-colors"
            >
              <Icon name="delete" size={14} />
            </button>
          </div>
        </>
      )}
    </motion.div>
  )
}

// ─── Absolute-Positioned Decorative Element ──────────────────────────

export function AbsoluteDecorativeElement({ element }: { element: DecorativeElement }) {
  const basePos: React.CSSProperties = {
    position: 'absolute',
    left: `${element.x}%`,
    top: `${element.y}%`,
    width: `${element.width}%`,
    height: `${element.height}%`,
    zIndex: element.zIndex,
    opacity: element.opacity,
    pointerEvents: 'none',
    transform: element.rotation !== 0 ? `rotate(${element.rotation}deg)` : undefined,
  }

  switch (element.type) {
    case 'script-text':
      return (
        <div style={{ ...basePos, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span
            style={{
              fontFamily: element.fontFamily ?? 'Great Vibes',
              fontSize: element.fontSize ?? 36,
              fontWeight: element.fontWeight ?? 400,
              fontStyle: element.italic ? 'italic' : 'normal',
              color: element.color,
              whiteSpace: 'nowrap',
              userSelect: 'none',
              lineHeight: 1,
            }}
          >
            {element.text}
          </span>
        </div>
      )

    case 'accent-line':
      return (
        <div
          style={{
            ...basePos,
            height: element.height < 1 ? 1 : `${element.height}%`,
            background: `linear-gradient(90deg, transparent, ${element.color}, transparent)`,
          }}
        />
      )

    case 'flourish':
      return (
        <div style={basePos}>
          <svg
            viewBox="0 0 80 30"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: '100%', height: '100%' }}
            preserveAspectRatio="xMidYMid meet"
          >
            <path
              d={element.svgPath ?? 'M0,20 C10,0 30,0 40,20 S60,40 80,20'}
              stroke={element.color}
              strokeWidth={element.strokeWidth ?? 1.2}
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>
      )

    case 'divider': {
      const isDotted = element.style === 'dotted'
      const isOrnamental = element.style === 'ornamental'
      return (
        <div
          style={{
            ...basePos,
            height: isOrnamental ? 2 : 1,
            background: isDotted
              ? `repeating-linear-gradient(90deg, ${element.color} 0px, ${element.color} 3px, transparent 3px, transparent 8px)`
              : isOrnamental
                ? `linear-gradient(90deg, transparent, ${element.color}, transparent)`
                : element.color,
          }}
        />
      )
    }

    case 'gradient-wash':
      return (
        <div
          style={{
            ...basePos,
            backgroundImage: element.gradient,
            mixBlendMode: (element.blendMode ?? 'multiply') as React.CSSProperties['mixBlendMode'],
          }}
        />
      )

    case 'svg-pattern':
      return (
        <div
          style={{
            ...basePos,
            background: `radial-gradient(circle at 50% 80%, ${element.color}22 0%, transparent 70%)`,
          }}
        />
      )

    case 'ornament':
    default:
      return (
        <div
          style={{
            ...basePos,
            borderTop: `1.5px solid ${element.color}`,
            borderLeft: `1.5px solid ${element.color}`,
          }}
        />
      )
  }
}

// ─── Legacy Quote Block ──────────────────────────────────────────────

export function LegacyQuoteBlock({
  text,
  typography,
  decorative,
  palette,
}: {
  text: string
  typography: FamilyTypography
  decorative: FamilyDecorative
  palette: ResolvedSpreadStyle['palette']
}) {
  const showQuoteMarks = decorative.quoteMarks !== 'none'
  const quoteMarkSize = decorative.quoteMarks === 'serif-large' ? 28 : decorative.quoteMarks === 'elegant' ? 22 : 18

  return (
    <div
      className="col-span-2 flex items-center justify-center text-center min-h-[4.5rem] relative"
      style={{ padding: '1.25rem 1.5rem' }}
    >
      {decorative.dividers !== 'none' && (
        <div
          className="absolute top-0 left-[15%] right-[15%]"
          style={{
            height: decorative.dividers === 'ornamental' ? 2 : 1,
            background: decorative.dividers === 'dotted'
              ? `repeating-linear-gradient(90deg, ${palette.border} 0px, ${palette.border} 3px, transparent 3px, transparent 8px)`
              : palette.border,
            opacity: decorative.dividers === 'ornamental' ? 0.5 : 0.3,
          }}
        />
      )}

      <div className="flex flex-col items-center gap-2">
        {showQuoteMarks && (
          <span style={{ color: palette.accent, opacity: 0.35 }}>
            <Icon
              name="format_quote"
              size={quoteMarkSize}
              className="rotate-180"
            />
          </span>
        )}
        <p
          style={{
            fontFamily: typography.quoteFont,
            fontWeight: typography.quoteWeight,
            fontStyle: typography.quoteItalic ? 'italic' : 'normal',
            lineHeight: typography.quoteLineHeight,
            letterSpacing: typography.quoteLetterSpacing,
            textAlign: typography.quoteAlign,
            color: palette.text,
          }}
          className={typography.quoteSizeClass}
        >
          {text}
        </p>
      </div>
    </div>
  )
}

// ─── Legacy Corner Ornaments ─────────────────────────────────────────

export function LegacyCornerOrnaments({ color }: { color: string }) {
  const ornamentStyle = (corner: string): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'absolute',
      width: 24,
      height: 24,
      opacity: 0.18,
    }
    const borderDef = `1.5px solid ${color}`
    switch (corner) {
      case 'tl': return { ...base, top: 8, left: 8, borderTop: borderDef, borderLeft: borderDef }
      case 'tr': return { ...base, top: 8, right: 8, borderTop: borderDef, borderRight: borderDef }
      case 'bl': return { ...base, bottom: 8, left: 8, borderBottom: borderDef, borderLeft: borderDef }
      case 'br': return { ...base, bottom: 8, right: 8, borderBottom: borderDef, borderRight: borderDef }
      default: return base
    }
  }

  return (
    <>
      <div style={ornamentStyle('tl')} />
      <div style={ornamentStyle('tr')} />
      <div style={ornamentStyle('bl')} />
      <div style={ornamentStyle('br')} />
    </>
  )
}

// ═════════════════════════════════════════════════════════════════════
//  MAIN CANVAS
// ═════════════════════════════════════════════════════════════════════

export default function EditorCanvas() {
  const {
    spreads,
    currentSpreadIndex,
    selectedPhotoId,
    selectedTextIndex,
    selectPhoto,
    selectText,
    deselectAll,
    setCurrentSpread,
    swapPhase,
    swapSourceSlotId,
    setSwapSource,
    executeSwap,
    cancelSwapMode,
  } = useEditorStore(useShallow((s) => ({
    spreads: s.spreads,
    currentSpreadIndex: s.currentSpreadIndex,
    selectedPhotoId: s.selectedPhotoId,
    selectedTextIndex: s.selectedTextIndex,
    selectPhoto: s.selectPhoto,
    selectText: s.selectText,
    deselectAll: s.deselectAll,
    setCurrentSpread: s.setCurrentSpread,
    swapPhase: s.swapPhase,
    swapSourceSlotId: s.swapSourceSlotId,
    setSwapSource: s.setSwapSource,
    executeSwap: s.executeSwap,
    cancelSwapMode: s.cancelSwapMode,
  })))

  const spread: EditorSpread | undefined = spreads[currentSpreadIndex] ?? spreads[0]
  const spreadCount = spreads.length
  const canPrev = currentSpreadIndex > 0
  const canNext = currentSpreadIndex < spreadCount - 1

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bookRef = useRef<any>(null)

  const onFlip = useCallback((e: { data: number }) => {
    setCurrentSpread(Math.floor(e.data / 2))
  }, [setCurrentSpread])

  const flipNext = useCallback(() => {
    bookRef.current?.pageFlip()?.flipNext()
  }, [])

  const flipPrev = useCallback(() => {
    bookRef.current?.pageFlip()?.flipPrev()
  }, [])

  const isSwapping = swapPhase !== 'off'

  const handleSlotClickInSwap = useCallback((slotId: string) => {
    if (swapPhase === 'pick-source') {
      setSwapSource(slotId)
    } else if (swapPhase === 'pick-target') {
      executeSwap(slotId)
    }
  }, [swapPhase, setSwapSource, executeSwap])

  if (!spread) return null

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center overflow-hidden relative bg-transparent pr-20 pt-16 pb-4"
      onClick={() => {
        if (isSwapping) cancelSwapMode()
        else deselectAll()
      }}
    >
      {/* ── Swap Mode Banner ────────────────────────────── */}
      <AnimatePresence>
        {isSwapping && (
          <motion.div
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            dir="rtl"
            className="absolute top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl bg-deep-brown/90 backdrop-blur-md shadow-xl shadow-black/10"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Icon
                name={swapPhase === 'pick-source' ? 'touch_app' : 'swap_horiz'}
                size={18}
                className="text-white"
              />
            </span>
            <div className="flex flex-col">
              <span className="text-white text-sm font-bold leading-snug">
                {swapPhase === 'pick-source' ? 'בחרו תמונה להחלפה' : 'בחרו את המיקום המוחלף'}
              </span>
              <span className="text-white/55 text-[10px] font-medium">
                {swapPhase === 'pick-source'
                  ? 'לחצו על תמונה כדי לבחור אותה'
                  : 'לחצו על תמונה או מיקום ריק כדי להחליף'}
              </span>
            </div>
            <button
              onClick={() => cancelSwapMode()}
              className="ms-2 w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <Icon name="close" size={16} className="text-white/80" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        dir="rtl"
        className="flex items-center justify-center gap-2 sm:gap-4 md:gap-5 w-full max-w-[min(94vw,78rem)] mx-auto relative z-10"
      >
        <SpreadNavArrow
          direction="next"
          disabled={!canNext}
          onClick={flipNext}
        />

        <div
          className="relative flex-1 min-w-0 w-full max-w-[min(84vw,68rem)] aspect-[2/1] max-h-[min(68vh,600px)]"
          style={{ transform: 'scaleX(-1)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <HTMLFlipBook
            ref={bookRef}
            width={550}
            height={550}
            size="stretch"
            minWidth={200}
            maxWidth={600}
            minHeight={200}
            maxHeight={600}
            usePortrait={false}
            showCover={false}
            drawShadow={true}
            maxShadowOpacity={0.5}
            flippingTime={1200}
            useMouseEvents={true}
            showPageCorners={true}
            disableFlipByClick={true}
            startPage={0}
            startZIndex={0}
            autoSize={true}
            clickEventForward={true}
            mobileScrollSupport={true}
            swipeDistance={30}
            onFlip={onFlip}
            className="album-flipbook"
            style={{}}
          >
            {spreads.flatMap((s, spreadIdx) => {
              const isCurrent = spreadIdx === currentSpreadIndex
              return [
                <SpreadPage
                  key={`${s.id}-R`}
                  spread={s}
                  side="right"
                  isCurrent={isCurrent}
                  selectedPhotoId={isCurrent ? selectedPhotoId : null}
                  selectedTextIndex={isCurrent ? selectedTextIndex : null}
                  selectPhoto={isCurrent ? selectPhoto : NOOP_SELECT_PHOTO}
                  selectText={isCurrent ? selectText : NOOP_SELECT_TEXT}
                  swapPhase={isCurrent ? swapPhase : 'off'}
                  swapSourceSlotId={isCurrent ? swapSourceSlotId : null}
                  onSwapClick={isCurrent ? handleSlotClickInSwap : NOOP_SLOT}
                />,
                <SpreadPage
                  key={`${s.id}-L`}
                  spread={s}
                  side="left"
                  isCurrent={isCurrent}
                  selectedPhotoId={isCurrent ? selectedPhotoId : null}
                  selectedTextIndex={isCurrent ? selectedTextIndex : null}
                  selectPhoto={isCurrent ? selectPhoto : NOOP_SELECT_PHOTO}
                  selectText={isCurrent ? selectText : NOOP_SELECT_TEXT}
                  swapPhase={isCurrent ? swapPhase : 'off'}
                  swapSourceSlotId={isCurrent ? swapSourceSlotId : null}
                  onSwapClick={isCurrent ? handleSlotClickInSwap : NOOP_SLOT}
                />,
              ]
            })}
          </HTMLFlipBook>

          {/* Spine divider */}
          <div
            className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px pointer-events-none z-30"
            style={{
              background: 'linear-gradient(to bottom, transparent 4%, rgba(0,0,0,0.10) 15%, rgba(0,0,0,0.13) 50%, rgba(0,0,0,0.10) 85%, transparent 96%)',
            }}
          />
          <div
            className="absolute top-0 bottom-0 left-1/2 pointer-events-none z-30"
            style={{
              width: 6,
              transform: 'translateX(-50%)',
              background: 'linear-gradient(to right, rgba(0,0,0,0.03), transparent 35%, transparent 65%, rgba(0,0,0,0.03))',
            }}
          />
        </div>

        <SpreadNavArrow
          direction="prev"
          disabled={!canPrev}
          onClick={flipPrev}
        />
      </div>
    </div>
  )
}
