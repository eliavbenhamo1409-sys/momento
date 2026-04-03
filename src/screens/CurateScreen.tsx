import { useState, useCallback, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence, LayoutGroup } from 'motion/react'
import PageTransition from '../components/shared/PageTransition'
import ProductLayout from '../components/layout/ProductLayout'
import Icon from '../components/shared/Icon'
import { useAlbumStore } from '../store/albumStore'
import { runPhotoScoring } from '../lib/albumGenerator'
import { curatePhotos } from '../lib/photoScorer'
import { extractPhotoDate } from '../lib/photoUtils'
import type { PhotoScore, CuratedPhotoSet, RankedPhoto } from '../types'

type CurateMode = 'ai' | 'manual'
type Phase = 'choose' | 'processing' | 'curate'

interface PhotoCard {
  id: string
  thumbnailUrl: string
  score: PhotoScore | null
  reason?: string
}

/* ─── Processing Loader ──────────────────────────────────────────────── */

function ProcessingLoader({ progress, message }: { progress: number; message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      className="h-full flex items-center justify-center ambient-bg"
    >
      <div className="max-w-md w-full flex flex-col items-center text-center gap-8 px-6">
        <div className="relative w-[100px] h-[100px]">
          <div className="w-full h-full rounded-full bg-white flex items-center justify-center animate-soft-pulse editorial-shadow relative z-10">
            <motion.span
              className="block rounded-full border-[2.5px] border-sage/25 border-t-sage"
              style={{ width: 40, height: 40 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1.35, repeat: Infinity, ease: 'linear' }}
            />
          </div>
          <div className="absolute inset-0 rounded-full bg-sage/8 blur-2xl -z-10" />
        </div>

        <div className="space-y-3">
          <h1
            className="text-2xl font-bold text-deep-brown"
            style={{ fontFamily: 'var(--font-family-headline)' }}
          >
            {message}
          </h1>

          <div className="w-full max-w-xs mx-auto">
            <div className="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden">
              <div
                className="h-full shimmer-bar rounded-full"
                style={{
                  width: `${progress}%`,
                  transition: 'width 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              />
            </div>
            <p className="text-xs text-warm-gray mt-2 text-center tabular-nums">{progress}%</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Mode Selector ──────────────────────────────────────────────────── */

function ModeSelector({ onSelect }: { onSelect: (mode: CurateMode) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      className="h-full flex items-center justify-center ambient-bg"
    >
      <div className="max-w-2xl w-full flex flex-col items-center text-center gap-10 px-6">
        <div className="space-y-3">
          <h1
            className="text-3xl font-bold text-deep-brown"
            style={{ fontFamily: 'var(--font-family-headline)' }}
          >
            כיצד תרצה לסנן?
          </h1>
          <p className="text-warm-gray text-base max-w-md mx-auto leading-relaxed">
            בחר את שיטת הסינון המועדפת עליך לפני שנמשיך
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-lg">
          <motion.button
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect('ai')}
            className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-white ring-1 ring-black/[0.04] text-center transition-all duration-300 hover:shadow-xl group cursor-pointer"
            style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
          >
            <div className="w-16 h-16 rounded-2xl bg-sage/10 flex items-center justify-center group-hover:bg-sage/18 transition-colors">
              <Icon name="auto_awesome" size={32} className="text-sage" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-deep-brown" style={{ fontFamily: 'var(--font-family-headline)' }}>
                סינון בסיוע AI
              </h2>
              <p className="text-sm text-warm-gray leading-relaxed">
                הבינה המלאכותית תנתח את התמונות, תזהה כפילויות ואיכות נמוכה, ותציע סינון חכם
              </p>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect('manual')}
            className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-white ring-1 ring-black/[0.04] text-center transition-all duration-300 hover:shadow-xl group cursor-pointer"
            style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
          >
            <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center group-hover:bg-amber-100/80 transition-colors">
              <Icon name="touch_app" size={32} className="text-amber-700" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-deep-brown" style={{ fontFamily: 'var(--font-family-headline)' }}>
                סינון ידני
              </h2>
              <p className="text-sm text-warm-gray leading-relaxed">
                כל התמונות ייכנסו לאלבום ותוכל לבחור ידנית מה להוציא
              </p>
            </div>
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Photo Tile ─────────────────────────────────────────────────────── */

function PhotoTile({
  photo,
  side,
  onSwap,
}: {
  photo: PhotoCard
  side: 'selected' | 'removed'
  onSwap: (id: string) => void
}) {
  const quality = photo.score?.overallQuality ?? 0
  const isLowQuality = quality > 0 && quality < 4

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="relative group aspect-square rounded-xl overflow-hidden bg-white shadow-sm ring-1 ring-black/[0.04]"
    >
      <img
        src={photo.thumbnailUrl}
        alt=""
        loading="lazy"
        className="w-full h-full object-cover"
      />

      {isLowQuality && side === 'removed' && (
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent px-2 py-1.5">
          <span className="text-[10px] text-white/90 font-medium">
            {photo.reason || 'איכות נמוכה'}
          </span>
        </div>
      )}

      <motion.button
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onSwap(photo.id)}
        className={`absolute top-1.5 z-20 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg ${
          side === 'selected'
            ? 'left-1.5 bg-red-500/80 text-white backdrop-blur-sm'
            : 'right-1.5 bg-sage/90 text-white backdrop-blur-sm'
        }`}
        title={side === 'selected' ? 'הסר מהאלבום' : 'הוסף לאלבום'}
      >
        <Icon
          name={side === 'selected' ? 'arrow_back' : 'arrow_forward'}
          size={16}
        />
      </motion.button>

      {quality > 0 && (
        <div className={`absolute top-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity ${
          side === 'selected' ? 'right-1.5' : 'left-1.5'
        }`}>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-sm ${
            quality >= 7 ? 'bg-green-500/80 text-white' :
            quality >= 4 ? 'bg-amber-500/80 text-white' :
            'bg-red-500/80 text-white'
          }`}>
            {quality}/10
          </span>
        </div>
      )}
    </motion.div>
  )
}

/* ─── Placeholder score for manual mode ──────────────────────────────── */

function createPlaceholderScore(photoId: string, width: number, height: number): PhotoScore {
  const ratio = width / height
  const orientation = ratio > 1.1 ? 'landscape' : ratio < 0.9 ? 'portrait' : 'square'
  return {
    photoId,
    orientation: orientation as PhotoScore['orientation'],
    aspectRatio: ratio,
    sharpness: 5,
    exposure: 5,
    composition: 5,
    overallQuality: 5,
    scene: 'outdoor',
    peopleCount: 0,
    hasFaces: false,
    facesRegion: 'none',
    emotion: 'neutral',
    colorDominant: 'neutral',
    isHighlight: false,
    isCoverCandidate: false,
    isHeroCandidate: false,
    isCloseup: false,
    isGroupShot: false,
    recommendedDisplay: 'square',
    description: '',
  }
}

/* ─── Main Screen ────────────────────────────────────────────────────── */

export default function CurateScreen() {
  const navigate = useNavigate()
  const photos = useAlbumStore((s) => s.photos)
  const config = useAlbumStore((s) => s.config)

  const [phase, setPhase] = useState<Phase>('choose')
  const [mode, setMode] = useState<CurateMode | null>(null)

  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingMessage, setProcessingMessage] = useState('מתחיל...')

  const [scores, setScores] = useState<PhotoScore[]>([])
  const [dateLookupRecord, setDateLookupRecord] = useState<Record<string, number>>({})

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set())
  const [removedReasons, setRemovedReasons] = useState<Map<string, string>>(new Map())

  const aiCuratedRef = useRef<CuratedPhotoSet | null>(null)

  const scoreMap = useMemo(
    () => new Map(scores.map((s) => [s.photoId, s])),
    [scores],
  )

  /* ── AI mode: score + curate ─────────────────────────────────────── */

  const startAiMode = useCallback(async () => {
    setMode('ai')
    setPhase('processing')
    setProcessingMessage('סורק את התמונות שלך')

    try {
      const result = await runPhotoScoring(photos, (_stage, pct, msg) => {
        setProcessingProgress(pct)
        if (msg) setProcessingMessage(msg)
      })
      setScores(result.scores)
      setDateLookupRecord(result.dateLookup)

      const curated = curatePhotos(result.scores, config)
      aiCuratedRef.current = curated

      const selIds = new Set(curated.selected.map((r) => r.photoId))
      const remIds = new Set(curated.removed.map((r) => r.photoId))
      const reasons = new Map(curated.removed.map((r) => [r.photoId, r.reason]))

      for (const photo of photos) {
        if (!selIds.has(photo.id) && !remIds.has(photo.id)) {
          remIds.add(photo.id)
          reasons.set(photo.id, 'עודף — מעבר לכמות הנדרשת לאלבום')
        }
      }

      setSelectedIds(selIds)
      setRemovedIds(remIds)
      setRemovedReasons(reasons)
      setPhase('curate')
    } catch (err) {
      console.error('Scoring failed:', err)
      setSelectedIds(new Set(photos.map((p) => p.id)))
      setRemovedIds(new Set())
      setPhase('curate')
    }
  }, [photos, config])

  /* ── Manual mode: extract EXIF dates only ────────────────────────── */

  const startManualMode = useCallback(async () => {
    setMode('manual')
    setPhase('processing')
    setProcessingMessage('מכין את התמונות...')

    const lookup: Record<string, number> = {}
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i]
      if (photo.file) {
        try {
          const d = await extractPhotoDate(photo.file)
          lookup[photo.id] = d.getTime()
        } catch {
          lookup[photo.id] = photo.file.lastModified
        }
      } else {
        lookup[photo.id] = i
      }
      setProcessingProgress(Math.round(((i + 1) / photos.length) * 100))
    }

    setDateLookupRecord(lookup)
    setSelectedIds(new Set(photos.map((p) => p.id)))
    setRemovedIds(new Set())
    setRemovedReasons(new Map())
    setPhase('curate')
  }, [photos])

  /* ── Mode toggle (available only if AI was run) ──────────────────── */

  const handleModeSwitch = useCallback((newMode: CurateMode) => {
    if (newMode === mode) return
    setMode(newMode)
    if (newMode === 'manual') {
      setSelectedIds(new Set(photos.map((p) => p.id)))
      setRemovedIds(new Set())
      setRemovedReasons(new Map())
    } else if (aiCuratedRef.current) {
      const curated = aiCuratedRef.current
      const selIds = new Set(curated.selected.map((r) => r.photoId))
      const remIds = new Set(curated.removed.map((r) => r.photoId))
      const reasons = new Map(curated.removed.map((r) => [r.photoId, r.reason]))

      for (const photo of photos) {
        if (!selIds.has(photo.id) && !remIds.has(photo.id)) {
          remIds.add(photo.id)
          reasons.set(photo.id, 'עודף — מעבר לכמות הנדרשת לאלבום')
        }
      }

      setSelectedIds(selIds)
      setRemovedIds(remIds)
      setRemovedReasons(reasons)
    }
  }, [mode, photos])

  /* ── Swap photo between sides ────────────────────────────────────── */

  const handleSwap = useCallback((photoId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(photoId)) {
        next.delete(photoId)
        setRemovedIds((r) => new Set(r).add(photoId))
      } else {
        next.add(photoId)
        setRemovedIds((r) => {
          const nr = new Set(r)
          nr.delete(photoId)
          return nr
        })
      }
      return next
    })
  }, [])

  /* ── Continue → store data + navigate ────────────────────────────── */

  const handleContinue = useCallback(() => {
    const store = useAlbumStore.getState()

    if (mode === 'ai') {
      const selectedScores = scores.filter((s) => selectedIds.has(s.photoId))
      const ranked: RankedPhoto[] = selectedScores
        .sort((a, b) => b.overallQuality - a.overallQuality)
        .map((s, i) => ({
          photoId: s.photoId,
          score: s,
          rank: i,
          role: i === 0 ? 'cover' as const : i < 3 ? 'hero' as const : 'standard' as const,
        }))

      const removed: { photoId: string; reason: string }[] = []
      for (const rid of removedIds) {
        const sc = scores.find((s) => s.photoId === rid)
        removed.push({
          photoId: rid,
          reason: removedReasons.get(rid) || (sc ? 'הוסר ידנית' : 'עודף'),
        })
      }

      const coverCandidates = ranked.filter((r) => r.score.isCoverCandidate).map((r) => r.photoId)
      const heroCandidates = ranked.filter((r) => r.score.isHeroCandidate).map((r) => r.photoId)

      const curatedSet: CuratedPhotoSet = {
        selected: ranked,
        removed,
        coverCandidates: coverCandidates.length > 0 ? coverCandidates : ranked.slice(0, 3).map((r) => r.photoId),
        heroCandidates: heroCandidates.length > 0 ? heroCandidates : ranked.slice(0, 5).map((r) => r.photoId),
        totalOriginal: photos.length,
        totalSelected: ranked.length,
      }

      store.setPhotoScores(scores)
      store.setCuratedSet(curatedSet)
      store.setPhotoDateLookup(dateLookupRecord)
    } else {
      const selectedList = photos.filter((p) => selectedIds.has(p.id))

      selectedList.sort((a, b) => {
        const dA = dateLookupRecord[a.id] ?? 0
        const dB = dateLookupRecord[b.id] ?? 0
        return dA - dB
      })

      const ranked: RankedPhoto[] = selectedList.map((p, i) => ({
        photoId: p.id,
        score: createPlaceholderScore(p.id, p.width, p.height),
        rank: i,
        role: i === 0 ? 'cover' as const : i < 3 ? 'hero' as const : 'standard' as const,
      }))

      const removed = [...removedIds].map((id) => ({
        photoId: id,
        reason: removedReasons.get(id) || 'הוסר ידנית',
      }))

      const curatedSet: CuratedPhotoSet = {
        selected: ranked,
        removed,
        coverCandidates: ranked.slice(0, 3).map((r) => r.photoId),
        heroCandidates: ranked.slice(0, 5).map((r) => r.photoId),
        totalOriginal: photos.length,
        totalSelected: ranked.length,
      }

      store.setPhotoScores([])
      store.setCuratedSet(curatedSet)
      store.setPhotoDateLookup(dateLookupRecord)
    }

    navigate('/configure')
  }, [mode, scores, selectedIds, removedIds, removedReasons, dateLookupRecord, photos, navigate])

  /* ── Derived lists ───────────────────────────────────────────────── */

  const selectedPhotos: PhotoCard[] = useMemo(() => {
    const list = photos
      .filter((p) => selectedIds.has(p.id))
      .map((p) => ({
        id: p.id,
        thumbnailUrl: p.thumbnailUrl,
        score: scoreMap.get(p.id) ?? null,
      }))

    if (mode === 'manual' && Object.keys(dateLookupRecord).length > 0) {
      list.sort((a, b) => (dateLookupRecord[a.id] ?? 0) - (dateLookupRecord[b.id] ?? 0))
    }

    return list
  }, [photos, selectedIds, scoreMap, mode, dateLookupRecord])

  const removedPhotos: PhotoCard[] = useMemo(
    () =>
      photos
        .filter((p) => removedIds.has(p.id))
        .map((p) => ({
          id: p.id,
          thumbnailUrl: p.thumbnailUrl,
          score: scoreMap.get(p.id) ?? null,
          reason: removedReasons.get(p.id),
        })),
    [photos, removedIds, scoreMap, removedReasons],
  )

  /* ── Guard ───────────────────────────────────────────────────────── */

  if (photos.length === 0) {
    navigate('/upload')
    return null
  }

  /* ── Render ──────────────────────────────────────────────────────── */

  return (
    <PageTransition>
      <ProductLayout currentStep="curate" showSteps>
        <AnimatePresence mode="wait">
          {phase === 'choose' && (
            <ModeSelector
              key="choose"
              onSelect={(m) => (m === 'ai' ? startAiMode() : startManualMode())}
            />
          )}

          {phase === 'processing' && (
            <ProcessingLoader
              key="processing"
              progress={processingProgress}
              message={processingMessage}
            />
          )}

          {phase === 'curate' && (
            <motion.div
              key="curate"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col"
            >
              {/* Top bar */}
              <div
                className="shrink-0 px-6 py-4 flex items-center justify-between border-b border-muted-border/10"
                style={{
                  background: 'linear-gradient(180deg, rgba(247,241,241,0.95) 0%, rgba(247,241,241,0.8) 100%)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div className="flex items-center gap-4">
                  <h1
                    className="text-xl font-bold text-deep-brown"
                    style={{ fontFamily: 'var(--font-family-headline)' }}
                  >
                    סינון תמונות
                  </h1>
                  <span className="text-sm text-warm-gray">
                    {selectedPhotos.length} נבחרו מתוך {photos.length}
                  </span>
                </div>

                {aiCuratedRef.current && (
                  <div className="flex items-center bg-surface-container-high rounded-full p-1 gap-0.5">
                    <button
                      onClick={() => handleModeSwitch('ai')}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                        mode === 'ai'
                          ? 'bg-white text-deep-brown shadow-md'
                          : 'text-warm-gray hover:text-deep-brown'
                      }`}
                    >
                      <Icon name="auto_awesome" size={16} className={mode === 'ai' ? 'text-sage' : ''} />
                      בסיוע AI
                    </button>
                    <button
                      onClick={() => handleModeSwitch('manual')}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                        mode === 'manual'
                          ? 'bg-white text-deep-brown shadow-md'
                          : 'text-warm-gray hover:text-deep-brown'
                      }`}
                    >
                      <Icon name="touch_app" size={16} className={mode === 'manual' ? 'text-sage' : ''} />
                      ידני
                    </button>
                  </div>
                )}
              </div>

              {/* Split view */}
              <div className="flex-1 flex min-h-0 overflow-hidden" dir="rtl">
                {/* Right column — Selected */}
                <div className="flex-1 flex flex-col min-h-0 border-l border-muted-border/10">
                  <div
                    className="shrink-0 px-5 py-3 flex items-center gap-2 border-b border-muted-border/8"
                    style={{
                      background: 'linear-gradient(135deg, rgba(142,137,115,0.06) 0%, rgba(247,241,241,0.5) 100%)',
                    }}
                  >
                    <div className="w-2 h-2 rounded-full bg-sage" />
                    <span className="text-sm font-semibold text-deep-brown">באלבום</span>
                    <span className="text-xs text-warm-gray mr-1">({selectedPhotos.length})</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4">
                    <LayoutGroup id="selected">
                      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
                        <AnimatePresence mode="popLayout">
                          {selectedPhotos.map((p) => (
                            <PhotoTile key={p.id} photo={p} side="selected" onSwap={handleSwap} />
                          ))}
                        </AnimatePresence>
                      </div>
                    </LayoutGroup>
                    {selectedPhotos.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full text-center py-20">
                        <Icon name="photo_library" size={48} className="text-outline-variant/30 mb-3" />
                        <p className="text-sm text-warm-gray">אין תמונות נבחרות</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Left column — Removed */}
                <div className="w-[320px] lg:w-[380px] xl:w-[420px] flex flex-col min-h-0 bg-surface-container-lowest/50">
                  <div
                    className="shrink-0 px-5 py-3 flex items-center gap-2 border-b border-muted-border/8"
                    style={{
                      background: 'linear-gradient(135deg, rgba(200,195,185,0.08) 0%, rgba(247,241,241,0.4) 100%)',
                    }}
                  >
                    <div className="w-2 h-2 rounded-full bg-warm-gray/40" />
                    <span className="text-sm font-semibold text-on-surface-variant">מחוץ לאלבום</span>
                    <span className="text-xs text-warm-gray mr-1">({removedPhotos.length})</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3">
                    <LayoutGroup id="removed">
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                        <AnimatePresence mode="popLayout">
                          {removedPhotos.map((p) => (
                            <PhotoTile key={p.id} photo={p} side="removed" onSwap={handleSwap} />
                          ))}
                        </AnimatePresence>
                      </div>
                    </LayoutGroup>
                    {removedPhotos.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full text-center py-16">
                        <Icon name="filter_list_off" size={36} className="text-outline-variant/20 mb-2" />
                        <p className="text-xs text-warm-gray">כל התמונות נבחרו</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom bar */}
              <div
                className="shrink-0 px-6 py-4 flex items-center justify-between border-t border-muted-border/10"
                style={{
                  background: 'linear-gradient(0deg, rgba(247,241,241,0.98) 0%, rgba(247,241,241,0.9) 100%)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1.5 text-sage">
                    <Icon name="check_circle" filled size={18} />
                    <span className="font-semibold">{selectedPhotos.length}</span>
                    <span className="text-warm-gray">נבחרו</span>
                  </div>
                  {removedPhotos.length > 0 && (
                    <div className="flex items-center gap-1.5 text-warm-gray">
                      <span>·</span>
                      <span>{removedPhotos.length} סוננו</span>
                    </div>
                  )}
                </div>

                <motion.button
                  whileHover={{ scale: 1.01, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleContinue}
                  disabled={selectedPhotos.length < 2}
                  className={`px-10 py-3.5 rounded-xl font-semibold text-base transition-all duration-300 ${
                    selectedPhotos.length < 2
                      ? 'bg-surface-container-high text-on-surface-variant/30 cursor-not-allowed'
                      : 'text-white shadow-lg'
                  }`}
                  style={selectedPhotos.length >= 2 ? {
                    background: 'linear-gradient(135deg, #605c48 0%, #8E8973 100%)',
                    boxShadow: '0 8px 24px rgba(96, 92, 72, 0.25), 0 2px 8px rgba(96, 92, 72, 0.15)',
                  } : undefined}
                >
                  המשך
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </ProductLayout>
    </PageTransition>
  )
}
