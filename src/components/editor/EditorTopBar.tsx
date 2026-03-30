import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import { useAlbumStore } from '../../store/albumStore'
import { useEditorStore } from '../../store/editorStore'
import { useShallow } from 'zustand/react/shallow'
import { useAlbumSave } from '../../hooks/useAlbumPersistence'
import Icon from '../shared/Icon'

export default function EditorTopBar() {
  const navigate = useNavigate()
  const { albumTitle, setAlbumTitle } = useAlbumStore(useShallow((s) => ({ albumTitle: s.albumTitle, setAlbumTitle: s.setAlbumTitle })))
  const { isSaving, lastSaved, currentSpreadIndex, spreadCount } = useEditorStore(useShallow((s) => ({
    isSaving: s.isSaving,
    lastSaved: s.lastSaved,
    currentSpreadIndex: s.currentSpreadIndex,
    spreadCount: s.spreads.length,
  })))
  const togglePreview = useEditorStore((s) => s.togglePreview)
  const toggleOverview = useEditorStore((s) => s.toggleOverview)
  const saveAlbum = useAlbumSave()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(albumTitle)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  useEffect(() => {
    if (!mobileMenuOpen) return
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false)
      }
    }
    document.addEventListener('pointerdown', onClickOutside)
    return () => document.removeEventListener('pointerdown', onClickOutside)
  }, [mobileMenuOpen])

  const commitTitle = () => {
    setAlbumTitle(draft)
    setEditing(false)
    saveAlbum()
  }

  const spreadLabel = `עמוד ${currentSpreadIndex * 2 + 1}–${currentSpreadIndex * 2 + 2} מתוך ${spreadCount * 2}`

  return (
    <header className="w-full z-20 bg-white/75 backdrop-blur-xl flex justify-between items-center px-4 md:px-8 py-2.5 md:py-3 border-b border-outline-variant/8 shrink-0 relative">
      <div className="flex items-center gap-3 md:gap-5 min-w-0">
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/')}
          className="flex items-center gap-2 shrink-0"
        >
          <span
            className="text-lg md:text-xl font-light tracking-tighter text-on-surface"
            style={{ fontFamily: 'var(--font-family-headline)' }}
          >
            Momento
          </span>
        </motion.button>

        <div className="h-7 w-px bg-outline-variant/20 hidden sm:block" />

        <div className="flex flex-col gap-0.5 min-w-0">
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitTitle()
                if (e.key === 'Escape') {
                  setDraft(albumTitle)
                  setEditing(false)
                }
              }}
              className="font-bold text-base md:text-lg text-on-surface bg-transparent border-b-2 border-primary/40 outline-none px-0 py-0 min-w-[8rem] md:min-w-[14rem]"
              style={{ fontFamily: 'var(--font-family-headline)' }}
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-start font-bold text-base md:text-lg text-on-surface leading-tight flex items-center gap-1.5 group truncate"
              style={{ fontFamily: 'var(--font-family-headline)' }}
            >
              <span className="truncate">{albumTitle}</span>
              <Icon name="edit" size={14} className="opacity-0 group-hover:opacity-50 transition-opacity shrink-0" />
            </button>
          )}
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-secondary/60 font-medium hidden sm:inline">{spreadLabel}</span>
            <span className="w-1 h-1 rounded-full bg-outline-variant/40 hidden sm:inline" />
            <span className="text-[11px] text-secondary/50 flex items-center gap-1">
              {isSaving ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-sage animate-pulse" />
                  שומר...
                </>
              ) : lastSaved ? (
                <>
                  <Icon name="cloud_done" size={13} className="text-sage" />
                  נשמר
                </>
              ) : null}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Full buttons — visible on md+ */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={toggleOverview}
          className="hidden md:flex px-4 py-2 rounded-full text-secondary/80 font-medium hover:bg-surface-container-high/60 transition-colors items-center gap-1.5 text-sm"
        >
          <Icon name="grid_view" size={18} />
          מבט על
        </motion.button>
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={togglePreview}
          className="hidden md:flex px-4 py-2 rounded-full text-secondary/80 font-medium hover:bg-surface-container-high/60 transition-colors items-center gap-1.5 text-sm"
        >
          <Icon name="visibility" size={18} />
          תצוגה מקדימה
        </motion.button>

        {/* Icon-only buttons — visible on sm..md */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={toggleOverview}
          className="hidden sm:flex md:hidden w-9 h-9 rounded-full text-secondary/70 hover:bg-surface-container-high/60 transition-colors items-center justify-center"
          aria-label="מבט על"
        >
          <Icon name="grid_view" size={20} />
        </motion.button>
        <motion.button
          type="button"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={togglePreview}
          className="hidden sm:flex md:hidden w-9 h-9 rounded-full text-secondary/70 hover:bg-surface-container-high/60 transition-colors items-center justify-center"
          aria-label="תצוגה מקדימה"
        >
          <Icon name="visibility" size={20} />
        </motion.button>

        {/* Overflow menu — visible below sm */}
        <div className="relative sm:hidden" ref={menuRef}>
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="w-9 h-9 rounded-full text-secondary/70 hover:bg-surface-container-high/60 transition-colors flex items-center justify-center"
            aria-label="תפריט"
          >
            <Icon name="more_vert" size={20} />
          </motion.button>
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.18 }}
                className="absolute left-0 top-full mt-1.5 w-44 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(45,40,35,0.15)] border border-black/[0.06] py-1.5 z-50"
                dir="rtl"
              >
                <button
                  onClick={() => { toggleOverview(); setMobileMenuOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  <Icon name="grid_view" size={18} className="text-secondary/60" />
                  מבט על
                </button>
                <button
                  onClick={() => { togglePreview(); setMobileMenuOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  <Icon name="visibility" size={18} className="text-secondary/60" />
                  תצוגה מקדימה
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={saveAlbum}
          disabled={isSaving}
          className="hidden sm:flex px-4 py-2 rounded-full border border-outline-variant/30 text-secondary font-medium hover:bg-surface-container-low transition-colors text-sm disabled:opacity-50"
        >
          {isSaving ? 'שומר...' : 'שמירה'}
        </motion.button>
        <motion.button
          type="button"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={saveAlbum}
          disabled={isSaving}
          className="sm:hidden w-9 h-9 rounded-full border border-outline-variant/30 text-secondary/70 hover:bg-surface-container-low transition-colors flex items-center justify-center disabled:opacity-50"
          aria-label="שמירה"
        >
          <Icon name={isSaving ? 'progress_activity' : 'save'} size={18} />
        </motion.button>
        <motion.button
          type="button"
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/checkout')}
          className="px-4 md:px-7 py-2 md:py-2.5 rounded-full bg-deep-brown text-white font-bold shadow-[0_4px_16px_rgba(47,46,43,0.25)] hover:shadow-[0_6px_24px_rgba(47,46,43,0.35)] transition-all text-xs md:text-sm tracking-wide"
          style={{ fontFamily: 'var(--font-family-headline)' }}
        >
          <span className="hidden sm:inline">הזמן עכשיו</span>
          <span className="sm:hidden">הזמנה</span>
        </motion.button>
      </div>
    </header>
  )
}
