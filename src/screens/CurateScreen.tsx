import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence, LayoutGroup } from 'motion/react'
import PageTransition from '../components/shared/PageTransition'
import ProductLayout from '../components/layout/ProductLayout'
import Icon from '../components/shared/Icon'
import { useAlbumStore } from '../store/albumStore'
import { runPhotoScoring } from '../lib/albumGenerator'
import { curatePhotos } from '../lib/photoScorer'
import type { PhotoScore, CuratedPhotoSet, RankedPhoto } from '../types'

type CurateMode = 'ai' | 'manual'

interface PhotoCard {
  id: string
  thumbnailUrl: string
  score: PhotoScore | null
  reason?: string
}

function ScoringLoader({ progress, message }: { progress: number; message: string }) {
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

        <div className="space-y-2">
          <h1
            className="text-2xl font-bold text-deep-brown"
            style={{ fontFamily: 'var(--font-family-headline)' }}
          >
            סורק את התמונות שלך
          </h1>
          <AnimatePresence mode="wait">
            <motion.p
              key={message}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-warm-gray text-sm"
            >
              {message}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="w-full max-w-xs">
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
    </motion.div>
  )
}

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
        className={`absolute top-1.5 ${side === 'selected' ? 'left-1.5' : 'right-1.5'} w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg ${
          side === 'selected'
            ? 'bg-red-500/80 text-white backdrop-blur-sm'
            : 'bg-sage/90 text-white backdrop-blur-sm'
        }`}
        title={side === 'selected' ? 'הסר מהאלבום' : 'הוסף לאלבום'}
      >
        <Icon
          name={side === 'selected' ? 'arrow_back' : 'arrow_forward'}
          size={16}
        />
      </motion.button>

      {quality > 0 && (
        <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
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

export default function CurateScreen() {
  const navigate = useNavigate()
  const photos = useAlbumStore((s) => s.photos)
  const config = useAlbumStore((s) => s.config)

  const [mode, setMode] = useState<CurateMode>('ai')
  const [isScoring, setIsScoring] = useState(true)
  const [scoringProgress, setScoringProgress] = useState(0)
  const [scoringMessage, setScoringMessage] = useState('מתחיל...')

  const [scores, setScores] = useState<PhotoScore[]>([])
  const [dateLookupRecord, setDateLookupRecord] = useState<Record<string, number>>({})

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set())
  const [removedReasons, setRemovedReasons] = useState<Map<string, string>>(new Map())

  const hasStartedRef = useRef(false)
  const aiCuratedRef = useRef<CuratedPhotoSet | null>(null)

  const photoMap = useMemo(
    () => new Map(photos.map((p) => [p.id, p])),
    [photos],
  )
  const scoreMap = useMemo(
    () => new Map(scores.map((s) => [s.photoId, s])),
    [scores],
  )

  const runScoring = useCallback(async () => {
    try {
      const result = await runPhotoScoring(photos, (_stage, pct, msg) => {
        setScoringProgress(pct)
        if (msg) setScoringMessage(msg)
      })
      setScores(result.scores)
      setDateLookupRecord(result.dateLookup)

      const curated = curatePhotos(result.scores, config)
      aiCuratedRef.current = curated

      const selIds = new Set(curated.selected.map((r) => r.photoId))
      const remIds = new Set(curated.removed.map((r) => r.photoId))
      const reasons = new Map(curated.removed.map((r) => [r.photoId, r.reason]))

      setSelectedIds(selIds)
      setRemovedIds(remIds)
      setRemovedReasons(reasons)
      setIsScoring(false)
    } catch (err) {
      console.error('Scoring failed:', err)
      const allIds = new Set(photos.map((p) => p.id))
      setSelectedIds(allIds)
      setRemovedIds(new Set())
      setIsScoring(false)
    }
  }, [photos, config])

  useEffect(() => {
    if (hasStartedRef.current) return
    hasStartedRef.current = true
    runScoring()
  }, [runScoring])

  const handleModeSwitch = useCallback((newMode: CurateMode) => {
    setMode(newMode)
    if (newMode === 'manual') {
      setSelectedIds(new Set(photos.map((p) => p.id)))
      setRemovedIds(new Set())
    } else if (aiCuratedRef.current) {
      const curated = aiCuratedRef.current
      setSelectedIds(new Set(curated.selected.map((r) => r.photoId)))
      setRemovedIds(new Set(curated.removed.map((r) => r.photoId)))
    }
  }, [photos])

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

  const handleContinue = useCallback(() => {
    const selectedScores = scores.filter((s) => selectedIds.has(s.photoId))
    const ranked: RankedPhoto[] = selectedScores
      .sort((a, b) => b.overallQuality - a.overallQuality)
      .map((s, i) => ({
        photoId: s.photoId,
        score: s,
        rank: i,
        role: i === 0 ? 'cover' as const : i < 3 ? 'hero' as const : 'standard' as const,
      }))

    const removed = scores
      .filter((s) => removedIds.has(s.photoId))
      .map((s) => ({
        photoId: s.photoId,
        reason: removedReasons.get(s.photoId) || 'הוסר ידנית',
      }))

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

    const store = useAlbumStore.getState()
    store.setPhotoScores(scores)
    store.setCuratedSet(curatedSet)
    store.setPhotoDateLookup(dateLookupRecord)

    navigate('/configure')
  }, [scores, selectedIds, removedIds, removedReasons, dateLookupRecord, photos.length, navigate])

  const selectedPhotos: PhotoCard[] = useMemo(
    () =>
      photos
        .filter((p) => selectedIds.has(p.id))
        .map((p) => ({
          id: p.id,
          thumbnailUrl: p.thumbnailUrl,
          score: scoreMap.get(p.id) ?? null,
        })),
    [photos, selectedIds, scoreMap],
  )

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

  if (photos.length === 0) {
    navigate('/upload')
    return null
  }

  return (
    <PageTransition>
      <ProductLayout currentStep="curate" showSteps>
        <AnimatePresence mode="wait">
          {isScoring ? (
            <ScoringLoader
              key="loader"
              progress={scoringProgress}
              message={scoringMessage}
            />
          ) : (
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

                {/* Mode toggle */}
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
                    <span className="text-sm font-semibold text-deep-brown">
                      באלבום
                    </span>
                    <span className="text-xs text-warm-gray mr-1">
                      ({selectedPhotos.length})
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4">
                    <LayoutGroup id="selected">
                      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
                        <AnimatePresence mode="popLayout">
                          {selectedPhotos.map((p) => (
                            <PhotoTile
                              key={p.id}
                              photo={p}
                              side="selected"
                              onSwap={handleSwap}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    </LayoutGroup>
                    {selectedPhotos.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full text-center py-20">
                        <Icon name="photo_library" size={48} className="text-outline-variant/30 mb-3" />
                        <p className="text-sm text-warm-gray">
                          אין תמונות נבחרות
                        </p>
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
                    <span className="text-sm font-semibold text-on-surface-variant">
                      מחוץ לאלבום
                    </span>
                    <span className="text-xs text-warm-gray mr-1">
                      ({removedPhotos.length})
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3">
                    <LayoutGroup id="removed">
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                        <AnimatePresence mode="popLayout">
                          {removedPhotos.map((p) => (
                            <PhotoTile
                              key={p.id}
                              photo={p}
                              side="removed"
                              onSwap={handleSwap}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    </LayoutGroup>
                    {removedPhotos.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full text-center py-16">
                        <Icon name="filter_list_off" size={36} className="text-outline-variant/20 mb-2" />
                        <p className="text-xs text-warm-gray">
                          כל התמונות נבחרו
                        </p>
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
