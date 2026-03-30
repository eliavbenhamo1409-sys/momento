import React, { useRef, useMemo, useState, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
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
      <Icon name={direction === 'prev' ? 'chevron_right' : 'chevron_left'} size={22} />
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

// ─── Drag-to-Swap context ─────────────────────────────────────────────

interface DragState {
  sourceSlotId: string
  sourceSpreadId: string
  photoUrl: string
  cursorX: number
  cursorY: number
}

interface DragContext {
  drag: DragState | null
  dropTargetSlotId: string | null
  onDragStart: (slotId: string, spreadId: string, photoUrl: string, x: number, y: number, pointerId: number) => void
  onDragMove: (x: number, y: number) => void
  onDragEnd: () => void
}

const DragCtx = React.createContext<DragContext>({
  drag: null,
  dropTargetSlotId: null,
  onDragStart: () => {},
  onDragMove: () => {},
  onDragEnd: () => {},
})

// ─── Photo Toolbar Portal ─────────────────────────────────────────────

function ToolbarTooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 2 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-lg bg-[#1a1816] text-white text-[10px] font-medium whitespace-nowrap shadow-lg pointer-events-none z-50"
          >
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-[#1a1816]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function PhotoToolbarPortal({
  containerRef,
  zoomPct,
  currentScale,
  slotId,
  photoUrl,
  isMoveMode,
  currentPadding,
  onZoomIn,
  onZoomOut,
  onReset,
  onReplace,
  onDelete,
  onAiResult,
  onToggleMove,
  onSwap,
  onPaddingChange,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>
  zoomPct: number
  currentScale: number
  slotId: string
  photoUrl: string
  isMoveMode: boolean
  currentPadding: number
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
  onReplace: () => void
  onDelete: () => void
  onAiResult: (slotId: string, dataUrl: string) => void
  onToggleMove: () => void
  onSwap: () => void
  onPaddingChange: (padding: number) => void
}) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const [aiOpen, setAiOpen] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiProgress, setAiProgress] = useState(0)
  const [aiError, setAiError] = useState('')
  const [showPadding, setShowPadding] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let rafId: number
    const update = () => {
      const el = containerRef.current
      if (!el) { rafId = requestAnimationFrame(update); return }
      const rect = el.getBoundingClientRect()
      setPos((prev) => {
        if (prev && Math.abs(prev.x - (rect.left + rect.width / 2)) < 0.5 && Math.abs(prev.y - (rect.top - 8)) < 0.5) return prev
        return { x: rect.left + rect.width / 2, y: rect.top - 8 }
      })
      rafId = requestAnimationFrame(update)
    }
    rafId = requestAnimationFrame(update)
    return () => cancelAnimationFrame(rafId)
  }, [containerRef, slotId])

  useEffect(() => {
    if (aiOpen) setTimeout(() => inputRef.current?.focus(), 100)
  }, [aiOpen])

  const aiStartTimeRef = useRef(0)
  const aiProgressTimerRef = useRef<ReturnType<typeof setInterval>>(undefined)

  useEffect(() => {
    if (aiLoading) {
      aiStartTimeRef.current = Date.now()
      const DURATION = 16000
      aiProgressTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - aiStartTimeRef.current
        const pct = Math.min(Math.round((elapsed / DURATION) * 95), 95)
        setAiProgress(pct)
      }, 200)
    } else {
      clearInterval(aiProgressTimerRef.current)
    }
    return () => clearInterval(aiProgressTimerRef.current)
  }, [aiLoading])

  const handleAiSubmit = useCallback(async () => {
    if (!aiPrompt.trim() || aiLoading) return
    setAiLoading(true)
    setAiError('')
    setAiProgress(0)

    try {
      const { editPhotoWithAI } = await import('../../lib/openai')

      let dataUrl: string | null = null
      if (photoUrl.startsWith('data:')) {
        dataUrl = photoUrl
      } else {
        try {
          const resp = await fetch(photoUrl)
          const blob = await resp.blob()
          dataUrl = await new Promise<string | null>((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.onerror = () => resolve(null)
            reader.readAsDataURL(blob)
          })
        } catch {
          const img = containerRef.current?.querySelector('img')
          if (img) {
            try {
              const canvas = document.createElement('canvas')
              canvas.width = img.naturalWidth || 800
              canvas.height = img.naturalHeight || 800
              const ctx = canvas.getContext('2d')
              if (ctx) { ctx.drawImage(img, 0, 0); dataUrl = canvas.toDataURL('image/jpeg', 0.9) }
            } catch { /* tainted canvas */ }
          }
        }
      }

      if (!dataUrl) {
        setAiError('לא ניתן לטעון את התמונה')
        setAiLoading(false)
        setAiProgress(0)
        return
      }

      const result = await editPhotoWithAI(aiPrompt, dataUrl)
      setAiProgress(100)

      if (result) {
        onAiResult(slotId, result)
        setAiPrompt('')
        setAiOpen(false)
      } else {
        setAiError('העריכה נכשלה, נסה שוב')
      }
    } catch (err) {
      console.error('AI edit failed:', err)
      setAiError('שגיאה בעריכת AI')
    } finally {
      setAiLoading(false)
      setTimeout(() => setAiProgress(0), 500)
    }
  }, [aiPrompt, aiLoading, photoUrl, slotId, onAiResult, containerRef])

  if (!pos) return null

  return createPortal(
    <div
      className="fixed z-[9999] pointer-events-auto"
      style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -100%)' }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* AI prompt panel */}
      <AnimatePresence>
        {aiOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2 }}
            className="mb-2 flex flex-col gap-1.5"
          >
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-[#1a1816]/95 backdrop-blur-md shadow-xl shadow-black/15 min-w-[280px]">
              <Icon name="auto_fix_high" size={16} className="text-amber-300 shrink-0" />
              <input
                ref={inputRef}
                dir="rtl"
                type="text"
                value={aiPrompt}
                onChange={(e) => { setAiPrompt(e.target.value); setAiError('') }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAiSubmit(); if (e.key === 'Escape') setAiOpen(false) }}
                placeholder="תאר מה לשנות בתמונה..."
                disabled={aiLoading}
                className="flex-1 bg-white/10 text-white text-xs rounded-lg px-2.5 py-1.5 placeholder:text-white/40 outline-none focus:ring-1 focus:ring-white/30 disabled:opacity-50"
              />
              <button
                onClick={handleAiSubmit}
                disabled={!aiPrompt.trim() || aiLoading}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-amber-300 hover:bg-white/15 active:scale-90 transition-all disabled:opacity-30 shrink-0 relative"
              >
                {aiLoading ? (
                  <div className="relative w-7 h-7 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-amber-300/30 border-t-amber-300 rounded-full animate-spin" />
                    <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold text-amber-300 tabular-nums">{aiProgress}</span>
                  </div>
                ) : (
                  <Icon name="send" size={16} />
                )}
              </button>
            </div>
            {aiError && (
              <div dir="rtl" className="px-3 py-1.5 rounded-lg bg-red-500/80 text-white text-[11px] font-medium text-center backdrop-blur-sm">
                {aiError}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Padding control */}
      <AnimatePresence>
        {showPadding && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2 }}
            className="mb-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1a1816]/95 backdrop-blur-md shadow-xl shadow-black/15"
            dir="rtl"
          >
            <Icon name="padding" size={14} className="text-white/60 shrink-0" />
            <input
              type="range"
              min={0}
              max={20}
              step={1}
              value={currentPadding}
              onChange={(e) => onPaddingChange(Number(e.target.value))}
              className="flex-1 h-1 appearance-none bg-white/20 rounded-full accent-white cursor-pointer [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-md"
            />
            <span className="text-[10px] text-white/60 font-bold tabular-nums w-5 text-center">{currentPadding}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-[#1a1816]/95 backdrop-blur-md shadow-xl shadow-black/15">
        <ToolbarTooltip text="הקטן">
          <button
            onClick={onZoomOut}
            disabled={currentScale <= 1}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/80 hover:bg-white/15 active:scale-90 transition-all disabled:opacity-30"
          >
            <Icon name="remove" size={16} />
          </button>
        </ToolbarTooltip>
        <span className="text-[10px] text-white/70 font-bold tabular-nums w-8 text-center select-none">{zoomPct}%</span>
        <ToolbarTooltip text="הגדל">
          <button
            onClick={onZoomIn}
            disabled={currentScale >= 3}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/80 hover:bg-white/15 active:scale-90 transition-all disabled:opacity-30"
          >
            <Icon name="add" size={16} />
          </button>
        </ToolbarTooltip>

        <div className="w-px h-4 bg-white/20 mx-0.5" />

        <ToolbarTooltip text="הזז במרחב">
          <button
            onClick={onToggleMove}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90 ${isMoveMode ? 'bg-sky-500/30 text-sky-300' : 'text-white/80 hover:bg-white/15'}`}
          >
            <Icon name="open_with" size={16} />
          </button>
        </ToolbarTooltip>

        <ToolbarTooltip text="שוליים">
          <button
            onClick={() => setShowPadding((v) => !v)}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90 ${showPadding ? 'bg-violet-500/30 text-violet-300' : 'text-white/80 hover:bg-white/15'}`}
          >
            <Icon name="padding" size={16} />
          </button>
        </ToolbarTooltip>

        <ToolbarTooltip text="אפס מיקום">
          <button
            onClick={onReset}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/80 hover:bg-white/15 active:scale-90 transition-all"
          >
            <Icon name="center_focus_strong" size={16} />
          </button>
        </ToolbarTooltip>

        <div className="w-px h-4 bg-white/20 mx-0.5" />

        <ToolbarTooltip text="עריכת AI">
          <button
            onClick={() => { setAiOpen(!aiOpen); setAiError(''); setShowPadding(false) }}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90 ${aiOpen ? 'bg-amber-500/30 text-amber-300' : 'text-white/80 hover:bg-white/15'}`}
          >
            <Icon name="auto_fix_high" size={16} />
          </button>
        </ToolbarTooltip>

        <div className="w-px h-4 bg-white/20 mx-0.5" />

        <ToolbarTooltip text="החלף עם תמונה אחרת">
          <button
            onClick={onSwap}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/80 hover:bg-white/15 active:scale-90 transition-all"
          >
            <Icon name="swap_horiz" size={16} />
          </button>
        </ToolbarTooltip>

        <ToolbarTooltip text="החלף תמונה">
          <button
            onClick={onReplace}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/80 hover:bg-white/15 active:scale-90 transition-all"
          >
            <Icon name="image" size={16} />
          </button>
        </ToolbarTooltip>

        <ToolbarTooltip text="הסר תמונה">
          <button
            onClick={onDelete}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-red-300 hover:bg-red-500/20 active:scale-90 transition-all"
          >
            <Icon name="delete" size={16} />
          </button>
        </ToolbarTooltip>
      </div>
    </div>,
    document.body,
  )
}

// ─── Resize Handle (pointer-captured) ───────────────────────────────
// Direct DOM manipulation during drag for 60 fps smoothness,
// commits final rect to the store on pointer-up.

const MIN_SIZE_PCT = 4

function ResizeHandle({
  corner,
  containerRef,
  slotId,
  element,
  setRect,
}: {
  corner: 'nw' | 'ne' | 'sw' | 'se'
  containerRef: React.RefObject<HTMLDivElement | null>
  slotId: string
  element: { x: number; y: number; width: number; height: number }
  setRect: (slotId: string, rect: { x: number; y: number; width: number; height: number }) => void
}) {
  const elRef = useRef<HTMLDivElement>(null)
  const setRectRef = useRef(setRect)
  setRectRef.current = setRect

  const cls =
    corner === 'nw' ? 'top-0 left-0 -translate-x-1/2 -translate-y-1/2 cursor-nw-resize' :
    corner === 'ne' ? 'top-0 right-0 translate-x-1/2 -translate-y-1/2 cursor-ne-resize' :
    corner === 'sw' ? 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-sw-resize' :
    'bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-se-resize'

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const el = elRef.current
    const target = containerRef.current
    if (!el || !target) return
    el.setPointerCapture(e.pointerId)

    const startX = e.clientX
    const startY = e.clientY
    const parentEl = target.parentElement
    if (!parentEl) return
    const parentRect = parentEl.getBoundingClientRect()
    const parentW = parentRect.width || 1
    const parentH = parentRect.height || 1

    const initX = element.x
    const initY = element.y
    const initW = element.width
    const initH = element.height

    // Anchor = opposite corner (stays fixed)
    const anchorX = corner.includes('w') ? initX + initW : initX
    const anchorY = corner.includes('n') ? initY + initH : initY

    // Dragged corner's initial position in %
    const cornerX0 = corner.includes('e') ? initX + initW : initX
    const cornerY0 = corner.includes('s') ? initY + initH : initY

    let rafId = 0
    let pendingEv: PointerEvent | null = null
    let lastRect = { x: initX, y: initY, width: initW, height: initH }

    const flush = () => {
      rafId = 0
      const ev = pendingEv
      if (!ev) return
      pendingEv = null

      const dxPct = ((ev.clientX - startX) / parentW) * 100
      const dyPct = ((ev.clientY - startY) / parentH) * 100

      // New dragged-corner position tracks the cursor 1:1
      const cx = cornerX0 + dxPct
      const cy = cornerY0 + dyPct

      let newW = Math.abs(cx - anchorX)
      let newH = Math.abs(cy - anchorY)
      if (newW < MIN_SIZE_PCT) newW = MIN_SIZE_PCT
      if (newH < MIN_SIZE_PCT) newH = MIN_SIZE_PCT

      const newX = cx < anchorX ? anchorX - newW : anchorX
      const newY = cy < anchorY ? anchorY - newH : anchorY

      lastRect = { x: newX, y: newY, width: newW, height: newH }

      // Direct DOM write — bypasses React for zero-latency visual feedback
      target.style.left = `${newX}%`
      target.style.top = `${newY}%`
      target.style.width = `${newW}%`
      target.style.height = `${newH}%`
    }

    const onMove = (ev: PointerEvent) => {
      pendingEv = ev
      if (!rafId) rafId = requestAnimationFrame(flush)
    }

    const onUp = (ev: PointerEvent) => {
      ev.stopPropagation()
      if (rafId) cancelAnimationFrame(rafId)
      // Apply any pending move
      if (pendingEv) { pendingEv = ev; flush() }
      el.releasePointerCapture(ev.pointerId)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      // Commit final rect to store so React takes over
      setRectRef.current(slotId, lastRect)
    }

    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
  }, [corner, slotId, containerRef, element.x, element.y, element.width, element.height])

  return (
    <div
      ref={elRef}
      className={`absolute w-3 h-3 rounded-full bg-white border-2 border-primary shadow-sm z-40 pointer-events-auto ${cls}`}
      onPointerDown={handlePointerDown}
    />
  )
}

// ─── Move Overlay (pointer-captured) ────────────────────────────────

function MoveOverlay({
  containerRef,
  slotId,
  moveSlot,
  onSelect,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>
  slotId: string
  moveSlot: (slotId: string, delta: { x?: number; y?: number }) => void
  onSelect: () => void
}) {
  const elRef = useRef<HTMLDivElement>(null)
  const moveRef = useRef(moveSlot)
  const selectRef = useRef(onSelect)
  moveRef.current = moveSlot
  selectRef.current = onSelect

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const el = elRef.current
    if (!el) return
    el.setPointerCapture(e.pointerId)

    let lastX = e.clientX
    let lastY = e.clientY
    const startX = e.clientX
    const startY = e.clientY
    let didMove = false
    const parentRect = containerRef.current?.parentElement?.getBoundingClientRect()
    const parentW = parentRect?.width ?? 1
    const parentH = parentRect?.height ?? 1

    const onMove = (ev: PointerEvent) => {
      if (!didMove && Math.abs(ev.clientX - startX) < 4 && Math.abs(ev.clientY - startY) < 4) return
      didMove = true
      const dx = ((ev.clientX - lastX) / parentW) * 100
      const dy = ((ev.clientY - lastY) / parentH) * 100
      lastX = ev.clientX
      lastY = ev.clientY
      moveRef.current(slotId, { x: dx, y: dy })
    }
    const onUp = (ev: PointerEvent) => {
      ev.stopPropagation()
      el.releasePointerCapture(ev.pointerId)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      if (!didMove) selectRef.current()
    }
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
  }, [slotId, containerRef])

  return (
    <div
      ref={elRef}
      className="absolute inset-0 z-[35] cursor-move"
      onPointerDown={handlePointerDown}
    />
  )
}

// ─── Absolute-Positioned Photo Element ───────────────────────────────

export function AbsolutePhotoElement({
  element,
  spreadId = '',
  elementIndex,
  isSelected,
  isSwapping = false,
  onSelect,
}: {
  element: PhotoElement
  spreadId?: string
  elementIndex: number
  isSelected: boolean
  isSwapping?: boolean
  onSelect: () => void
}) {
  const updatePos = useEditorStore((s) => s.updatePhotoObjectPosition)
  const updateScale = useEditorStore((s) => s.updatePhotoScale)
  const replaceInSlot = useEditorStore((s) => s.replacePhotoInSlot)
  const removeSlot = useEditorStore((s) => s.removePhotoSlot)
  const clearPhoto = useEditorStore((s) => s.removePhotoFromSlot)
  const moveSlot = useEditorStore((s) => s.movePhotoSlot)
  const setRect = useEditorStore((s) => s.setPhotoSlotRect)
  const setPhotoUrl = useEditorStore((s) => s.setPhotoSlotUrl)
  const [showZoom, setShowZoom] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [trackedUrl, setTrackedUrl] = useState(element.photoUrl)

  if (trackedUrl !== element.photoUrl) {
    setTrackedUrl(element.photoUrl)
    setImgLoaded(false)
  }

  const { drag, dropTargetSlotId } = React.useContext(DragCtx)
  const isDragSource = drag?.sourceSlotId === element.slotId
  const isDropTarget = dropTargetSlotId === element.slotId && !isDragSource

  const zoomHideTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const emptyFileRef = useRef<HTMLInputElement>(null)
  const replaceFileRef = useRef<HTMLInputElement>(null)

  const currentScale = element.scale ?? 1
  const [isMoveMode, setIsMoveMode] = useState(false)

  useEffect(() => { if (!isSelected) setIsMoveMode(false) }, [isSelected])

  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  const updatePosRef = useRef(updatePos)
  updatePosRef.current = updatePos

  // Pointer-down → select on click, pan image on drag.
  // Uses native listeners + setPointerCapture so the drag keeps
  // working even after React re-renders inject the selection UI.
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!element.photoUrl || isSwapping) return
    e.stopPropagation()
    e.preventDefault()

    const container = containerRef.current
    if (!container) return
    container.setPointerCapture(e.pointerId)

    const startX = e.clientX
    const startY = e.clientY
    let lastX = startX
    let lastY = startY
    let didMove = false

    const containerRect = container.getBoundingClientRect()
    const cW = containerRect.width || 1
    const cH = containerRect.height || 1

    const [posXStr, posYStr] = (element.objectPosition || '50% 50%').split(' ')
    let posX = parseFloat(posXStr) || 50
    let posY = parseFloat(posYStr) || 50
    const effScale = Math.max(1.12, element.scale ?? 1)
    let rafId = 0
    const imgEl = container.querySelector('img') as HTMLImageElement | null

    const applyToDOM = () => {
      if (imgEl) {
        const val = `${posX.toFixed(1)}% ${posY.toFixed(1)}%`
        imgEl.style.objectPosition = val
        imgEl.style.transformOrigin = val
      }
    }

    const flush = () => { rafId = 0; applyToDOM() }

    const onMove = (ev: PointerEvent) => {
      if (!didMove) {
        if (Math.abs(ev.clientX - startX) < 4 && Math.abs(ev.clientY - startY) < 4) return
        didMove = true
        if (!isSelected) onSelectRef.current()
      }
      const dx = ev.clientX - lastX
      const dy = ev.clientY - lastY
      lastX = ev.clientX
      lastY = ev.clientY

      const sens = effScale * 0.9
      posX = Math.max(0, Math.min(100, posX - (dx / cW) * 100 * sens))
      posY = Math.max(0, Math.min(100, posY - (dy / cH) * 100 * sens))
      if (!rafId) rafId = requestAnimationFrame(flush)
    }

    const cleanup = () => {
      if (rafId) cancelAnimationFrame(rafId)
      try { container.releasePointerCapture(e.pointerId) } catch { /* already released */ }
      container.removeEventListener('pointermove', onMove)
      container.removeEventListener('pointerup', onUp)
      container.removeEventListener('pointercancel', cleanup)
    }

    const onUp = (ev: PointerEvent) => {
      ev.stopPropagation()
      cleanup()
      if (didMove) {
        applyToDOM()
        updatePosRef.current(element.slotId, `${posX.toFixed(1)}% ${posY.toFixed(1)}%`)
      } else {
        onSelectRef.current()
      }
    }

    container.addEventListener('pointermove', onMove)
    container.addEventListener('pointerup', onUp)
    container.addEventListener('pointercancel', cleanup)
  }, [element.photoUrl, element.slotId, element.objectPosition, element.scale, isSelected, isSwapping])

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
    return () => clearTimeout(zoomHideTimer.current)
  }, [])

  const positionStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${element.x}%`,
    top: `${element.y}%`,
    width: `${element.width}%`,
    height: `${element.height}%`,
    zIndex: isDragSource ? 50 : element.zIndex,
    borderWidth: element.borderWidth > 0 && !element.clipPath ? element.borderWidth : undefined,
    borderColor: element.borderWidth > 0 && !element.clipPath ? element.borderColor : undefined,
    borderStyle: element.borderWidth > 0 && !element.clipPath ? 'solid' : undefined,
    borderRadius: element.clipPath ? undefined : element.borderRadius,
    boxShadow: element.shadow || undefined,
    padding: element.padding > 0 && !element.clipPath ? element.padding : undefined,
    backgroundColor: element.padding > 0 && !element.clipPath ? '#FFFFFF' : undefined,
    transform: element.rotation !== 0 ? `rotate(${element.rotation.toFixed(1)}deg)` : undefined,
    overflow: isSelected ? 'visible' : 'hidden',
    clipPath: isSelected ? undefined : (element.clipPath || undefined),
    WebkitClipPath: isSelected ? undefined : (element.clipPath || undefined),
    cursor: isDragSource ? 'grabbing' : (isSelected && !isMoveMode ? 'grab' : 'pointer'),
    touchAction: 'none',
  }

  const zoomPct = Math.round(currentScale * 100)

  const ringClass = isDropTarget
    ? 'ring-[3px] ring-sage ring-offset-[3px] ring-offset-white shadow-[0_0_0_1px_rgba(96,92,72,0.15),0_8px_24px_-4px_rgba(96,92,72,0.25)]'
    : isSelected
      ? 'ring-[2.5px] ring-primary ring-offset-[3px] ring-offset-white shadow-[0_0_0_1px_rgba(96,92,72,0.08),0_8px_24px_-4px_rgba(96,92,72,0.18)]'
      : isDragSource
        ? 'ring-2 ring-sage/40'
        : ''

  return (
    <motion.div
      ref={containerRef}
      data-slot-id={element.slotId}
      data-spread-id={spreadId}
      data-has-photo={element.photoUrl ? 'true' : 'false'}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      whileHover={!isDragSource && !drag ? { scale: isSelected ? 1 : 1.008 } : undefined}
      className={`group ${ringClass} transition-shadow duration-150`}
      style={{
        ...positionStyle,
        opacity: isDragSource ? 0.4 : 1,
      }}
      onPointerDown={handlePointerDown}
      onWheel={handleWheel}
    >
      <div
        className="w-full h-full overflow-hidden"
        style={{
          borderRadius: element.borderRadius > 8
            ? Math.max(4, element.borderRadius * 0.6)
            : Math.max(0, element.borderRadius - element.padding),
          clipPath: isSelected ? (element.clipPath || undefined) : undefined,
          WebkitClipPath: isSelected ? (element.clipPath || undefined) : undefined,
        }}
      >
        {element.photoUrl ? (
          <>
            {!imgLoaded && (
              <div
                className="absolute inset-0 skeleton-shimmer"
                style={{
                  background: 'linear-gradient(90deg, var(--color-surface-container) 25%, var(--color-surface-container-low) 50%, var(--color-surface-container) 75%)',
                  backgroundSize: '200% 100%',
                  borderRadius: 'inherit',
                }}
              />
            )}
            <img
              ref={imgRef}
              src={element.photoUrl}
              alt=""
              className="w-full h-full object-cover select-none"
              draggable={false}
              style={{
                objectPosition: element.objectPosition || '50% 50%',
                objectFit: element.objectFit,
                transformOrigin: element.objectPosition || '50% 50%',
                transform: `scale(${Math.max(1.12, currentScale)})`,
              }}
              onLoad={() => setImgLoaded(true)}
            />
          </>
        ) : (
          <div
            className="group/slot relative w-full h-full bg-surface-container-low/40 border-2 border-dashed border-outline-variant/30 rounded-lg flex flex-col items-center justify-center gap-2.5 cursor-pointer hover:bg-primary/[0.04] hover:border-primary/25 transition-all duration-200"
            data-slot-id={element.slotId}
            data-spread-id={spreadId}
            data-has-photo="false"
            onClick={(e) => { e.stopPropagation(); if (!drag) emptyFileRef.current?.click() }}
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
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/[0.07]">
              <Icon name="add_photo_alternate" size={22} className="text-primary/40" />
            </div>
            <span className="text-[11px] font-semibold text-secondary/50">הוסף תמונה</span>
            {elementIndex >= 0 && (
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

      {/* Drop target highlight */}
      {isDropTarget && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="bg-sage/80 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
            <Icon name="swap_horiz" size={15} className="text-white" />
            <span className="text-white text-xs font-bold">{element.photoUrl ? 'החלף' : 'העבר לכאן'}</span>
          </div>
        </div>
      )}

      {/* Zoom indicator */}
      {showZoom && element.photoUrl && !drag && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="bg-black/55 backdrop-blur-sm px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
            <Icon name={currentScale > 1 ? 'zoom_in' : 'zoom_out'} size={15} className="text-white/90" />
            <span className="text-white text-xs font-bold tabular-nums">{zoomPct}%</span>
          </div>
        </div>
      )}

      {!isSelected && !isDragSource && !showZoom && !drag && element.photoUrl && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-3">
          <span className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-primary font-medium text-xs flex items-center gap-1.5 shadow-sm">
            <Icon name="touch_app" size={14} />
            עריכה
          </span>
        </div>
      )}

      {/* ── Inline floating toolbar (portal) when selected ── */}
      {isSelected && element.photoUrl && !isDragSource && !showZoom && !drag && (
        <>
          <PhotoToolbarPortal
            containerRef={containerRef}
            zoomPct={zoomPct}
            currentScale={currentScale}
            slotId={element.slotId}
            photoUrl={element.photoUrl!}
            isMoveMode={isMoveMode}
            currentPadding={element.padding}
            onZoomIn={() => updateScale(element.slotId, Math.min(3, currentScale + 0.15))}
            onZoomOut={() => updateScale(element.slotId, Math.max(1, currentScale - 0.15))}
            onReset={() => { updatePos(element.slotId, '50% 50%'); updateScale(element.slotId, 1) }}
            onReplace={() => replaceFileRef.current?.click()}
            onDelete={() => clearPhoto(element.slotId)}
            onAiResult={(sid, dataUrl) => setPhotoUrl(sid, dataUrl)}
            onToggleMove={() => setIsMoveMode((v) => !v)}
            onSwap={() => {
              const { enterSwapMode } = useEditorStore.getState()
              enterSwapMode()
            }}
            onPaddingChange={(p) => {
              const { updatePhotoPadding } = useEditorStore.getState()
              updatePhotoPadding(element.slotId, p)
            }}
          />

          {/* Hidden file input for replace */}
          <input
            ref={replaceFileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) replaceInSlot(element.slotId, f)
              e.target.value = ''
            }}
          />

          {/* Resize handles */}
          {(['nw', 'ne', 'sw', 'se'] as const).map((corner) => (
            <ResizeHandle
              key={corner}
              corner={corner}
              containerRef={containerRef}
              slotId={element.slotId}
              element={element}
              setRect={setRect}
            />
          ))}

          {/* Move overlay — only active when move-mode button is toggled */}
          {isMoveMode && (
            <MoveOverlay
              containerRef={containerRef}
              slotId={element.slotId}
              moveSlot={moveSlot}
              onSelect={onSelect}
            />
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

  const localQuotePosRef = useRef<{ x: number; y: number; w?: number; h?: number } | null>(null)

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
      localQuotePosRef.current = { x: newX, y: newY }
      if (containerRef.current) {
        containerRef.current.style.left = `${newX}%`
        containerRef.current.style.top = `${newY}%`
      }
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

      localQuotePosRef.current = { x: newX, y: newY, w: newW, h: newH }
      if (containerRef.current) {
        containerRef.current.style.left = `${newX}%`
        containerRef.current.style.top = `${newY}%`
        containerRef.current.style.width = `${newW}%`
        containerRef.current.style.height = `${newH}%`
      }
    }
  }, [isDragging, isResizing])

  const handlePointerUp = useCallback(() => {
    if (localQuotePosRef.current) {
      const pos = localQuotePosRef.current
      updateText(elementIndex, {
        x: pos.x,
        y: pos.y,
        ...(pos.w != null ? { width: pos.w } : {}),
        ...(pos.h != null ? { height: pos.h } : {}),
      })
      localQuotePosRef.current = null
    }
    setIsDragging(false)
    setIsResizing(false)
    startRef.current = null
  }, [updateText, elementIndex])

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
    deselectAll,
    setCurrentSpread,
    swapPhase,
    cancelSwapMode,
    swapPhotosAcrossSpreads,
    movePhotoToEmptySlot,
  } = useEditorStore(useShallow((s) => ({
    spreads: s.spreads,
    currentSpreadIndex: s.currentSpreadIndex,
    deselectAll: s.deselectAll,
    setCurrentSpread: s.setCurrentSpread,
    swapPhase: s.swapPhase,
    cancelSwapMode: s.cancelSwapMode,
    swapPhotosAcrossSpreads: s.swapPhotosAcrossSpreads,
    movePhotoToEmptySlot: s.movePhotoToEmptySlot,
  })))

  const spread: EditorSpread | undefined = spreads[currentSpreadIndex] ?? spreads[0]
  const spreadCount = spreads.length
  const canPrev = currentSpreadIndex > 0
  const canNext = currentSpreadIndex < spreadCount - 1

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bookRef = useRef<any>(null)
  const initialPageRef = useRef(currentSpreadIndex * 2)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // ── Drag-to-swap state ──
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [dropTargetSlotId, setDropTargetSlotId] = useState<string | null>(null)
  const dragPointerIdRef = useRef<number | null>(null)

  const handleDragStart = useCallback((slotId: string, spreadId: string, photoUrl: string, x: number, y: number, pointerId: number) => {
    setDragState({ sourceSlotId: slotId, sourceSpreadId: spreadId, photoUrl, cursorX: x, cursorY: y })
    dragPointerIdRef.current = pointerId
    deselectAll()
  }, [deselectAll])

  const handleDragMove = useCallback((x: number, y: number) => {
    setDragState((prev) => prev ? { ...prev, cursorX: x, cursorY: y } : null)
    const els = document.elementsFromPoint(x, y)
    let foundSlot: string | null = null
    for (const el of els) {
      const slotId = (el as HTMLElement).dataset?.slotId
      if (slotId && slotId !== dragState?.sourceSlotId) {
        foundSlot = slotId
        break
      }
    }
    setDropTargetSlotId(foundSlot)
  }, [dragState?.sourceSlotId])

  const handleDragEnd = useCallback(() => {
    if (dragState && dropTargetSlotId) {
      const currentSpread = spreads[currentSpreadIndex]
      if (currentSpread?.design) {
        const tgtEl = currentSpread.design.elements.find(
          (el) => el.type === 'photo' && el.slotId === dropTargetSlotId,
        ) as PhotoElement | undefined
        const srcSpreadId = dragState.sourceSpreadId
        const srcSlotId = dragState.sourceSlotId
        if (tgtEl?.photoUrl) {
          swapPhotosAcrossSpreads(srcSpreadId, srcSlotId, currentSpread.id, dropTargetSlotId)
        } else {
          movePhotoToEmptySlot(srcSpreadId, srcSlotId, currentSpread.id, dropTargetSlotId)
        }
      }
    }
    setDragState(null)
    setDropTargetSlotId(null)
    dragPointerIdRef.current = null
  }, [dragState, dropTargetSlotId, spreads, currentSpreadIndex, swapPhotosAcrossSpreads, movePhotoToEmptySlot])

  const dragCtxValue = useMemo<DragContext>(() => ({
    drag: dragState,
    dropTargetSlotId,
    onDragStart: handleDragStart,
    onDragMove: handleDragMove,
    onDragEnd: handleDragEnd,
  }), [dragState, dropTargetSlotId, handleDragStart, handleDragMove, handleDragEnd])
  const prevSpreadIdRef = useRef(spread?.id)
  const prevTemplateRef = useRef(spread?.templateId)

  useEffect(() => {
    const sameSpread = prevSpreadIdRef.current === spread?.id
    const templateChanged = prevTemplateRef.current !== spread?.templateId
    prevSpreadIdRef.current = spread?.id
    prevTemplateRef.current = spread?.templateId
    if (sameSpread && templateChanged) {
      setIsTransitioning(true)
      const timer = setTimeout(() => setIsTransitioning(false), 250)
      return () => clearTimeout(timer)
    }
  }, [spread?.id, spread?.templateId])

  const onFlip = useCallback((e: { data: number }) => {
    // Defer state update to next frame so React DOM changes (selection ring
    // removal, overflow toggles) happen AFTER page-flip's drawFrame has hidden
    // the old pages. Changing React state during the same rAF as the flip
    // completion causes GPU compositor artifacts on the rotating page.
    requestAnimationFrame(() => {
      setCurrentSpread(Math.floor(e.data / 2))
    })
  }, [setCurrentSpread])

  const flipNext = useCallback(() => {
    deselectAll()
    requestAnimationFrame(() => {
      bookRef.current?.pageFlip()?.flipNext()
    })
  }, [deselectAll])

  const flipPrev = useCallback(() => {
    deselectAll()
    requestAnimationFrame(() => {
      bookRef.current?.pageFlip()?.flipPrev()
    })
  }, [deselectAll])

  const isSwapping = swapPhase !== 'off'

  const flipBookStyle = useMemo(() => ({}), [])
  const flipPages = useMemo(() => spreads.flatMap((s, spreadIdx) => [
    <SpreadPage key={`${s.id}-R`} spread={s} side="right" spreadIndex={spreadIdx} />,
    <SpreadPage key={`${s.id}-L`} spread={s} side="left" spreadIndex={spreadIdx} />,
  ]), [spreads])

  if (!spread) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-9 h-9 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        <span className="text-xs text-secondary/50 font-medium">טוען עמוד...</span>
      </div>
    </div>
  )

  return (
    <DragCtx.Provider value={dragCtxValue}>
    <div
      className="flex-1 flex flex-col items-center justify-center overflow-hidden relative bg-transparent pr-4 md:pr-20 pt-4 md:pt-16 pb-4"
      onClick={() => {
        if (isSwapping) cancelSwapMode()
        else if (!dragState) deselectAll()
      }}
      onPointerMove={dragState ? (e) => handleDragMove(e.clientX, e.clientY) : undefined}
      onPointerUp={dragState ? () => handleDragEnd() : undefined}
    >
      {/* Drag ghost */}
      {dragState && createPortal(
        <div
          className="fixed pointer-events-none z-[9999]"
          style={{
            left: dragState.cursorX - 40,
            top: dragState.cursorY - 40,
            width: 80,
            height: 80,
          }}
        >
          <div className="w-full h-full rounded-xl overflow-hidden shadow-2xl ring-2 ring-sage/50 opacity-90">
            <img src={dragState.photoUrl} alt="" className="w-full h-full object-cover" draggable={false} />
          </div>
        </div>,
        document.body,
      )}

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
          direction="prev"
          disabled={!canPrev}
          onClick={flipPrev}
        />

        <div
          className="relative flex-1 min-w-0 w-full max-w-[min(84vw,68rem)] aspect-[2/1] max-h-[min(75vh,600px)] md:max-h-[min(68vh,600px)]"
          style={{
            transform: 'scaleX(-1)',
            opacity: isTransitioning ? 0.5 : 1,
            transition: 'opacity 0.2s ease-out',
          }}
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
            drawShadow={false}
            maxShadowOpacity={0}
            flippingTime={1200}
            useMouseEvents={false}
            showPageCorners={false}
            disableFlipByClick={true}
            startPage={initialPageRef.current}
            startZIndex={0}
            autoSize={true}
            clickEventForward={true}
            mobileScrollSupport={true}
            swipeDistance={30}
            onFlip={onFlip}
            className="album-flipbook"
            style={flipBookStyle}
          >
            {flipPages}
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
          direction="next"
          disabled={!canNext}
          onClick={flipNext}
        />
      </div>
    </div>
    </DragCtx.Provider>
  )
}
