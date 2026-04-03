import { useCallback, useRef, useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useEditorStore } from '../../store/editorStore'
import { useAlbumStore } from '../../store/albumStore'
import { useUIStore } from '../../store/uiStore'
import { useShallow } from 'zustand/react/shallow'
import OverviewSpreadCard, { type HoveredPhoto } from './OverviewSpreadCard'
import OverviewSidebar from './OverviewSidebar'
import Icon from '../shared/Icon'

const OVERLAY_SPRING = { type: 'spring' as const, stiffness: 500, damping: 35, mass: 0.8 }

function LazyCard({ children, index }: { children: React.ReactNode; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(index < 8)

  useEffect(() => {
    if (visible || !ref.current) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { rootMargin: '200px' },
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [visible])

  if (!visible) {
    return <div ref={ref} style={{ aspectRatio: '2 / 1' }} className="rounded-xl bg-black/[0.02]" />
  }

  return <>{children}</>
}

export default function AlbumOverview() {
  const { spreads, currentSpreadIndex } = useEditorStore(useShallow((s) => ({
    spreads: s.spreads,
    currentSpreadIndex: s.currentSpreadIndex,
  })))
  const toggleOverview = useEditorStore((s) => s.toggleOverview)
  const setCurrentSpread = useEditorStore((s) => s.setCurrentSpread)
  const replacePhotoInSlotBySpread = useEditorStore((s) => s.replacePhotoInSlotBySpread)
  const removePhotoFromSlotBySpread = useEditorStore((s) => s.removePhotoFromSlotBySpread)
  const swapPhotosAcrossSpreads = useEditorStore((s) => s.swapPhotosAcrossSpreads)
  const movePhotoToEmptySlot = useEditorStore((s) => s.movePhotoToEmptySlot)
  const addToast = useUIStore((s) => s.addToast)

  const thumbnailLookup = useMemo(() => {
    const photos = useAlbumStore.getState().photos
    const lookup: Record<string, string> = {}
    for (const p of photos) {
      if (p.thumbnailUrl) lookup[p.id] = p.thumbnailUrl
    }
    return lookup
  }, [])

  const [gridReady, setGridReady] = useState(false)
  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setGridReady(true))
    })
  }, [])

  // ── Hover-based photo selection ──
  const [hoveredPhoto, setHoveredPhoto] = useState<HoveredPhoto | null>(null)
  const hoverLockRef = useRef(false)

  const handleHoverPhoto = useCallback((photo: HoveredPhoto | null) => {
    if (hoverLockRef.current) return
    setHoveredPhoto(photo)
  }, [])

  // ── Swap mode ──
  const [swapSource, setSwapSource] = useState<{ spreadId: string; slotId: string } | null>(null)

  const handleStartSwap = useCallback(() => {
    if (!hoveredPhoto) return
    setSwapSource({ spreadId: hoveredPhoto.spreadId, slotId: hoveredPhoto.slotId })
    hoverLockRef.current = true
    addToast('בחר תמונה יעד להחלפה', 'info')
  }, [hoveredPhoto, addToast])

  const handleClickSlotForSwap = useCallback((targetSpreadId: string, targetSlotId: string) => {
    if (!swapSource) return
    if (swapSource.spreadId === targetSpreadId && swapSource.slotId === targetSlotId) return

    const tgtSpread = useEditorStore.getState().spreads.find((s) => s.id === targetSpreadId)
    const tgtEl = tgtSpread?.design?.elements.find(
      (el) => el.type === 'photo' && el.slotId === targetSlotId,
    )
    const tgtHasPhoto = tgtEl && 'photoUrl' in tgtEl && tgtEl.photoUrl

    if (tgtHasPhoto) {
      swapPhotosAcrossSpreads(swapSource.spreadId, swapSource.slotId, targetSpreadId, targetSlotId)
      addToast('התמונות הוחלפו בהצלחה', 'success')
    } else {
      movePhotoToEmptySlot(swapSource.spreadId, swapSource.slotId, targetSpreadId, targetSlotId)
      addToast('התמונה הועברה בהצלחה', 'success')
    }

    setSwapSource(null)
    hoverLockRef.current = false
    setHoveredPhoto(null)
  }, [swapSource, swapPhotosAcrossSpreads, movePhotoToEmptySlot, addToast])

  const cancelSwap = useCallback(() => {
    setSwapSource(null)
    hoverLockRef.current = false
  }, [])

  // ── Replace photo ──
  const replaceFileRef = useRef<HTMLInputElement>(null)

  const handleReplace = useCallback(() => {
    replaceFileRef.current?.click()
  }, [])

  const handleReplaceFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.files?.[0]
    if (raw && hoveredPhoto) {
      const { convertImageFile } = await import('../../lib/photoUtils')
      const f = await convertImageFile(raw).catch(() => raw)
      replacePhotoInSlotBySpread(hoveredPhoto.spreadId, hoveredPhoto.slotId, f)
      addToast('התמונה הוחלפה בהצלחה', 'success')
    }
    e.target.value = ''
  }, [hoveredPhoto, replacePhotoInSlotBySpread, addToast])

  // ── Remove photo ──
  const handleRemove = useCallback(() => {
    if (!hoveredPhoto) return
    removePhotoFromSlotBySpread(hoveredPhoto.spreadId, hoveredPhoto.slotId)
    setHoveredPhoto(null)
    addToast('התמונה הוסרה', 'success')
  }, [hoveredPhoto, removePhotoFromSlotBySpread, addToast])

  // ── Navigate to spread ──
  const handleNavigate = useCallback(() => {
    if (!hoveredPhoto) return
    setCurrentSpread(hoveredPhoto.spreadIndex)
    toggleOverview()
  }, [hoveredPhoto, setCurrentSpread, toggleOverview])

  const handleJumpToSpread = useCallback((index: number) => {
    setCurrentSpread(index)
    toggleOverview()
  }, [setCurrentSpread, toggleOverview])

  // ── Keyboard ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        if (swapSource) { cancelSwap(); return }
        toggleOverview()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleOverview, swapSource, cancelSwap])

  const hintText = swapSource
    ? 'לחץ על תמונה יעד להחלפה · Esc לביטול'
    : 'העבר עכבר על תמונה לפעולות · לחץ על עמוד לניווט · Esc לסגירה'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex flex-col"
      dir="rtl"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ backdropFilter: 'blur(0px)' }}
        animate={{ backdropFilter: 'blur(12px)' }}
        exit={{ backdropFilter: 'blur(0px)' }}
        transition={{ duration: 0.25 }}
        className="absolute inset-0 bg-[#EEECEA]/95"
        onClick={() => {
          if (swapSource) { cancelSwap(); return }
          toggleOverview()
        }}
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
          {swapSource && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              type="button"
              onClick={cancelSwap}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-semibold hover:bg-amber-100 transition-colors"
            >
              <Icon name="close" size={14} />
              ביטול העברה
            </motion.button>
          )}
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

      {/* Grid -- adjusted padding-right for sidebar */}
      <motion.div
        className="relative z-10 flex-1 overflow-y-auto px-4 md:px-8 md:pr-[230px] py-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: gridReady ? 1 : 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-[72rem] mx-auto">
          {spreads.map((spread, i) => (
            <LazyCard key={spread.id} index={i}>
              <OverviewSpreadCard
                spread={spread}
                index={i}
                total={spreads.length}
                isCurrent={i === currentSpreadIndex}
                activePhotoSlotId={hoveredPhoto?.spreadId === spread.id ? hoveredPhoto.slotId : null}
                swapTargetMode={!!swapSource}
                thumbnailLookup={thumbnailLookup}
                onHoverPhoto={handleHoverPhoto}
                onClickSlotForSwap={handleClickSlotForSwap}
                onJumpToSpread={handleJumpToSpread}
                entranceDelay={i < 8 ? i * 0.04 : 0}
              />
            </LazyCard>
          ))}
        </div>
      </motion.div>

      {/* Sidebar */}
      <AnimatePresence>
        <OverviewSidebar
          key="overview-sidebar"
          selectedPhoto={hoveredPhoto}
          spreadsCount={spreads.length}
          onReplace={handleReplace}
          onRemove={handleRemove}
          onNavigate={handleNavigate}
          onStartSwap={handleStartSwap}
          onClose={toggleOverview}
        />
      </AnimatePresence>

      {/* Hidden file input for photo replacement */}
      <input
        ref={replaceFileRef}
        type="file"
        accept="image/*,.heic,.heif,.tiff,.tif"
        className="sr-only"
        onChange={handleReplaceFile}
      />

      {/* Hint bar */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...OVERLAY_SPRING, delay: 0.15 }}
        className="relative z-10 text-center py-3 text-[11px] text-secondary/40 font-medium border-t border-black/[0.04]"
      >
        {hintText}
      </motion.div>
    </motion.div>
  )
}
