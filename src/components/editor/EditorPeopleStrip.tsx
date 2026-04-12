import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useAlbumStore } from '../../store/albumStore'
import { useEditorStore } from '../../store/editorStore'
import Icon from '../shared/Icon'
import type { AlbumPerson, PhotoElement, EditorSpread } from '../../types'

/* ─── Helpers ────────────────────────────────────────────────────────── */

function findSlotForPhotoUrl(
  spreads: EditorSpread[],
  targetUrl: string,
): { spreadId: string; slotId: string; spreadIndex: number } | null {
  for (let i = 0; i < spreads.length; i++) {
    const spread = spreads[i]
    if (!spread.design) continue
    for (const el of spread.design.elements) {
      if (el.type === 'photo') {
        const pe = el as PhotoElement
        if (pe.photoUrl === targetUrl) {
          return { spreadId: spread.id, slotId: pe.slotId, spreadIndex: i }
        }
      }
    }
  }
  return null
}

/**
 * Build a comprehensive URL lookup for a person by merging:
 * 1. person.photoUrlLookup (embedded at detection time — primary)
 * 2. album store photos (fallback for any missing IDs)
 * 3. spreads photoId→URL map (final fallback — always has current URLs)
 */
function getPhotoUrl(
  photoId: string,
  personLookup: Record<string, string> | undefined,
  storeLookup: Map<string, string>,
  spreadsLookup?: Map<string, string>,
): string | undefined {
  const fromPerson = personLookup?.[photoId]
  if (fromPerson && !fromPerson.startsWith('blob:')) return fromPerson
  return storeLookup.get(photoId) || spreadsLookup?.get(photoId) || fromPerson
}

/* ─── Person Avatar (circle) ─────────────────────────────────────────── */

function PersonCircle({
  person,
  isSelected,
  onClick,
}: {
  person: AlbumPerson
  isSelected: boolean
  onClick: () => void
}) {
  const avatarSrc = person.avatarCropUrl
  const isUnidentified = person.displayName === 'לא מזוהה'

  return (
    <button
      type="button"
      onClick={onClick}
      className="btn-press relative shrink-0 outline-none"
      title={person.displayName}
    >
      <div
        className={`w-7 h-7 md:w-8 md:h-8 rounded-full overflow-hidden transition-[ring-color,box-shadow] ${
          isSelected
            ? 'ring-2 ring-sage shadow-[0_0_8px_rgba(139,152,120,0.3)]'
            : isUnidentified
              ? 'ring-[1.5px] ring-black/10 hover:ring-black/20 shadow-sm opacity-60'
              : 'ring-[1.5px] ring-white/70 hover:ring-sage/40 shadow-sm'
        }`}
      >
        {avatarSrc ? (
          <img src={avatarSrc} alt={person.displayName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
            <Icon name="person" size={14} className="text-secondary/40" />
          </div>
        )}
      </div>

      <span className="absolute -bottom-0.5 -right-0.5 min-w-[14px] h-[14px] px-0.5 flex items-center justify-center rounded-full bg-deep-brown/80 text-white text-[8px] font-bold leading-none shadow-sm">
        {person.photoIds.length}
      </span>
    </button>
  )
}

/* ─── Swap Active Banner ─────────────────────────────────────────────── */

function SwapActiveBanner({ onCancel }: { onCancel: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2 }}
      className="absolute top-full left-0 right-0 z-30 mt-1 px-4 md:px-8 pointer-events-auto"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-2 bg-sage/10 backdrop-blur-md rounded-xl ring-1 ring-sage/20">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.8 }}
          >
            <Icon name="swap_horiz" size={18} className="text-sage" />
          </motion.div>
          <span className="text-xs font-medium text-deep-brown/80">
            לחצו על תמונה באלבום כדי להחליף
          </span>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="btn-press text-[11px] font-medium text-secondary/50 hover:text-deep-brown px-2 py-0.5 rounded-md hover:bg-white/60 transition-colors"
        >
          ביטול
        </button>
      </div>
    </motion.div>
  )
}

/* ─── Photo Thumbnail ─────────────────────────────────────────────────── */

