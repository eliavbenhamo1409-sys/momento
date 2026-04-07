import { useCallback, useRef, useState, useEffect, useMemo } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useEditorStore } from '../../store/editorStore'
import { useAlbumStore } from '../../store/albumStore'
import { useUIStore } from '../../store/uiStore'
import { useShallow } from 'zustand/react/shallow'
import OverviewSpreadCard from './OverviewSpreadCard'
import OverviewSidebar, { type OverviewMode } from './OverviewSidebar'
import AIBackgroundPanel from './AIBackgroundPanel'
import Icon from '../shared/Icon'

const BANNER_CONFIG: Record<string, { icon: string; title: string; subtitle: string }> = {
  replace:        { icon: 'swap_horiz',    title: 'החלפת תמונה',            subtitle: 'לחצו על התמונה שברצונכם להחליף' },
  'swap-source':  { icon: 'touch_app',     title: 'העברת תמונה',            subtitle: 'לחצו על התמונה שברצונכם להעביר' },
  'swap-target':  { icon: 'swap_horiz',    title: 'בחרו את המיקום המוחלף',  subtitle: 'לחצו על תמונה או מיקום ריק כדי להחליף' },
  remove:         { icon: 'delete_outline', title: 'הסרת תמונה',            subtitle: 'לחצו על התמונה שברצונכם להסיר' },
  'bg-color':     { icon: 'palette',       title: 'צבע רקע',               subtitle: 'בחרו צבע בסרגל ולחצו על עמוד להחלה' },
  'bg-ai':        { icon: 'auto_awesome',  title: 'רקע AI',                subtitle: 'לחצו על העמוד שברצונכם ליצור לו רקע' },
  'delete-spread': { icon: 'delete',       title: 'מחיקת עמוד',            subtitle: 'לחצו על העמוד שברצונכם למחוק' },
}

