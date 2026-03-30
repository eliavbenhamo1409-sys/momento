import { useCallback, useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'motion/react'
import { useEditorStore } from '../../store/editorStore'
import { useUIStore } from '../../store/uiStore'
import { useShallow } from 'zustand/react/shallow'
import OverviewSpreadCard, { type DragPayload } from './OverviewSpreadCard'
import Icon from '../shared/Icon'

const OVERLAY_SPRING = { type: 'spring' as const, stiffness: 500, damping: 35, mass: 0.8 }

export default function AlbumOverview() {
  const { spreads, currentSpreadIndex } = useEditorStore(useShallow((s) => ({
    spreads: s.spreads,
    currentSpreadIndex: s.currentSpreadIndex,
  })))
  const toggleOverview = useEditorStore((s) => s.toggleOverview)
  const setCurrentSpread = useEditorStore((s) => s.setCurrentSpread)
  const deleteSpread = useEditorStore((s) => s.deleteSpread)
  const swapPhotosAcrossSpreads = useEditorStore((s) => s.swapPhotosAcrossSpreads)
  const movePhotoToEmptySlot = useEditorStore((s) => s.movePhotoToEmptySlot)
  const addToast = useUIStore((s) => s.addToast)

  // ── Drag state (refs for zero-rerender drag tracking) ──
  const [isDragging, setIsDragging] = useState(false)
  const [dropTarget, setDropTarget] = useState<{ spreadId: string; slotId: string } | null>(null)
  const dragRef = useRef<DragPayload | null>(null)
  const ghostRef = useRef<HTMLDivElement>(null)
  const ghostOffset = useRef({ x: 0, y: 0 })

  const handleDragStart = useCallback((payload: DragPayload, rect: DOMRect) => {
    dragRef.current = payload
    ghostOffset.current = { x: rect.width / 2, y: rect.height / 2 }
    setIsDragging(true)
  }, [])

  const dropTargetRef = useRef<{ spreadId: string; slotId: string } | null>(null)

  useEffect(() => {
    if (!isDragging) return

    function findSlotUnderPointer(x: number, y: number) {
      const elements = document.elementsFromPoint(x, y)
      for (const el of elements) {
        const slotId = (el as HTMLElement).dataset?.slotId
        const spreadId = (el as HTMLElement).dataset?.spreadId
        if (slotId && spreadId) return { spreadId, slotId }
      }
      return null
    }

    const onMove = (e: PointerEvent) => {
      if (ghostRef.current) {
        ghostRef.current.style.transform = `translate(${e.clientX - ghostOffset.current.x}px, ${e.clientY - ghostOffset.current.y}px)`
      }
      const hit = findSlotUnderPointer(e.clientX, e.clientY)
      const prev = dropTargetRef.current
      if (hit?.slotId !== prev?.slotId || hit?.spreadId !== prev?.spreadId) {
        dropTargetRef.current = hit
        setDropTarget(hit)
      }
    }

    const onUp = (e: PointerEvent) => {
      const source = dragRef.current
      const target = findSlotUnderPointer(e.clientX, e.clientY)

      if (source && target && !(source.spreadId === target.spreadId && source.slotId === target.slotId)) {
        const tgtSpread = useEditorStore.getState().spreads.find((s) => s.id === target.spreadId)
        const tgtEl = tgtSpread?.design?.elements.find(
          (el) => el.type === 'photo' && el.slotId === target.slotId,
        )
        const tgtHasPhoto = tgtEl && 'photoUrl' in tgtEl && tgtEl.photoUrl

        if (tgtHasPhoto) {
          swapPhotosAcrossSpreads(source.spreadId, source.slotId, target.spreadId, target.slotId)
          addToast('התמונות הוחלפו בהצלחה', 'success')
        } else {
          movePhotoToEmptySlot(source.spreadId, source.slotId, target.spreadId, target.slotId)
          addToast('התמונה הועברה בהצלחה', 'success')
        }
      }

      dragRef.current = null
      dropTargetRef.current = null
      setIsDragging(false)
      setDropTarget(null)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [isDragging, swapPhotosAcrossSpreads, movePhotoToEmptySlot, addToast])

  const handleJumpToSpread = useCallback((index: number) => {
    setCurrentSpread(index)
    toggleOverview()
  }, [setCurrentSpread, toggleOverview])

  const handleDelete = useCallback((spreadId: string) => {
    if (spreads.length <= 1) {
      addToast('לא ניתן למחוק את העמוד האחרון')
      return
    }
    deleteSpread(spreadId)
    addToast('העמוד נמחק')
  }, [spreads.length, deleteSpread, addToast])

  const handleGenerateBg = useCallback((spreadIndex: number) => {
    setCurrentSpread(spreadIndex)
    toggleOverview()
    setTimeout(() => {
      useEditorStore.setState({ sidebarMode: 'ai' })
    }, 100)
  }, [setCurrentSpread, toggleOverview])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        toggleOverview()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleOverview])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex flex-col"
      dir="rtl"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#EEECEA]/95 backdrop-blur-md"
        onClick={toggleOverview}
      />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...OVERLAY_SPRING, delay: 0.05 }}
        className="relative z-10 flex items-center justify-between px-4 md:px-8 py-3 md:py-4 border-b border-black/[0.04]"
      >
        <div className="flex items-center gap-4">
          <h2
            className="text-xl font-bold text-on-surface"
            style={{ fontFamily: 'var(--font-family-headline)' }}
          >
            מבט על האלבום
          </h2>
          <span className="text-sm text-secondary/50 font-medium">
            {spreads.length} דפים
          </span>
        </div>
        <motion.button
          type="button"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={toggleOverview}
          className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm border border-black/[0.06] hover:bg-white transition-colors"
          aria-label="סגור"
        >
          <Icon name="close" size={20} className="text-secondary/70" />
        </motion.button>
      </motion.header>

      {/* Grid */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 md:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-[90rem] mx-auto">
          {spreads.map((spread, i) => (
            <OverviewSpreadCard
              key={spread.id}
              spread={spread}
              index={i}
              total={spreads.length}
              isCurrent={i === currentSpreadIndex}
              dropTargetSlotId={dropTarget?.slotId ?? null}
              dropTargetSpreadId={dropTarget?.spreadId ?? null}
              onDragStart={handleDragStart}
              onJumpToSpread={handleJumpToSpread}
              onDeleteSpread={handleDelete}
              onGenerateBg={handleGenerateBg}
              entranceDelay={i * 0.04}
            />
          ))}
        </div>
      </div>

      {/* Drag ghost */}
      {isDragging && dragRef.current?.photoUrl && createPortal(
        <div
          ref={ghostRef}
          className="fixed top-0 left-0 z-[999] pointer-events-none"
          style={{ willChange: 'transform' }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0.8 }}
            animate={{ scale: 1.05, opacity: 0.95, rotate: 2 }}
            transition={OVERLAY_SPRING}
            className="w-24 h-20 rounded-lg overflow-hidden shadow-[0_12px_40px_rgba(45,40,35,0.25)] border-2 border-white"
          >
            <img
              src={dragRef.current.photoUrl}
              alt=""
              className="w-full h-full object-cover"
              draggable={false}
            />
          </motion.div>
        </div>,
        document.body,
      )}

      {/* Hint bar */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...OVERLAY_SPRING, delay: 0.2 }}
        className="relative z-10 text-center py-3 text-[11px] text-secondary/40 font-medium border-t border-black/[0.04]"
      >
        גרור תמונות בין עמודים להחלפה · לחץ על עמוד כדי לעבור אליו · Esc לסגירה
      </motion.div>
    </motion.div>
  )
}