function PhotoThumb({
  photoId,
  url,
  isChosen,
  isRevealed,
  revealDelay,
  onSelect,
}: {
  photoId: string
  url: string
  isChosen: boolean
  isRevealed: boolean
  revealDelay: number
  onSelect: (id: string) => void
}) {
  const [broken, setBroken] = useState(false)

  return (
    <button
      type="button"
      onClick={() => onSelect(photoId)}
      className={`aspect-square rounded-md overflow-hidden cursor-pointer
        transition-all ease-out
        ${isChosen
          ? 'ring-2 ring-sage shadow-[0_0_10px_rgba(139,152,120,0.35)] scale-[1.04]'
          : 'ring-1 ring-black/[0.05] hover:ring-sage/40 hover:shadow-sm hover:scale-[1.06]'
        }
        ${isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
      `}
      style={{
        transitionDuration: '350ms',
        transitionDelay: isRevealed ? `${revealDelay}ms` : '0ms',
      }}
    >
      {broken ? (
        <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
          <Icon name="broken_image" size={16} className="text-secondary/30" />
        </div>
      ) : (
        <img
          src={url}
          alt=""
          loading="lazy"
          className="w-full h-full object-cover"
          onError={() => setBroken(true)}
        />
      )}
    </button>
  )
}

/* ─── Expanded Photos Panel ──────────────────────────────────────────── */

