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
  const [inView, setInView] = useState(false)
  const btnRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    setBroken(false)
  }, [url])

  useEffect(() => {
    const el = btnRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry?.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { root: el.closest('[data-photos-scroll]') as Element | null, rootMargin: '220px' },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <button
      ref={btnRef}
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
      ) : !inView ? (
        <div className="w-full h-full skeleton-shimmer bg-surface-container-highest" />
      ) : (
        <img
          src={url}
          alt=""
          loading="lazy"
          decoding="async"
          fetchPriority="low"
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
        <div className="p-2 max-h-[180px] overflow-y-auto" data-photos-scroll>
          {photos.length > 0 ? (
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1.5">
              {photos.map((photo) => (
                <PhotoThumb
                  key={photo.id}
                  photoId={photo.id}
                  url={photo.url}
                  isChosen={selectedPhotoId === photo.id}
                  isRevealed
                  revealDelay={0}
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

/* ─── Unplaced Photos Panel ───────────────────────────────────────────── */

function UnplacedPhotosPanel({
  photos,
  onPhotoSelect,
  selectedPhotoId,
  onClose,
}: {
  photos: { id: string; url: string }[]
  onPhotoSelect: (photoId: string, photoUrl: string) => void
  selectedPhotoId: string | null
  onClose: () => void
}) {
  const handleSelect = useCallback(
    (photoId: string) => {
      const photo = photos.find((p) => p.id === photoId)
      if (photo) onPhotoSelect(photoId, photo.url)
    },
    [photos, onPhotoSelect],
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
        <div className="flex items-center justify-between px-3 py-2 border-b border-outline-variant/8">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full overflow-hidden ring-2 ring-amber-400/40 shadow-sm shrink-0 bg-amber-50 flex items-center justify-center">
              <Icon name="photo_library" size={14} className="text-amber-600/70" />
            </div>
            <div className="min-w-0">
              <span
                className="text-xs font-bold text-deep-brown block truncate"
                style={{ fontFamily: 'var(--font-family-headline)' }}
              >
                תמונות לא ממוקמות
              </span>
              <span className="text-[10px] text-secondary/50">
                {photos.length} תמונות
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-cream/60 rounded-lg">
              <Icon name="touch_app" size={13} className="text-amber-500/70" />
              <span className="text-[10px] text-secondary/50 leading-none whitespace-nowrap">
                בחרו תמונה → לחצו על מקום באלבום למיקום
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

        <div className="sm:hidden px-3 py-1.5 bg-cream/40 border-b border-outline-variant/6">
          <div className="flex items-center gap-1.5">
            <Icon name="touch_app" size={13} className="text-amber-500/70" />
            <span className="text-[10px] text-secondary/50">
              בחרו תמונה → לחצו על מקום באלבום למיקום
            </span>
          </div>
        </div>

        <div className="p-2 max-h-[180px] overflow-y-auto" data-photos-scroll>
          {photos.length > 0 ? (
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1.5">
              {photos.map((photo) => (
                <PhotoThumb
                  key={photo.id}
                  photoId={photo.id}
                  url={photo.url}
                  isChosen={selectedPhotoId === photo.id}
                  isRevealed
                  revealDelay={0}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-secondary/40 py-4 text-center">כל התמונות ממוקמות באלבום</p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Unplaced Circle Button ──────────────────────────────────────────── */

function UnplacedCircle({
  count,
  isSelected,
  onClick,
}: {
  count: number
  isSelected: boolean
  onClick: () => void
}) {
  if (count === 0) return null

  return (
    <button
      type="button"
      onClick={onClick}
      className="btn-press relative shrink-0 outline-none"
      title="תמונות לא ממוקמות"
    >
      <div
        className={`w-7 h-7 md:w-8 md:h-8 rounded-full overflow-hidden transition-[ring-color,box-shadow] flex items-center justify-center ${
          isSelected
            ? 'ring-2 ring-amber-400 shadow-[0_0_8px_rgba(217,175,60,0.3)] bg-amber-50'
            : 'ring-[1.5px] ring-amber-300/50 hover:ring-amber-400/60 shadow-sm bg-amber-50/60'
        }`}
      >
        <Icon name="photo_library" size={14} className="text-amber-600/70" />
      </div>

      <span className="absolute -bottom-0.5 -right-0.5 min-w-[14px] h-[14px] px-0.5 flex items-center justify-center rounded-full bg-amber-500/90 text-white text-[8px] font-bold leading-none shadow-sm">
        {count}
      </span>
    </button>
  )
}

/* ─── Main Strip ─────────────────────────────────────────────────────── */

type PanelMode = { type: 'person'; id: string } | { type: 'unplaced' } | null

export default function EditorPeopleStrip() {
  const peopleRoster = useAlbumStore((s) => s.peopleRoster)
  const storePhotos = useAlbumStore((s) => s.photos)
  const spreads = useEditorStore((s) => s.spreads)
  const pendingPhotoSwap = useEditorStore((s) => s.pendingPhotoSwap)
  const setPendingPhotoSwap = useEditorStore((s) => s.setPendingPhotoSwap)
  const pendingUnplacedPhoto = useEditorStore((s) => s.pendingUnplacedPhoto)
  const setPendingUnplacedPhoto = useEditorStore((s) => s.setPendingUnplacedPhoto)

  const [panelMode, setPanelMode] = useState<PanelMode>(null)
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

  const placedPhotoIds = useMemo(() => {
    const set = new Set<string>()
    for (const s of spreads) {
      if (!s.design) continue
      for (const el of s.design.elements) {
        if (el.type === 'photo') {
          const pe = el as PhotoElement
          if (pe.photoId && pe.photoUrl) set.add(pe.photoId)
        }
      }
    }
    return set
  }, [spreads])

  const unplacedPhotos = useMemo(() => {
    const result: { id: string; url: string }[] = []
    for (const p of storePhotos) {
      if (placedPhotoIds.has(p.id)) continue
      const url = p.thumbnailUrl || p.fullUrl
      if (url) result.push({ id: p.id, url })
    }
    return result
  }, [storePhotos, placedPhotoIds])

  const selectedPersonId = panelMode?.type === 'person' ? panelMode.id : null
  const isUnplacedOpen = panelMode?.type === 'unplaced'

  const handlePersonClick = useCallback((person: AlbumPerson) => {
    setPanelMode((prev) =>
      prev?.type === 'person' && prev.id === person.id ? null : { type: 'person', id: person.id },
    )
    setChosenPhotoId(null)
    setPendingPhotoSwap(null)
    setPendingUnplacedPhoto(null)
  }, [setPendingPhotoSwap, setPendingUnplacedPhoto])

  const handleUnplacedClick = useCallback(() => {
    setPanelMode((prev) => (prev?.type === 'unplaced' ? null : { type: 'unplaced' }))
    setChosenPhotoId(null)
    setPendingPhotoSwap(null)
    setPendingUnplacedPhoto(null)
  }, [setPendingPhotoSwap, setPendingUnplacedPhoto])

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

  const handleUnplacedPhotoSelect = useCallback(
    (photoId: string, photoUrl: string) => {
      if (chosenPhotoId === photoId) {
        setChosenPhotoId(null)
        setPendingUnplacedPhoto(null)
        return
      }
      const storePhoto = storePhotos.find((p) => p.id === photoId)
      const bestUrl = storePhoto?.fullUrl || photoUrl
      lastSwapPersonRef.current = null
      setChosenPhotoId(photoId)
      setPendingUnplacedPhoto({ photoUrl: bestUrl, photoId })
    },
    [chosenPhotoId, storePhotos, setPendingUnplacedPhoto],
  )

  const handleCancelSwap = useCallback(() => {
    setChosenPhotoId(null)
    setPendingPhotoSwap(null)
    setPendingUnplacedPhoto(null)
    if (lastSwapPersonRef.current) {
      setPanelMode({ type: 'person', id: lastSwapPersonRef.current })
    } else {
      setPanelMode({ type: 'unplaced' })
    }
  }, [setPendingPhotoSwap, setPendingUnplacedPhoto])

  useEffect(() => {
    if (!pendingPhotoSwap && !pendingUnplacedPhoto && chosenPhotoId) {
      setChosenPhotoId(null)
      const reopenPerson = lastSwapPersonRef.current
      if (reopenPerson) {
        const timer = setTimeout(() => {
          setPanelMode({ type: 'person', id: reopenPerson })
        }, 300)
        return () => clearTimeout(timer)
      } else {
        const timer = setTimeout(() => {
          setPanelMode({ type: 'unplaced' })
        }, 300)
        return () => clearTimeout(timer)
      }
    }
  }, [pendingPhotoSwap, pendingUnplacedPhoto, chosenPhotoId])

  const handleClose = useCallback(() => {
    setPanelMode(null)
    setChosenPhotoId(null)
    setPendingPhotoSwap(null)
    setPendingUnplacedPhoto(null)
    lastSwapPersonRef.current = null
  }, [setPendingPhotoSwap, setPendingUnplacedPhoto])

  const hasPeople = peopleRoster && peopleRoster.length > 0
  const hasUnplaced = unplacedPhotos.length > 0

  if (!hasPeople && !hasUnplaced) return null

  const selectedPerson = hasPeople ? peopleRoster.find((p) => p.id === selectedPersonId) : undefined
  const isSwapActive = !!pendingPhotoSwap || !!pendingUnplacedPhoto

  return (
    <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
      <div className="pointer-events-auto flex items-center gap-1.5 px-3 overflow-x-auto scrollbar-hide" style={{ maxWidth: '50vw' }}>
        {hasPeople && peopleRoster.map((person) => (
          <PersonCircle
            key={person.id}
            person={person}
            isSelected={selectedPersonId === person.id}
            onClick={() => handlePersonClick(person)}
          />
        ))}

        {hasPeople && hasUnplaced && (
          <div className="w-px h-5 bg-black/[0.06] mx-0.5 shrink-0" />
        )}

        <UnplacedCircle
          count={unplacedPhotos.length}
          isSelected={isUnplacedOpen}
          onClick={handleUnplacedClick}
        />
      </div>

      <AnimatePresence mode="wait">
        {selectedPerson && !isSwapActive && (
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
        {isUnplacedOpen && !isSwapActive && (
          <UnplacedPhotosPanel
            key="panel-unplaced"
            photos={unplacedPhotos}
            onPhotoSelect={handleUnplacedPhotoSelect}
            selectedPhotoId={chosenPhotoId}
            onClose={handleClose}
          />
        )}
        {isSwapActive && (
          <SwapActiveBanner key="swap-banner" onCancel={handleCancelSwap} />
        )}
      </AnimatePresence>
    </div>
  )
}
