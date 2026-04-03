import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import PageTransition from '../components/shared/PageTransition'
import ProductLayout from '../components/layout/ProductLayout'
import Icon from '../components/shared/Icon'
import { useAlbumStore } from '../store/albumStore'
import { useEditorStore } from '../store/editorStore'
import { generateAlbum } from '../lib/albumGenerator'
import { buildFallbackSpreads } from '../lib/photoPlacer'

const STAGE_LABELS = [
  { headline: 'מסנן וממיין תמונות', subtext: 'מזהה פנים, סצנות ואיכות' },
  { headline: 'מדרג תמונות', subtext: 'שומר רק את הרגעים הטובים ביותר' },
  { headline: 'ממיין לפי תאריך ומשבץ', subtext: 'בוחר תבנית מתאימה לכל עמוד' },
  { headline: 'ממקם תמונות בעמודים', subtext: 'שיבוץ חכם לפי גודל וכיוון' },
  { headline: 'בודק חיתוכי פנים', subtext: 'מוודא שכל הפרצופים נראים' },
  { headline: 'מרכיב את האלבום', subtext: 'נגיעות אחרונות' },
]

function Particle({ delay }: { delay: number }) {
  const drift = Math.random() * 20 - 10
  return (
    <motion.div
      initial={{ opacity: 0.3, y: 0, x: 0 }}
      animate={{ opacity: 0, y: -40, x: drift }}
      transition={{ duration: 2, delay, ease: 'easeOut' }}
      className="absolute w-1 h-1 rounded-full bg-sage/40"
      style={{ bottom: '20%', left: `${40 + Math.random() * 20}%` }}
    />
  )
}

function AnimatedDots() {
  return (
    <span
      className="inline-flex flex-row items-center gap-1 ms-1.5 align-middle"
      dir="ltr"
      aria-hidden
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block size-1 rounded-full bg-deep-brown/50 shrink-0"
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{
            duration: 1.15,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.18,
          }}
        />
      ))}
    </span>
  )
}

