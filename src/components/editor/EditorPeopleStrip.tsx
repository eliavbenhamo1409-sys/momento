import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useAlbumStore } from '../../store/albumStore'
import { useEditorStore } from '../../store/editorStore'
import { useShallow } from 'zustand/react/shallow'
import Icon from '../shared/Icon'
import type { AlbumPerson, PhotoElement, EditorSpread } from '../../types'

/* ─── Helpers ────────────────────────────────────────────────────────── */

function buildPhotoIdToUrl(photos: { id: string; thumbnailUrl: string; fullUrl: string }[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const p of photos) {
    map.set(p.id, p.fullUrl || p.thumbnailUrl)
  }
  return map
}

function findSpreadIndexForPhotoUrl(spreads: EditorSpread[], targetUrl: string): number {
  for (let i = 0; i < spreads.length; i++) {
    const spread = spreads[i]
    if (spread.design) {
      for (const el of spread.design.elements) {
        if (el.type === 'photo') {
          const pe = el as PhotoElement
          if (pe.photoUrl === targetUrl) return i
        }
      }
    }
    if (spread.leftPhotos.includes(targetUrl) || spread.rightPhotos.includes(targetUrl)) {
      return i
    }
  }
  return -1
}

/* ─── Editable Name ──────────────────────────────────────────────────── */

function EditableName({
  personId,
  name,
  isEditing,
  onStartEdit,
  onFinishEdit,
}: {
  personId: string
  name: string
  isEditing: boolean
  onStartEdit: () => void
  onFinishEdit: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const updatePersonName = useAlbumStore((s) => s.updatePersonName)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleBlur = useCallback(() => {
    const val = inputRef.current?.value.trim()
    if (val && val !== name) updatePersonName(personId, val)
    onFinishEdit()
  }, [personId, name, updatePersonName, onFinishEdit])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleBlur()
      if (e.key === 'Escape') onFinishEdit()
    },
    [handleBlur, onFinishEdit],
  )

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        defaultValue={name}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-full text-[10px] leading-tight font-medium text-center bg-white/90 rounded px-1 py-0.5 outline-none ring-1 ring-sage/40 text-deep-brown"
        style={{ maxWidth: 64 }}
      />
    )
  }

  return (
    <span
      onClick={(e) => {
        e.stopPropagation()
        onStartEdit()
      }}
      className="text-[10px] leading-tight font-medium max-w-[56px] truncate text-secondary/70 hover:text-sage cursor-text transition-colors"
      title="לחץ לשינוי שם"
    >
      {name}
    </span>
  )
}

/* ─── Person Avatar (circle) ─────────────────────────────────────────── */

function PersonCircle({
  person,
  fallbackUrl,
  isSelected,
  onClick,
  editingNameId,
  onStartEditName,
  onFinishEditName,
}: {
  person: AlbumPerson
  fallbackUrl: string | undefined
  isSelected: boolean
  onClick: () => void
  editingNameId: string | null
  onStartEditName: (id: string) => void
  onFinishEditName: () => void
}) {
  const avatarSrc = person.avatarCropUrl || fallbackUrl
  const isUnidentified = person.displayName === 'לא מזוהה'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative shrink-0 flex flex-col items-center gap-0.5 group"
    >
      <motion.button
        type="button"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.93 }}
        onClick={onClick}
        className="relative outline-none"
      >
        <div
          className={`w-10 h-10 md:w-11 md:h-11 rounded-full overflow-hidden transition-all duration-200 ${
            isSelected
              ? 'ring-[2.5px] ring-sage shadow-[0_0_12px_rgba(139,152,120,0.3)]'
              : isUnidentified
                ? 'ring-2 ring-black/10 group-hover:ring-black/20 shadow-sm opacity-60'
                : 'ring-2 ring-white/70 group-hover:ring-sage/40 shadow-sm'
          }`}
        >
          {avatarSrc ? (
            <img src={avatarSrc} alt={person.displayName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
              <Icon name="person" size={18} className="text-secondary/40" />
            </div>
          )}
        </div>

        {/* Photo count badge */}
        <span className="absolute -bottom-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-deep-brown/80 text-white text-[9px] font-bold leading-none shadow-sm">
          {person.photoIds.length}
        </span>
      </motion.button>

      <EditableName
        personId={person.id}
        name={person.displayName}
        isEditing={editingNameId === person.id}
        onStartEdit={() => onStartEditName(person.id)}
        onFinishEdit={onFinishEditName}
      />
    </motion.div>
  )
}

/* ─── Expanded Photos Panel ──────────────────────────────────────────── */

