import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useAlbumStore } from '../../store/albumStore'
import { useEditorStore } from '../../store/editorStore'
import { useShallow } from 'zustand/react/shallow'
import Icon from '../shared/Icon'
import type { AlbumPerson, PhotoElement, EditorSpread } from '../../types'

function buildPhotoUrlMap(spreads: EditorSpread[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const spread of spreads) {
    if (!spread.design) continue
    for (const el of spread.design.elements) {
      if (el.type !== 'photo') continue
      const pe = el as PhotoElement
      const pid = pe.photoId?.replace('-mirror', '')
      if (pid && pe.photoUrl && !map.has(pid)) {
        map.set(pid, pe.photoUrl)
      }
    }
  }
  return map
}

function findSpreadIndexForPhotoId(spreads: EditorSpread[], photoId: string): number {
  for (let i = 0; i < spreads.length; i++) {
    const spread = spreads[i]
    if (spread.design) {
      for (const el of spread.design.elements) {
        if (el.type === 'photo') {
          const pe = el as PhotoElement
          if (pe.photoId?.replace('-mirror', '') === photoId) return i
        }
      }
    }
  }
  return -1
}

function PersonAvatar({ person, photoUrl, isSelected, onClick }: {
  person: AlbumPerson
  photoUrl: string | undefined
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`relative shrink-0 flex flex-col items-center gap-1 group outline-none transition-all duration-200`}
    >
      <div className={`w-10 h-10 md:w-11 md:h-11 rounded-full overflow-hidden ring-2 transition-all duration-200 ${
        isSelected
          ? 'ring-sage shadow-[0_0_0_2px_rgba(139,152,120,0.25)]'
          : 'ring-white/60 group-hover:ring-sage/40'
      }`}>
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={person.displayName}
            className="w-full h-full object-cover"
            style={person.avatarObjectPosition ? { objectPosition: person.avatarObjectPosition } : undefined}
          />
        ) : (
          <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
            <Icon name="person" size={18} className="text-secondary/40" />
          </div>
        )}
      </div>
      <span className={`text-[10px] leading-tight font-medium max-w-[52px] truncate transition-colors ${
        isSelected ? 'text-sage' : 'text-secondary/60 group-hover:text-on-surface/70'
      }`}>
        {person.displayName}
      </span>
      <span className="text-[9px] text-secondary/40 leading-none">
        {person.photoIds.length}
      </span>
    </motion.button>
  )
}

function PersonPhotosPanel({ person, photoUrlMap, onPhotoClick, onClose }: {
  person: AlbumPerson
  photoUrlMap: Map<string, string>
  onPhotoClick: (photoId: string) => void
  onClose: () => void
}) {
  const photos = person.photoIds
    .map((id) => ({ id, url: photoUrlMap.get(id) }))
    .filter((p): p is { id: string; url: string } => !!p.url)

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="absolute top-full left-0 right-0 z-30 mt-1"
    >
      <div className="mx-3 md:mx-6 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(45,40,35,0.12)] border border-black/[0.04] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-outline-variant/8">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full overflow-hidden ring-1 ring-black/[0.04]">
              {photoUrlMap.get(person.avatarPhotoId) ? (
                <img
                  src={photoUrlMap.get(person.avatarPhotoId)}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
                  <Icon name="person" size={14} className="text-secondary/40" />
                </div>
              )}
            </div>
            <span className="text-sm font-bold text-on-surface" style={{ fontFamily: 'var(--font-family-headline)' }}>
              {person.displayName}
            </span>
            <span className="text-xs text-secondary/50">
              {photos.length} תמונות
            </span>
          </div>
          <motion.button
            type="button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-secondary/50 hover:text-on-surface hover:bg-surface-container-high/70 transition-colors"
          >
            <Icon name="close" size={16} />
          </motion.button>
        </div>

        <div className="p-3 overflow-x-auto">
          <div className="flex gap-2">
            {photos.map((photo) => (
              <motion.button
                key={photo.id}
                type="button"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => onPhotoClick(photo.id)}
                className="shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden ring-1 ring-black/[0.04] hover:ring-sage/40 hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                <img
                  src={photo.url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </motion.button>
            ))}
            {photos.length === 0 && (
              <p className="text-xs text-secondary/40 py-4 px-2">לא נמצאו תמונות</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function EditorPeopleStrip() {
  const peopleRoster = useAlbumStore((s) => s.peopleRoster)
  const spreads = useEditorStore((s) => s.spreads)
  const setCurrentSpread = useEditorStore((s) => s.setCurrentSpread)
  const { deselectAll } = useEditorStore(useShallow((s) => ({ deselectAll: s.deselectAll })))

  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null)

  const photoUrlMap = useMemo(() => buildPhotoUrlMap(spreads), [spreads])

  const handlePersonClick = useCallback((person: AlbumPerson) => {
    setSelectedPersonId((prev) => prev === person.id ? null : person.id)
  }, [])

  const handlePhotoClick = useCallback((photoId: string) => {
    const idx = findSpreadIndexForPhotoId(spreads, photoId)
    if (idx >= 0) {
      deselectAll()
      requestAnimationFrame(() => {
        setCurrentSpread(idx)
      })
    }
    setSelectedPersonId(null)
  }, [spreads, setCurrentSpread, deselectAll])

  const handleClose = useCallback(() => {
    setSelectedPersonId(null)
  }, [])

  if (!peopleRoster || peopleRoster.length === 0) return null

  const selectedPerson = peopleRoster.find((p) => p.id === selectedPersonId)

  return (
    <div className="relative shrink-0 z-20">
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        className="w-full bg-white/60 backdrop-blur-lg border-b border-outline-variant/6"
      >
        <div className="flex items-center gap-3 px-4 md:px-8 py-1.5 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-1.5 shrink-0">
            <Icon name="group" size={15} className="text-secondary/40" />
            <span className="text-[10px] uppercase tracking-wider text-secondary/40 font-medium whitespace-nowrap">
              אנשים
            </span>
          </div>

          <div className="w-px h-6 bg-outline-variant/15 shrink-0" />

          <div className="flex items-center gap-3 py-1">
            {peopleRoster.map((person) => (
              <PersonAvatar
                key={person.id}
                person={person}
                photoUrl={photoUrlMap.get(person.avatarPhotoId)}
                isSelected={selectedPersonId === person.id}
                onClick={() => handlePersonClick(person)}
              />
            ))}
          </div>
        </div>
      </motion.div>

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