export default function GenerationScreen() {
  const navigate = useNavigate()
  const [stageIndex, setStageIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [statusMessage, setStatusMessage] = useState('מתחיל לעבד את התמונות שלך')
  const [particles, setParticles] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)
  const [resultStats, setResultStats] = useState<{ spreads: number; photos: number } | null>(null)

  const hasStartedRef = useRef(false)

  const stage = STAGE_LABELS[stageIndex] ?? STAGE_LABELS[0]

  const showNotification = useCallback((text: string) => {
    setStatusMessage(text)
  }, [])

  const runGeneration = useCallback(async () => {
    const { photos, config, vibeReferences, setPhotoScores, setCuratedSet, setPeopleRoster, photoScores, curatedSet, photoDateLookup } = useAlbumStore.getState()
    const { setSpreads } = useEditorStore.getState()

    if (photos.length === 0) {
      setError('לא נמצאו תמונות. חזרו לשלב ההעלאה.')
      return
    }

    const referenceDataUrls = vibeReferences.map((r) => r.dataUrl)

    const dateLookupMap = new Map(
      Object.entries(photoDateLookup).map(([id, ts]) => [id, new Date(ts)]),
    )

    let preScored: import('../types').PreScoredData | undefined
    if (curatedSet !== null && photoScores.length > 0) {
      preScored = { allScores: photoScores, curated: curatedSet, dateLookup: dateLookupMap }
    } else if (curatedSet !== null) {
      preScored = { curated: curatedSet, dateLookup: dateLookupMap }
    }

    try {
      const result = await generateAlbum(photos, config, (stage, pct, msg) => {
        setStageIndex(stage)
        setProgress(pct)
        if (msg) showNotification(msg)
      }, referenceDataUrls, preScored)

      setSpreads(result.spreads)
      setPhotoScores(result.analyses)
      setCuratedSet(result.curated)
      setPeopleRoster(result.peopleRoster)

      setResultStats({
        spreads: result.spreads.length,
        photos: result.curated.totalSelected,
      })
      setIsComplete(true)
    } catch (err) {
      console.error('Generation failed:', err)

      try {
        const { photos, config } = useAlbumStore.getState()
        const fallback = buildFallbackSpreads(photos, config.pages)
        useEditorStore.getState().setSpreads(fallback)

        setResultStats({ spreads: fallback.length, photos: photos.length })
        showNotification('השתמשנו בפריסה אוטומטית')
        setIsComplete(true)
      } catch {
        setError('אירעה שגיאה. אנא נסו שוב.')
      }
    }
  }, [showNotification])

  useEffect(() => {
    if (hasStartedRef.current) return
    hasStartedRef.current = true
    runGeneration()
  }, [runGeneration])

  useEffect(() => {
    const interval = setInterval(() => {
      setParticles((p) => [...p.slice(-6), Date.now()])
    }, 800)
    return () => clearInterval(interval)
  }, [])

  return (
    <PageTransition>
      <ProductLayout currentStep="generating" showSteps={!isComplete}>
        <div className="h-full flex items-center justify-center ambient-bg">
          <div className="max-w-md w-full flex flex-col items-center text-center -mt-[5%] px-6">
            <AnimatePresence mode="wait">
              {error ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-6"
                >
                  <div className="w-[100px] h-[100px] rounded-full bg-error/10 flex items-center justify-center">
                    <Icon name="error" filled size={48} className="text-error" />
                  </div>
                  <h1
                    className="text-2xl font-bold text-deep-brown"
                    style={{ fontFamily: 'var(--font-family-headline)' }}
                  >
                    {error}
                  </h1>
                  <button
                    onClick={() => navigate('/upload')}
                    className="mt-4 px-8 py-3 bg-primary text-on-primary rounded-xl font-semibold hover:opacity-90 transition-all"
                  >
                    חזרה להעלאה
                  </button>
                </motion.div>
              ) : isComplete ? (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.45, ease: [0.175, 0.885, 0.32, 1.275] }}
                    className="w-[100px] h-[100px] rounded-full bg-white flex items-center justify-center editorial-shadow"
                  >
                    <Icon name="check_circle" filled size={48} className="text-sage" />
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl font-bold text-deep-brown"
                    style={{ fontFamily: 'var(--font-family-headline)' }}
                  >
                    האלבום שלך מוכן
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-warm-gray"
                  >
                    {resultStats
                      ? `יצרנו אלבום עם ${resultStats.spreads * 2} עמודים מ-${resultStats.photos} תמונות`
                      : 'האלבום שלך מוכן לעריכה'}
                  </motion.p>

                  <motion.button
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    onClick={() => navigate('/editor')}
                    className="mt-4 px-12 py-4 bg-primary text-on-primary rounded-xl text-lg font-semibold shadow-lg hover:opacity-90 active:scale-[0.98] transition-all"
                  >
                    צפה באלבום
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key="generating"
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-8 w-full"
                >
                  <div className="relative w-[112px] h-[112px]">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center animate-soft-pulse editorial-shadow relative z-10">
                      <motion.span
                        className="block rounded-full border-[2.5px] border-sage/25 border-t-sage"
                        style={{ width: 44, height: 44 }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.35, repeat: Infinity, ease: 'linear' }}
                        aria-hidden
                      />
                    </div>
                    <div className="absolute inset-0 rounded-full bg-sage/8 blur-2xl -z-10" />
                    {particles.map((p) => (
                      <Particle key={p} delay={0} />
                    ))}
                  </div>

                  <div className="space-y-3">
                    <AnimatePresence mode="wait">
                      <motion.h1
                        key={stage.headline}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.4, ease: 'easeInOut' }}
                        className="text-2xl md:text-3xl font-bold text-deep-brown"
                        style={{ fontFamily: 'var(--font-family-headline)' }}
                      >
                        {stage.headline}
                      </motion.h1>
                    </AnimatePresence>
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={stage.subtext}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35, delay: 0.08, ease: 'easeInOut' }}
                        className="text-warm-gray"
                      >
                        {stage.subtext}
                      </motion.p>
                    </AnimatePresence>
                    <p
                      className="text-sm text-deep-brown/70 leading-relaxed max-w-[22rem] mx-auto pt-1"
                      style={{ fontFamily: 'var(--font-family-body)' }}
                    >
                      לכו תעשו לכם קפה… כשתחזרו, האלבום יהיה מוכן. מוזמנים גם לעבור לטאב אחר — התהליך ממשיך
                      ברקע.
                    </p>
                  </div>

                  <div className="w-full max-w-sm space-y-4">
                    <div className="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden">
                      <div
                        className="h-full shimmer-bar rounded-full"
                        style={{
                          width: `${progress}%`,
                          transition: 'width 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
                        }}
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex flex-wrap gap-2" dir="ltr">
                        {STAGE_LABELS.map((s, i) => (
                          <span
                            key={s.headline}
                            className={`w-2 h-2 rounded-full transition-all ${
                              i < stageIndex
                                ? 'bg-sage'
                                : i === stageIndex
                                  ? 'bg-sage animate-pulse scale-125'
                                  : 'bg-surface-container-highest'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-warm-gray font-medium">{progress}%</span>
                    </div>
                  </div>

                  <div className="h-10 flex items-center justify-center">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={statusMessage}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.35, ease: 'easeInOut' }}
                        className="px-5 py-2.5 bg-surface-container-lowest rounded-xl shadow-md text-sm text-deep-brown"
                      >
                        {statusMessage}<AnimatedDots />
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </ProductLayout>
    </PageTransition>
  )
}