function PersonPhotosPanel({
  person,
  photoUrlMap,
  onPhotoClick,
  onClose,
}: {
  person: AlbumPerson
  photoUrlMap: Map<string, string>
  onPhotoClick: (photoId: string) => void
  onClose: () => void
}) {
  const photos = person.photoIds
    .map((id) => ({ id, url: photoUrlMap.get(id) }))
    .filter((p): p is { id: string; url: string } => !!p.url)

  const avatarSrc = person.avatarCropUrl || photoUrlMap.get(person.avatarPhotoId)

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      className="absolute top-full left-0 right-0 z-30 mt-2"
    >
      <div className="mx-4 md:mx-8 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_12px_48px_rgba(45,40,35,0.14)] ring-1 ring-black/[0.04] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-sage/30 shadow-sm">
              {avatarSrc ? (
                <img src={avatarSrc} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
                  <Icon name="person" size={16} className="text-secondary/40" />
                </div>
              )}
            </div>
            <div>
              <span
                className="text-sm font-bold text-deep-brown block"
                style={{ fontFamily: 'var(--font-family-headline)' }}
              >
                {person.displayName}
              </span>
              <span className="text-[11px] text-secondary/50">
                {photos.length} תמונות באלבום
              </span>
            </div>
          </div>

          <motion.button
            type="button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-secondary/40 hover:text-deep-brown hover:bg-surface-container-high/60 transition-colors"
          >
            <Icon name="close" size={18} />
          </motion.button>
        </div>

        {/* Photos grid */}
        <div className="p-3 max-h-[240px] overflow-y-auto">
          {photos.length > 0 ? (
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {photos.map((photo) => (
                <motion.button
                  key={photo.id}
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onPhotoClick(photo.id)}
                  className="aspect-square rounded-lg overflow-hidden ring-1 ring-black/[0.04] hover:ring-sage/50 hover:shadow-md transition-all duration-200 cursor-pointer"
                >
                  <img src={photo.url} alt="" className="w-full h-full object-cover" />
                </motion.button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-secondary/40 py-6 text-center">לא נמצאו תמונות</p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Main Strip ─────────────────────────────────────────────────────── */

export default function EditorPeopleStrip() {
  const peopleRoster = useAlbumStore((s) => s.peopleRoster)
  const storePhotos = useAlbumStore((s) => s.photos)
  const spreads = useEditorStore((s) => s.spreads)
  const setCurrentSpread = useEditorStore((s) => s.setCurrentSpread)
  const { deselectAll } = useEditorStore(useShallow((s) => ({ deselectAll: s.deselectAll })))

  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null)
  const [editingNameId, setEditingNameId] = useState<string | null>(null)

  const photoUrlMap = useMemo(() => buildPhotoIdToUrl(storePhotos), [storePhotos])

  const handlePersonClick = useCallback((person: AlbumPerson) => {
    setSelectedPersonId((prev) => (prev === person.id ? null : person.id))
  }, [])

  const handlePhotoClick = useCallback(
    (photoId: string) => {
      const url = photoUrlMap.get(photoId)
      if (url) {
        const idx = findSpreadIndexForPhotoUrl(spreads, url)
        if (idx >= 0) {
          deselectAll()
          requestAnimationFrame(() => setCurrentSpread(idx))
        }
      }
      setSelectedPersonId(null)
    },
    [spreads, setCurrentSpread, deselectAll, photoUrlMap],
  )

  const handleClose = useCallback(() => setSelectedPersonId(null), [])

  const handleStartEditName = useCallback((id: string) => setEditingNameId(id), [])
  const handleFinishEditName = useCallback(() => setEditingNameId(null), [])

  if (!peopleRoster || peopleRoster.length === 0) return null

  const selectedPerson = peopleRoster.find((p) => p.id === selectedPersonId)

  return (
    <div className="relative shrink-0 z-20">
      <div className="flex items-center gap-3 px-4 md:px-8 py-1.5 overflow-x-auto scrollbar-hide">
        {peopleRoster.map((person, i) => (
          <motion.div
            key={person.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 22 }}
          >
            <PersonCircle
              person={person}
              fallbackUrl={photoUrlMap.get(person.avatarPhotoId)}
              isSelected={selectedPersonId === person.id}
              onClick={() => handlePersonClick(person)}
              editingNameId={editingNameId}
              onStartEditName={handleStartEditName}
              onFinishEditName={handleFinishEditName}
            />
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedPerson && (
          <PersonPhotosPanel
            person={selectedPerson}
            photoUrlMap={photoUrlMap}
            onPhotoClick={handlePhotoClick}
            onClose={handleClose}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
