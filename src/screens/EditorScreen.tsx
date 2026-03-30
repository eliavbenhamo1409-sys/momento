import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import PageTransition from '../components/shared/PageTransition'
import EditorTopBar from '../components/editor/EditorTopBar'
import EditorCanvas from '../components/editor/EditorCanvas'
import EditorSidebar from '../components/editor/EditorSidebar'
import PageThumbnails from '../components/editor/PageThumbnails'
import PreviewOverlay from '../components/editor/PreviewOverlay'
import AlbumOverview from '../components/editor/AlbumOverview'
import PhotoEditorModal from '../components/editor/PhotoEditorModal'
import DotGrid from '../components/editor/DotGrid'
import { useEditorStore } from '../store/editorStore'
import { useAlbumStore } from '../store/albumStore'
import { useAutoSave, useAlbumLoad } from '../hooks/useAlbumPersistence'
import { calcAlbumPrice, ALBUM_SIZES } from '../lib/constants'

export default function EditorScreen() {
  useAutoSave(25000)
  const { albumId } = useParams<{ albumId?: string }>()
  const loadAlbum = useAlbumLoad()
  const [loadingAlbum, setLoadingAlbum] = useState(false)

  useEffect(() => {
    if (!albumId) return
    const currentAlbumId = useAlbumStore.getState().albumId
    if (currentAlbumId === albumId) return

    setLoadingAlbum(true)
    loadAlbum(albumId).finally(() => setLoadingAlbum(false))
  }, [albumId, loadAlbum])

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

  if (loadingAlbum) {
    return (
      <PageTransition>
        <div className="h-screen w-screen flex items-center justify-center bg-[#EEECEA]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-10 h-10 border-2 border-primary/25 border-t-primary rounded-full animate-spin" />
            <span className="text-sm text-secondary/60 font-medium">טוען אלבום...</span>
          </motion.div>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#EEECEA] relative">
        <DotGrid />
        <EditorTopBar />
        <div className="flex-1 relative overflow-hidden z-10">
          <EditorCanvas />
          <PageThumbnails />
          <EditorSidebar />
        </div>

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

        <PhotoEditorModal />
      </div>
    </PageTransition>
  )
}
