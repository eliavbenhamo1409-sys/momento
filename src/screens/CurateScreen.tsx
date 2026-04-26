import { useState, useCallback, useRef, useMemo, useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import { useVirtualizer } from '@tanstack/react-virtual'
import PageTransition from '../components/shared/PageTransition'
import ProductLayout from '../components/layout/ProductLayout'
import Icon from '../components/shared/Icon'
import { useAlbumStore } from '../store/albumStore'
import { runPhotoScoring } from '../lib/albumGenerator'
import { curatePhotos } from '../lib/photoScorer'
import { extractPhotoDate } from '../lib/photoUtils'
import { loadDecorativeFonts } from '../lib/fontLoader'
import type { PhotoScore, CuratedPhotoSet, RankedPhoto } from '../types'

type CurateMode = 'ai' | 'manual'
type Phase = 'choose' | 'processing' | 'curate'

interface PhotoCard {
  id: string
  /** Full-res preview for the grid (thumbnails are ~300px and look soft when scaled). */
  previewUrl: string
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
            מי בוחר מה נכנס?
          </h1>
          <p className="text-warm-gray text-base max-w-md mx-auto leading-relaxed">
            ה-AI שלנו יודע לזהות תמונות מטושטשות וכפילויות — או שתבחרו בעצמכם.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-lg">
          <button
            onClick={() => onSelect('ai')}
            className="btn-press flex flex-col items-center gap-4 p-8 rounded-2xl bg-white ring-1 ring-black/[0.04] text-center transition-shadow hover:shadow-xl group cursor-pointer"
            style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
          >
            <div className="w-16 h-16 rounded-2xl bg-sage/10 flex items-center justify-center group-hover:bg-sage/18 transition-colors">
              <Icon name="auto_awesome" size={32} className="text-sage" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-deep-brown" style={{ fontFamily: 'var(--font-family-headline)' }}>
                תן ל-AI לעשות סדר
              </h2>
              <p className="text-sm text-warm-gray leading-relaxed">
                ינתח, יזהה כפילויות ותמונות מטושטשות, ויבחר את הטובות
              </p>
            </div>
          </button>

          <button
            onClick={() => onSelect('manual')}
            className="btn-press flex flex-col items-center gap-4 p-8 rounded-2xl bg-white ring-1 ring-black/[0.04] text-center transition-shadow hover:shadow-xl group cursor-pointer"
            style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
          >
            <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center group-hover:bg-amber-100/80 transition-colors">
              <Icon name="touch_app" size={32} className="text-amber-700" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-deep-brown" style={{ fontFamily: 'var(--font-family-headline)' }}>
                אני אבחר בעצמי
              </h2>
              <p className="text-sm text-warm-gray leading-relaxed">
                כל התמונות נכנסות — אתם מחליטים מה נשאר ומה יוצא
              </p>
            </div>
          </button>
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
    <div className="fade-scale-in relative group aspect-square rounded-xl overflow-hidden bg-white shadow-sm ring-1 ring-black/[0.04]">
      <img
        src={photo.previewUrl}
        alt=""
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover"
      />

      {isLowQuality && side === 'removed' && (
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent px-2 py-1.5">
          <span className="text-[10px] text-white/90 font-medium">
            {photo.reason || 'איכות נמוכה'}
          </span>
        </div>
      )}

      <button
        onClick={() => onSwap(photo.id)}
        className={`btn-press absolute top-1.5 z-20 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg ${
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
      </button>

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
    </div>
  )
}

/* ─── Virtualized Grid ──────────────────────────────────────────────── */

type BreakpointCols = { minWidthPx: number; cols: number }

function useColumnsFromWidth(widthPx: number, breakpoints: BreakpointCols[]) {
  const sorted = useMemo(
    () => [...breakpoints].sort((a, b) => a.minWidthPx - b.minWidthPx),
    [breakpoints],
  )
  return useMemo(() => {
    let cols = sorted[0]?.cols ?? 1
    for (const bp of sorted) {
      if (widthPx >= bp.minWidthPx) cols = bp.cols
    }
    return Math.max(1, cols)
  }, [sorted, widthPx])
}

function VirtualizedPhotoGrid({
  photos,
  side,
  onSwap,
  paddingPx,
  gapPx,
  breakpoints,
  empty,
}: {
  photos: PhotoCard[]
  side: 'selected' | 'removed'
  onSwap: (id: string) => void
  paddingPx: number
  gapPx: number
  breakpoints: BreakpointCols[]
  empty: ReactNode
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [widthPx, setWidthPx] = useState(0)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const ro = new ResizeObserver(() => {
      setWidthPx(el.clientWidth)
    })
    ro.observe(el)
    setWidthPx(el.clientWidth)

    return () => ro.disconnect()
  }, [])

  const columns = useColumnsFromWidth(widthPx, breakpoints)

  const usableWidth = Math.max(0, widthPx - paddingPx * 2)
  const tileSize = Math.max(64, Math.floor((usableWidth - gapPx * (columns - 1)) / columns))
  const rowHeight = tileSize + gapPx
  const rowCount = Math.ceil(photos.length / columns)

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan: 3,
  })

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto" style={{ padding: paddingPx }}>
      {photos.length === 0 ? (
        empty
      ) : (
        <div style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}>
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const startIndex = virtualRow.index * columns
            const rowPhotos = photos.slice(startIndex, startIndex + columns)

            return (
              <div
                key={virtualRow.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                    gap: gapPx,
                  }}
                >
                  {rowPhotos.map((p) => (
                    <div key={p.id} style={{ width: tileSize, height: tileSize }}>
                      <PhotoTile photo={p} side={side} onSwap={onSwap} />
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─── Default score when curate runs in manual mode (no AI ratings yet) ─── */

function createDefaultManualModeScore(photoId: string, width: number, height: number): PhotoScore {
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

  useEffect(() => {
    void loadDecorativeFonts()
  }, [])

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
        score: createDefaultManualModeScore(p.id, p.width, p.height),
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
        previewUrl: p.fullUrl || p.thumbnailUrl,
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
          previewUrl: p.fullUrl || p.thumbnailUrl,
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
                    background: 'linear-gradient(180deg, rgba(250,250,247,0.95) 0%, rgba(250,250,247,0.8) 100%)',
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
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
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
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
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
                      background: 'linear-gradient(135deg, rgba(139,133,115,0.06) 0%, rgba(250,250,247,0.5) 100%)',
                    }}
                  >
                    <div className="w-2 h-2 rounded-full bg-sage" />
                    <span className="text-sm font-semibold text-deep-brown">באלבום</span>
                    <span className="text-xs text-warm-gray mr-1">({selectedPhotos.length})</span>
                  </div>
                  <VirtualizedPhotoGrid
                    photos={selectedPhotos}
                    side="selected"
                    onSwap={handleSwap}
                    paddingPx={16}
                    gapPx={10}
                    breakpoints={[
                      { minWidthPx: 0, cols: 3 },
                      { minWidthPx: 768, cols: 4 },
                      { minWidthPx: 1024, cols: 5 },
                      { minWidthPx: 1280, cols: 6 },
                    ]}
                    empty={(
                      <div className="flex flex-col items-center justify-center h-full text-center py-20">
                        <Icon name="photo_library" size={48} className="text-outline-variant/30 mb-3" />
                        <p className="text-sm text-warm-gray">אין תמונות נבחרות</p>
                      </div>
                    )}
                  />
                </div>

                {/* Left column — Removed */}
                <div className="w-[320px] lg:w-[380px] xl:w-[420px] flex flex-col min-h-0 bg-surface-container-lowest/50">
                  <div
                    className="shrink-0 px-5 py-3 flex items-center gap-2 border-b border-muted-border/8"
                    style={{
                      background: 'linear-gradient(135deg, rgba(208,204,196,0.08) 0%, rgba(250,250,247,0.4) 100%)',
                    }}
                  >
                    <div className="w-2 h-2 rounded-full bg-warm-gray/40" />
                    <span className="text-sm font-semibold text-on-surface-variant">מחוץ לאלבום</span>
                    <span className="text-xs text-warm-gray mr-1">({removedPhotos.length})</span>
                  </div>
                  <VirtualizedPhotoGrid
                    photos={removedPhotos}
                    side="removed"
                    onSwap={handleSwap}
                    paddingPx={12}
                    gapPx={8}
                    breakpoints={[
                      { minWidthPx: 0, cols: 2 },
                      { minWidthPx: 1024, cols: 3 },
                    ]}
                    empty={(
                      <div className="flex flex-col items-center justify-center h-full text-center py-16">
                        <Icon name="filter_list_off" size={36} className="text-outline-variant/20 mb-2" />
                        <p className="text-xs text-warm-gray">כל התמונות נבחרו</p>
                      </div>
                    )}
                  />
                </div>
              </div>

              {/* Bottom bar */}
              <div
                className="shrink-0 px-6 py-4 flex items-center justify-between border-t border-muted-border/10"
                style={{
                  background: 'linear-gradient(0deg, rgba(250,250,247,0.98) 0%, rgba(250,250,247,0.9) 100%)',
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

                <button
                  onClick={handleContinue}
                  disabled={selectedPhotos.length < 2}
                  className={`btn-press px-10 py-3.5 rounded-xl font-semibold text-base transition-shadow ${
                    selectedPhotos.length < 2
                      ? 'bg-surface-container-high text-on-surface-variant/30 cursor-not-allowed'
                      : 'text-white shadow-lg'
                  }`}
                  style={selectedPhotos.length >= 2 ? {
                    background: '#2D2926',
                    boxShadow: '0 8px 24px rgba(26, 23, 20, 0.2), 0 2px 8px rgba(26, 23, 20, 0.1)',
                  } : undefined}
                >
                  המשך
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </ProductLayout>
    </PageTransition>
  )
}