function PersonPhotosPanel({
  person,
  storeLookup,
  spreadsLookup,
  onPhotoSelect,
  selectedPhotoId,
  onClose,
}: {
  person: AlbumPerson
  storeLookup: Map<string, string>
  spreadsLookup: Map<string, string>
  onPhotoSelect: (photoId: string, photoUrl: string) => void
  selectedPhotoId: string | null
  onClose: () => void
}) {
  const photos = useMemo(() => {
    const result: { id: string; url: string }[] = []
    for (const id of person.photoIds) {
      const url = getPhotoUrl(id, person.photoUrlLookup, storeLookup, spreadsLookup)
      if (url) result.push({ id, url })
    }
    return result
  }, [person, storeLookup, spreadsLookup])

  const avatarSrc = person.avatarCropUrl

  const [phase, setPhase] = useState<'loading' | 'revealed'>('loading')

  useEffect(() => {
    const t = setTimeout(() => setPhase('revealed'), 350)
    return () => clearTimeout(t)
  }, [])

  const handleSelect = useCallback(
    (photoId: string) => {
      const url = getPhotoUrl(photoId, person.photoUrlLookup, storeLookup, spreadsLookup)
      if (url) onPhotoSelect(photoId, url)
    },
    [person.photoUrlLookup, storeLookup, spreadsLookup, onPhotoSelect],
  )

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ type: 'tween', duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="absolute top-full left-0 right-0 z-30 mt-2 will-change-[opacity,height] overflow-hidden pointer-events-auto"
    >
      <div className="mx-4 md:mx-8 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_12px_48px_rgba(45,40,35,0.14)] ring-1 ring-black/[0.04] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-outline-variant/8">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full overflow-hidden ring-2 ring-sage/30 shadow-sm shrink-0">
              {avatarSrc ? (
                <img src={avatarSrc} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
                  <Icon name="person" size={14} className="text-secondary/40" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <span
                className="text-xs font-bold text-deep-brown block truncate"
                style={{ fontFamily: 'var(--font-family-headline)' }}
              >
                {person.displayName}
              </span>
              <span className="text-[10px] text-secondary/50">
                {photos.length} תמונות
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-cream/60 rounded-lg">
              <Icon name="touch_app" size={13} className="text-sage/70" />
              <span className="text-[10px] text-secondary/50 leading-none whitespace-nowrap">
                בחרו תמונה → לחצו על מקום באלבום להחלפה
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center text-secondary/40 hover:text-deep-brown hover:bg-surface-container-high/60 transition-colors"
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        </div>

        {/* Instruction on mobile */}
        <div className="sm:hidden px-3 py-1.5 bg-cream/40 border-b border-outline-variant/6">
          <div className="flex items-center gap-1.5">
            <Icon name="touch_app" size={13} className="text-sage/70" />
            <span className="text-[10px] text-secondary/50">
              בחרו תמונה → לחצו על מקום באלבום להחלפה
            </span>
          </div>
        </div>

        {/* Photos grid */}
        <div className="p-2 max-h-[180px] overflow-y-auto">
          {phase === 'loading' ? (
            <div className="flex items-center justify-center py-6 gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
              >
                <Icon name="progress_activity" size={20} className="text-sage/60" />
              </motion.div>
              <span className="text-[11px] text-secondary/40">טוען תמונות...</span>
            </div>
          ) : photos.length > 0 ? (
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1.5">
              {photos.map((photo, i) => (
                <PhotoThumb
                  key={photo.id}
                  photoId={photo.id}
                  url={photo.url}
                  isChosen={selectedPhotoId === photo.id}
                  isRevealed={phase === 'revealed'}
                  revealDelay={Math.min(i * 20, 400)}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-secondary/40 py-4 text-center">לא נמצאו תמונות</p>
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
  const pendingPhotoSwap = useEditorStore((s) => s.pendingPhotoSwap)
  const setPendingPhotoSwap = useEditorStore((s) => s.setPendingPhotoSwap)

  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null)
  const [chosenPhotoId, setChosenPhotoId] = useState<string | null>(null)

  const lastSwapPersonRef = useRef<string | null>(null)

  const storeLookup = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of storePhotos) {
      if (p.fullUrl) map.set(p.id, p.fullUrl)
      else if (p.thumbnailUrl) map.set(p.id, p.thumbnailUrl)
    }
    return map
  }, [storePhotos])

  const spreadsLookup = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of spreads) {
      if (!s.design) continue
      for (const el of s.design.elements) {
        if (el.type === 'photo') {
          const pe = el as PhotoElement
          if (pe.photoId && pe.photoUrl && !pe.photoUrl.startsWith('blob:')) {
            map.set(pe.photoId, pe.photoUrl)
          }
        }
      }
    }
    return map
  }, [spreads])

  const handlePersonClick = useCallback((person: AlbumPerson) => {
    setSelectedPersonId((prev) => (prev === person.id ? null : person.id))
    setChosenPhotoId(null)
    setPendingPhotoSwap(null)
  }, [setPendingPhotoSwap])

  const handlePhotoSelect = useCallback(
    (photoId: string, photoUrl: string) => {
      if (chosenPhotoId === photoId) {
        setChosenPhotoId(null)
        setPendingPhotoSwap(null)
        return
      }

      const slot = findSlotForPhotoUrl(spreads, photoUrl)
      if (!slot) {
        const storePhoto = storePhotos.find((p) => p.id === photoId)
        const altUrl = storePhoto?.fullUrl
        const altSlot = altUrl ? findSlotForPhotoUrl(spreads, altUrl) : null
        if (!altSlot) return
        lastSwapPersonRef.current = selectedPersonId
        setChosenPhotoId(photoId)
        setPendingPhotoSwap({ spreadId: altSlot.spreadId, slotId: altSlot.slotId })
        return
      }

      lastSwapPersonRef.current = selectedPersonId
      setChosenPhotoId(photoId)
      setPendingPhotoSwap({ spreadId: slot.spreadId, slotId: slot.slotId })
    },
    [spreads, storePhotos, chosenPhotoId, selectedPersonId, setPendingPhotoSwap],
  )

  const handleCancelSwap = useCallback(() => {
    setChosenPhotoId(null)
    setPendingPhotoSwap(null)
    if (lastSwapPersonRef.current) {
      setSelectedPersonId(lastSwapPersonRef.current)
    }
  }, [setPendingPhotoSwap])

  useEffect(() => {
    if (!pendingPhotoSwap && chosenPhotoId) {
      setChosenPhotoId(null)
      const reopenPerson = lastSwapPersonRef.current
      if (reopenPerson) {
        const timer = setTimeout(() => {
          setSelectedPersonId(reopenPerson)
        }, 300)
        return () => clearTimeout(timer)
      }
    }
  }, [pendingPhotoSwap, chosenPhotoId])

  const handleClose = useCallback(() => {
    setSelectedPersonId(null)
    setChosenPhotoId(null)
    setPendingPhotoSwap(null)
    lastSwapPersonRef.current = null
  }, [setPendingPhotoSwap])


  if (!peopleRoster || peopleRoster.length === 0) return null

  const selectedPerson = peopleRoster.find((p) => p.id === selectedPersonId)

  return (
    <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
      <div className="pointer-events-auto flex items-center gap-1.5 px-3 overflow-x-auto scrollbar-hide" style={{ maxWidth: '50vw' }}>
        {peopleRoster.map((person) => (
          <PersonCircle
            key={person.id}
            person={person}
            isSelected={selectedPersonId === person.id}
            onClick={() => handlePersonClick(person)}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {selectedPerson && !pendingPhotoSwap && (
          <PersonPhotosPanel
            key={`panel-${selectedPerson.id}`}
            person={selectedPerson}
            storeLookup={storeLookup}
            spreadsLookup={spreadsLookup}
            onPhotoSelect={handlePhotoSelect}
            selectedPhotoId={chosenPhotoId}
            onClose={handleClose}
          />
        )}
        {pendingPhotoSwap && (
          <SwapActiveBanner key="swap-banner" onCancel={handleCancelSwap} />
        )}
      </AnimatePresence>
    </div>
  )
}
