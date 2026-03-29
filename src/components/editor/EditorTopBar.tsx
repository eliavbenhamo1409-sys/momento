import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { useAlbumStore } from '../../store/albumStore'
import { useEditorStore } from '../../store/editorStore'
import { useAlbumSave } from '../../hooks/useAlbumPersistence'
import Icon from '../shared/Icon'

export default function EditorTopBar() {
  const navigate = useNavigate()
  const { albumTitle, setAlbumTitle } = useAlbumStore()
  const { isSaving, lastSaved, togglePreview, currentSpreadIndex, spreads } = useEditorStore()
  const saveAlbum = useAlbumSave()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(albumTitle)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  const commitTitle = () => {
    setAlbumTitle(draft)
    setEditing(false)
    saveAlbum()
  }

  const spreadLabel = `עמוד ${currentSpreadIndex * 2 + 1}–${currentSpreadIndex * 2 + 2} מתוך ${spreads.length * 2}`

  return (
    <header className="w-full z-20 bg-white/75 backdrop-blur-xl flex justify-between items-center px-8 py-3 border-b border-outline-variant/8 shrink-0 relative">
      <div className="flex items-center gap-5">
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/')}
          className="flex items-center gap-2"
        >
          <span
            className="text-xl font-light tracking-tighter text-on-surface"
            style={{ fontFamily: 'var(--font-family-headline)' }}
          >
            Momento
          </span>
        </motion.button>

        <div className="h-7 w-px bg-outline-variant/20" />

        <div className="flex flex-col gap-0.5">
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
              className="font-bold text-lg text-on-surface bg-transparent border-b-2 border-primary/40 outline-none px-0 py-0 min-w-[14rem]"
              style={{ fontFamily: 'var(--font-family-headline)' }}
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-start font-bold text-lg text-on-surface leading-tight flex items-center gap-1.5 group"
              style={{ fontFamily: 'var(--font-family-headline)' }}
            >
              {albumTitle}
              <Icon name="edit" size={14} className="opacity-0 group-hover:opacity-50 transition-opacity" />
            </button>
          )}
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-secondary/60 font-medium">{spreadLabel}</span>
            <span className="w-1 h-1 rounded-full bg-outline-variant/40" />
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

      <div className="flex items-center gap-3">
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={togglePreview}
          className="px-4 py-2 rounded-full text-secondary/80 font-medium hover:bg-surface-container-high/60 transition-colors flex items-center gap-1.5 text-sm"
        >
          <Icon name="visibility" size={18} />
          תצוגה מקדימה
        </motion.button>
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={saveAlbum}
          disabled={isSaving}
          className="px-4 py-2 rounded-full border border-outline-variant/30 text-secondary font-medium hover:bg-surface-container-low transition-colors text-sm disabled:opacity-50"
        >
          {isSaving ? 'שומר...' : 'שמירה'}
        </motion.button>
        <motion.button
          type="button"
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/checkout')}
          className="px-7 py-2.5 rounded-full bg-deep-brown text-white font-bold shadow-[0_4px_16px_rgba(47,46,43,0.25)] hover:shadow-[0_6px_24px_rgba(47,46,43,0.35)] transition-all text-sm tracking-wide"
          style={{ fontFamily: 'var(--font-family-headline)' }}
        >
          הזמן עכשיו
        </motion.button>
      </div>
    </header>
  )
}
