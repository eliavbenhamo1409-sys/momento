import { useEffect, useMemo, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import PageTransition from '../components/shared/PageTransition'
import LoadingOverlay from '../components/shared/LoadingOverlay'
import EditorTopBar from '../components/editor/EditorTopBar'
import EditorCanvas from '../components/editor/EditorCanvas'
import EditorSidebar from '../components/editor/EditorSidebar'
import PageThumbnails from '../components/editor/PageThumbnails'
import PreviewOverlay from '../components/editor/PreviewOverlay'
import AlbumOverview from '../components/editor/AlbumOverview'
import DotGrid from '../components/editor/DotGrid'
import { contentReveal } from '../lib/animations'
import { useEditorStore } from '../store/editorStore'
import { useAlbumStore } from '../store/albumStore'
import { useAutoSave, useAlbumLoad } from '../hooks/useAlbumPersistence'
import { calcAlbumPrice, ALBUM_SIZES } from '../lib/constants'

export default function EditorScreen() {
  useAutoSave(25000)
  const { albumId } = useParams<{ albumId?: string }>()
  const navigate = useNavigate()
  const loadAlbum = useAlbumLoad()
  const [loadingAlbum, setLoadingAlbum] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [contentReady, setContentReady] = useState(false)

  const doLoad = useCallback(async (id: string) => {
    setLoadingAlbum(true)
    setLoadError(false)
    setContentReady(false)
    try {
      await loadAlbum(id)
      requestAnimationFrame(() => {
        setTimeout(() => setContentReady(true), 150)
      })
    } catch {
      setLoadError(true)
    } finally {
      setLoadingAlbum(false)
    }
  }, [loadAlbum])

  useEffect(() => {
    if (!albumId) {
      const hasSpreads = useEditorStore.getState().spreads.length > 0
      if (hasSpreads) {
        setContentReady(true)
        return
      }
      navigate('/dashboard', { replace: true })
      return
    }
    const currentAlbumId = useAlbumStore.getState().albumId
    if (currentAlbumId === albumId) {
      setContentReady(true)
      return
    }
    doLoad(albumId)
  }, [albumId, doLoad, navigate])

  const isPreviewOpen = useEditorStore((s) => s.isPreviewOpen)
  const isOverviewOpen = useEditorStore((s) => s.isOverviewOpen)
  const togglePreview = useEditorStore((s) => s.togglePreview)
  const toggleOverview = useEditorStore((s) => s.toggleOverview)
  const spreadCount = useEditorStore((s) => s.spreads.length)
  const config = useAlbumStore((s) => s.config)
  const sizeLabel = ALBUM_SIZES.find((s) => s.id === config.size)?.label ?? config.size
  const actualPages = spreadCount * 2
  const totalPrice = useMemo(() => calcAlbumPrice(config.size, actualPages), [config.size, actualPages])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (['INPUT', 'TEXTAREA'].includes(tag)) return
      if (e.key === ' ') {
        e.preventDefault()
        togglePreview()
      }
      if (e.key === 'o' || e.key === 'O') {
        e.preventDefault()
        toggleOverview()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [togglePreview, toggleOverview])

  if (loadingAlbum || loadError) {
    return (
      <PageTransition>
        <div className="h-screen w-screen flex items-center justify-center bg-[#EEECEA]">
          <AnimatePresence mode="wait">
            {loadError ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4 text-center"
              >
                <span className="material-symbols-outlined text-3xl text-warm-gray/60">error_outline</span>
                <p className="text-sm font-medium text-on-surface/70 font-headline">לא הצלחנו לטעון את האלבום</p>
                <button
                  onClick={() => albumId && doLoad(albumId)}
                  className="px-5 py-2 rounded-full bg-sage text-white text-sm font-medium hover:bg-sage/90 transition-colors"
                >
                  נסה שוב
                </button>
              </motion.div>
            ) : (
              <LoadingOverlay key="loading" label="טוען אלבום..." fullScreen={false} />
            )}
          </AnimatePresence>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#EEECEA] relative">
        <DotGrid />
        <EditorTopBar />

        <AnimatePresence>
          {!contentReady && (
            <LoadingOverlay key="content-gate" label="מכין את העורך..." />
          )}
        </AnimatePresence>

        <motion.div
          className="flex-1 relative overflow-hidden z-10"
          variants={contentReveal}
          initial="initial"
          animate={contentReady ? 'animate' : 'initial'}
        >
          <EditorCanvas />
          <PageThumbnails />
          <EditorSidebar />
        </motion.div>

        <footer className="w-full bg-white/70 backdrop-blur-lg border-t border-outline-variant/6 flex justify-between items-center px-4 md:px-10 py-2 md:py-2.5 shrink-0 relative z-20">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wider text-secondary/45 font-medium">גודל</span>
              <span className="text-xs font-bold text-on-surface/70" style={{ fontFamily: 'var(--font-family-headline)' }}>
                {sizeLabel}
              </span>
            </div>
            <div className="w-px h-3.5 bg-outline-variant/15 hidden sm:block" />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wider text-secondary/45 font-medium">עמודים</span>
              <span className="text-xs font-bold text-on-surface/70" style={{ fontFamily: 'var(--font-family-headline)' }}>
                {actualPages}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-secondary/45 font-medium">סה״כ</span>
            <span className="text-base font-bold text-on-surface" style={{ fontFamily: 'var(--font-family-headline)' }}>
              ₪{totalPrice}
            </span>
          </div>
        </footer>

        <AnimatePresence>
          {isPreviewOpen && <PreviewOverlay />}
          {isOverviewOpen && <AlbumOverview />}
        </AnimatePresence>

      </div>
    </PageTransition>
  )
}