function LazyCard({ children, index }: { children: React.ReactNode; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(index < 16)

  useEffect(() => {
    if (visible || !ref.current) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { rootMargin: '300px' },
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
  const spreadIds = useEditorStore(useShallow((s) => s.spreads.map((sp) => sp.id)))
  const spreadsCount = spreadIds.length
  const currentSpreadIndex = useEditorStore((s) => s.currentSpreadIndex)
  const toggleOverview = useEditorStore((s) => s.toggleOverview)
  const setCurrentSpread = useEditorStore((s) => s.setCurrentSpread)
  const replacePhotoInSlotBySpread = useEditorStore((s) => s.replacePhotoInSlotBySpread)
  const removePhotoFromSlotBySpread = useEditorStore((s) => s.removePhotoFromSlotBySpread)
  const swapPhotosAcrossSpreads = useEditorStore((s) => s.swapPhotosAcrossSpreads)
  const movePhotoToEmptySlot = useEditorStore((s) => s.movePhotoToEmptySlot)
  const deleteSpread = useEditorStore((s) => s.deleteSpread)
  const setSpreadBgColor = useEditorStore((s) => s.setSpreadBgColor)
  const removePhotoSlotBySpread = useEditorStore((s) => s.removePhotoSlotBySpread)
  const addToast = useUIStore((s) => s.addToast)

  const [gridReady, setGridReady] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setGridReady(true))
    })
    return () => cancelAnimationFrame(id)
  }, [])

  const photos = useAlbumStore((s) => s.photos)
  const thumbnailLookup = useMemo(() => {
    const lookup: Record<string, string> = {}
    for (const p of photos) {
      if (p.thumbnailUrl) lookup[p.id] = p.thumbnailUrl
    }
    return lookup
  }, [photos])

  // ── Mode state ──
  const [mode, setMode] = useState<OverviewMode>('idle')
  const [swapSource, setSwapSource] = useState<{ spreadId: string; slotId: string } | null>(null)
  const [selectedBgColor, setSelectedBgColor] = useState<string | null>(null)

  const replaceFileRef = useRef<HTMLInputElement>(null)
  const pendingReplace = useRef<{ spreadId: string; slotId: string } | null>(null)

  const handleSetMode = useCallback((newMode: OverviewMode) => {
    setMode(newMode)
    if (newMode !== 'swap-target') setSwapSource(null)
    if (newMode !== 'bg-color') setSelectedBgColor(null)
  }, [])

  const handleClickPhoto = useCallback((spreadId: string, slotId: string, _spreadIndex: number) => {
    switch (mode) {
      case 'replace': {
        pendingReplace.current = { spreadId, slotId }
        replaceFileRef.current?.click()
        break
      }
      case 'swap-source': {
        setSwapSource({ spreadId, slotId })
        setMode('swap-target')
        break
      }
      case 'swap-target': {
        if (!swapSource) return
        if (swapSource.spreadId === spreadId && swapSource.slotId === slotId) return
        const tgtSpread = useEditorStore.getState().spreads.find((s) => s.id === spreadId)
        const tgtEl = tgtSpread?.design?.elements.find(
          (el) => el.type === 'photo' && el.slotId === slotId,
        )
        const tgtHasPhoto = tgtEl && 'photoUrl' in tgtEl && tgtEl.photoUrl
        if (tgtHasPhoto) {
          swapPhotosAcrossSpreads(swapSource.spreadId, swapSource.slotId, spreadId, slotId)
          addToast('התמונות הוחלפו בהצלחה', 'success')
        } else {
          movePhotoToEmptySlot(swapSource.spreadId, swapSource.slotId, spreadId, slotId)
          addToast('התמונה הועברה בהצלחה', 'success')
        }
        setSwapSource(null)
        setMode('idle')
        break
      }
      case 'remove': {
        removePhotoFromSlotBySpread(spreadId, slotId)
        addToast('התמונה הוסרה', 'success')
        break
      }
    }
  }, [mode, swapSource, swapPhotosAcrossSpreads, movePhotoToEmptySlot, removePhotoFromSlotBySpread, addToast])

  const handleClickSpread = useCallback((spreadId: string, spreadIndex: number) => {
    switch (mode) {
      case 'bg-color': {
        if (selectedBgColor) {
          setSpreadBgColor(spreadId, selectedBgColor)
          addToast('הרקע עודכן', 'success')
        } else {
          addToast('בחרו צבע קודם מהסרגל')
        }
        break
      }
      case 'bg-ai': {
        setCurrentSpread(spreadIndex)
        setMode('bg-ai-panel')
        break
      }
      case 'bg-ai-panel': {
        setCurrentSpread(spreadIndex)
        break
      }
      case 'delete-spread': {
        if (useEditorStore.getState().spreads.length <= 1) {
          addToast('לא ניתן למחוק את העמוד האחרון')
          return
        }
        deleteSpread(spreadId)
        addToast('העמוד נמחק')
        break
      }
    }
  }, [mode, selectedBgColor, setSpreadBgColor, setCurrentSpread, deleteSpread, addToast])

  const handleReplaceFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.files?.[0]
    const target = pendingReplace.current
    if (raw && target) {
      const { convertImageFile } = await import('../../lib/photoUtils')
      const f = await convertImageFile(raw).catch(() => raw)
      replacePhotoInSlotBySpread(target.spreadId, target.slotId, f)
      addToast('התמונה הוחלפה בהצלחה', 'success')
    }
    pendingReplace.current = null
    e.target.value = ''
  }, [replacePhotoInSlotBySpread, addToast])

  const handleRemoveSlot = useCallback((spreadId: string, slotId: string) => {
    removePhotoSlotBySpread(spreadId, slotId)
    addToast('המשבצת הוסרה', 'success')
  }, [removePhotoSlotBySpread, addToast])

  const handleJumpToSpread = useCallback((index: number) => {
    setCurrentSpread(index)
    toggleOverview()
  }, [setCurrentSpread, toggleOverview])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        if (mode !== 'idle') { handleSetMode('idle'); return }
        toggleOverview()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleOverview, mode, handleSetMode])

  const handleSelectBgColor = useCallback((color: string) => {
    setSelectedBgColor(color)
  }, [])

  const bannerCfg = BANNER_CONFIG[mode]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12 }}
      className="fixed inset-0 z-50 flex flex-col"
      dir="rtl"
    >
      {/* Backdrop — opaque, no blur */}
      <div
        className="absolute inset-0 bg-[#EEECEA]"
        onClick={() => {
          if (mode !== 'idle') { handleSetMode('idle'); return }
          toggleOverview()
        }}
      />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-4 md:px-8 py-3 md:py-4 border-b border-black/[0.04] overview-header-enter">
        <div className="flex items-center gap-4">
          <h2
            className="text-xl font-bold text-on-surface"
            style={{ fontFamily: 'var(--font-family-headline)' }}
          >
            מבט על האלבום
          </h2>
          <span className="text-sm text-secondary/50 font-medium">
            {spreadsCount} דפים
          </span>
        </div>
        <button
          type="button"
          onClick={toggleOverview}
          className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center shadow-sm border border-black/[0.06] hover:bg-white hover:scale-105 active:scale-95 transition-all duration-150"
          aria-label="סגור"
        >
          <Icon name="close" size={20} className="text-secondary/70" />
        </button>
      </header>

      {/* Action Banner */}
      <AnimatePresence>
        {bannerCfg && (
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.1, ease: 'easeOut' }}
            dir="rtl"
            className="absolute top-[72px] left-1/2 -translate-x-1/2 z-[56] flex items-center gap-3 px-5 py-3 rounded-2xl bg-deep-brown/90 shadow-xl shadow-black/10"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Icon name={bannerCfg.icon} size={18} className="text-white" />
            </span>
            <div className="flex flex-col">
              <span className="text-white text-sm font-bold leading-snug">
                {bannerCfg.title}
              </span>
              <span className="text-white/55 text-[10px] font-medium">
                {bannerCfg.subtitle}
              </span>
            </div>
            <button
              onClick={() => handleSetMode('idle')}
              className="ms-2 w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <Icon name="close" size={16} className="text-white/80" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      <div
        className={`relative z-10 flex-1 overflow-y-auto px-4 md:px-8 py-6 ${
          mode === 'bg-ai-panel' ? 'md:pr-[340px]' : 'md:pr-[230px]'
        }`}
      >
        {!gridReady ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-7 h-7 border-2 border-primary/15 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-[72rem] mx-auto overview-grid-enter">
            {spreadIds.map((id, i) => (
              <LazyCard key={id} index={i}>
                <OverviewSpreadCard
                  spreadIndex={i}
                  total={spreadsCount}
                  isCurrent={i === currentSpreadIndex}
                  activeMode={mode}
                  swapSourceSlotId={swapSource?.slotId ?? null}
                  thumbnailLookup={thumbnailLookup}
                  onClickPhoto={handleClickPhoto}
                  onClickSpread={handleClickSpread}
                  onRemoveSlot={handleRemoveSlot}
                  onJumpToSpread={handleJumpToSpread}
                />
              </LazyCard>
            ))}
          </div>
        )}
      </div>

      {/* Sidebar */}
      {mode !== 'bg-ai-panel' && (
        <OverviewSidebar
          activeMode={mode}
          spreadsCount={spreadsCount}
          onSetMode={handleSetMode}
          onSelectBgColor={handleSelectBgColor}
          onClose={toggleOverview}
        />
      )}

      {/* Inline AI Background Panel */}
      <AnimatePresence>
        {mode === 'bg-ai-panel' && (
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ type: 'spring', stiffness: 500, damping: 35, mass: 0.7 }}
            className="fixed z-[55] top-[72px] right-4 md:right-6 bottom-[56px] w-80 max-w-[min(20rem,calc(100vw-3rem))] pointer-events-auto"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-full overflow-y-auto no-scrollbar">
              <AIBackgroundPanel
                onClose={() => handleSetMode('idle')}
                standalone
                defaultTab="ai"
              />
            </div>
          </motion.div>
        )}
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
      <div className="relative z-10 text-center py-3 text-[11px] text-secondary/40 font-medium border-t border-black/[0.04]">
        {mode === 'idle'
          ? 'בחר פעולה מהסרגל · לחץ על עמוד לניווט · Esc לסגירה'
          : 'Esc לביטול הפעולה'}
      </div>
    </motion.div>
  )
}
