import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useEditorStore } from '../../store/editorStore'
import { useUIStore } from '../../store/uiStore'
import { generateCustomBackground, generateCustomBackgroundsPerSpread, imageUrlToDataUrl } from '../../lib/openai'
import { PREDEFINED_BG_COLORS } from '../../lib/constants'
import Icon from '../shared/Icon'

type Target = 'spread' | 'left' | 'right'
type AIBackgroundTab = 'gallery' | 'ai'

const TARGETS: { id: Target; label: string; icon: string; ratio: '16:9' | '1:1' }[] = [
  { id: 'spread', label: 'כל הדף', icon: 'panorama', ratio: '16:9' },
  { id: 'right', label: 'עמוד ימין', icon: 'crop_portrait', ratio: '1:1' },
  { id: 'left', label: 'עמוד שמאל', icon: 'crop_portrait', ratio: '1:1' },
]

const QUICK_PROMPTS = [
  { label: 'חוף ים', prompt: 'חוף ים טרופי עם חול לבן ומים בצבע טורקיז, קונכיות על החול' },
  { label: 'שקיעה', prompt: 'שקיעה זהובה מעל האוקיינוס עם עננים צבעוניים' },
  { label: 'יער', prompt: 'יער ירוק עם אור שמש מסנן בין העצים, אווירה קסומה' },
  { label: 'פרחים', prompt: 'שדה פרחי בר צבעוניים ברוח קלה' },
  { label: 'שיש', prompt: 'משטח שיש לבן עם עורקי זהב אלגנטיים' },
  { label: 'כוכבים', prompt: 'שמיים זרועי כוכבים בלילה ברור עם שביל החלב' },
]

export default function AIBackgroundPanel({
  onClose,
  standalone,
  defaultTab = 'gallery',
}: {
  onClose: () => void
  standalone?: boolean
  /** When opening from overview "רקע AI", start on the AI generator tab */
  defaultTab?: AIBackgroundTab
}) {
  const setSpreadGeneratedBg = useEditorStore((s) => s.setSpreadGeneratedBg)
  const applySpreadGeneratedBgToAll = useEditorStore((s) => s.applySpreadGeneratedBgToAll)
  const batchApplySpreadGeneratedBgs = useEditorStore((s) => s.batchApplySpreadGeneratedBgs)
  const addToast = useUIStore((s) => s.addToast)
  const [activeTab, setActiveTab] = useState<AIBackgroundTab>(defaultTab)
  const [prompt, setPrompt] = useState('')
  const [target, setTarget] = useState<Target>('spread')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isBatchStyling, setIsBatchStyling] = useState(false)
  const [batchProgress, setBatchProgress] = useState<{ done: number; total: number } | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const selectedTarget = TARGETS.find((t) => t.id === target)!
  const isBusy = isGenerating || isBatchStyling

  const collectPagePhotosForSpread = useCallback(async (spreadIndex: number): Promise<string[]> => {
    const { spreads } = useEditorStore.getState()
    const spread = spreads[spreadIndex]
    if (!spread?.design) return []

    const photoEls = spread.design.elements.filter(
      (el): el is import('../../types').PhotoElement => el.type === 'photo' && !!(el as import('../../types').PhotoElement).photoUrl,
    )

    const filtered = target === 'spread'
      ? photoEls
      : target === 'left'
        ? photoEls.filter((el) => el.x < 50)
        : photoEls.filter((el) => el.x >= 50)

    const urls = filtered.map((el) => el.photoUrl!).slice(0, 4)
    const dataUrls = await Promise.all(urls.map((u) => imageUrlToDataUrl(u)))
    return dataUrls.filter((u): u is string => u !== null)
  }, [target])

  const collectPagePhotos = useCallback(async (): Promise<string[]> => {
    const idx = useEditorStore.getState().currentSpreadIndex
    return collectPagePhotosForSpread(idx)
  }, [collectPagePhotosForSpread])

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      addToast('כתבו תיאור לרקע שתרצו')
      return
    }

    setIsGenerating(true)
    setPreviewUrl(null)

    try {
      const pagePhotos = await collectPagePhotos()
      const url = await generateCustomBackground(prompt, selectedTarget.ratio, pagePhotos)

      if (url) {
        setPreviewUrl(url)
      } else {
        addToast('לא הצלחנו ליצור רקע, נסו שוב', 'error')
      }
    } catch {
      addToast('שגיאה ביצירת הרקע', 'error')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleApply = () => {
    if (!previewUrl) return
    setSpreadGeneratedBg(previewUrl, target, 1)
    addToast('הרקע הוחל בהצלחה', 'success')
    onClose()
  }

  const handleApplySameToAll = () => {
    if (!previewUrl) return
    applySpreadGeneratedBgToAll(previewUrl, target, 1)
    addToast('אותו הרקע הוחל על כל הדפים', 'success')
    onClose()
  }

  const handleApplyStyledToAll = async () => {
    if (!prompt.trim()) {
      addToast('כתבו תיאור לרקע לפני יצירה לכל הדפים')
      return
    }
    const { spreads } = useEditorStore.getState()
    const indices = spreads.map((sp, i) => (sp.design ? i : -1)).filter((i) => i >= 0)
    if (indices.length === 0) {
      addToast('אין דפים לעדכון')
      return
    }

    setIsBatchStyling(true)
    setBatchProgress({ done: 0, total: indices.length })
    try {
      const rows = await generateCustomBackgroundsPerSpread(
        prompt,
        selectedTarget.ratio,
        indices,
        collectPagePhotosForSpread,
        (done, total) => setBatchProgress({ done, total }),
      )
      const items = rows
        .filter((r): r is { spreadIndex: number; url: string } => r.url != null)
        .map((r) => ({ spreadIndex: r.spreadIndex, bgUrl: r.url, target, opacity: 1 }))
      if (items.length === 0) {
        addToast('לא נוצרו רקעים, נסו שוב', 'error')
        return
      }
      batchApplySpreadGeneratedBgs(items)
      addToast(
        items.length === indices.length
          ? 'נוצר רקע ייחודי בסגנון זה לכל דף'
          : 'חלק מהרקעים נוצרו — בדקו את הדפים',
        'success',
      )
      onClose()
    } catch {
      addToast('שגיאה ביצירת הרקעים', 'error')
    } finally {
      setIsBatchStyling(false)
      setBatchProgress(null)
    }
  }

  const handleApplyColor = (color: string, applyToAll = false) => {
    if (applyToAll) {
      useEditorStore.setState((state) => {
        const newSpreads = state.spreads.map((s) => {
          if (!s.design) return s
          return { ...s, design: { ...s.design, background: { ...s.design.background, color } } }
        })
        return { spreads: newSpreads }
      })
      addToast('הרקע הוחל על כל האלבום', 'success')
    } else {
      useEditorStore.setState((state) => {
        const newSpreads = [...state.spreads]
        const s = { ...newSpreads[state.currentSpreadIndex] }
        const d = { ...s.design! }
        const bg = { ...d.background, color }
        d.background = bg
        s.design = d
        newSpreads[state.currentSpreadIndex] = s
        return { spreads: newSpreads }
      })
      addToast('צבע הרקע שונה', 'success')
    }
  }

  const [lastAppliedColor, setLastAppliedColor] = useState<string | null>(null)

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={standalone
        ? 'w-full rounded-2xl bg-white/95 backdrop-blur-xl border border-black/[0.06] shadow-[0_8px_32px_rgba(45,40,35,0.12)] p-4 pointer-events-auto'
        : 'absolute md:right-full md:top-0 md:me-3 max-md:bottom-full max-md:mb-3 max-md:right-0 w-80 max-w-[min(20rem,calc(100vw-3rem))] max-h-[80vh] overflow-y-auto no-scrollbar rounded-2xl bg-white/95 backdrop-blur-xl border border-black/[0.06] shadow-[0_8px_32px_rgba(45,40,35,0.12)] p-4 pointer-events-auto'
      }
      dir="rtl"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
            <Icon name="palette" size={16} className="text-primary" />
          </div>
          <h3
            className="text-sm font-bold text-on-surface"
            style={{ fontFamily: 'var(--font-family-headline)' }}
          >
            רקעים
          </h3>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-full flex items-center justify-center text-secondary/50 hover:text-on-surface hover:bg-surface-container-high/70 transition-colors"
        >
          <Icon name="close" size={16} />
        </button>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 mb-4 p-1 bg-surface-container-low rounded-xl">
          <button
          onClick={() => setActiveTab('gallery')}
          className={`flex-1 py-2 rounded-lg text-[11px] font-semibold transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'gallery'
              ? 'bg-white text-on-surface shadow-sm'
              : 'text-secondary/50 hover:text-on-surface'
          }`}
        >
          <Icon name="palette" size={14} filled={activeTab === 'gallery'} />
          רקעים מוכנים
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex-1 py-2 rounded-lg text-[11px] font-semibold transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'ai'
              ? 'bg-white text-on-surface shadow-sm'
              : 'text-secondary/50 hover:text-on-surface'
          }`}
        >
          <Icon name="auto_awesome" size={14} filled={activeTab === 'ai'} />
          יצירה עם AI
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'gallery' ? (
          <motion.div
            key="gallery"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            {/* Colors section */}
            <div className="mb-4">
              <span className="text-[10px] text-secondary/50 font-semibold tracking-wide mb-2 block">
                צבעים וגרדיאנטים
              </span>
              <div className="grid grid-cols-4 gap-2">
                {PREDEFINED_BG_COLORS.map((bg) => (
                  <button
                    key={bg.value}
                    onClick={() => { handleApplyColor(bg.value); setLastAppliedColor(bg.value) }}
                    className={`btn-press flex flex-col items-center gap-1 group ${lastAppliedColor === bg.value ? 'ring-2 ring-primary ring-offset-1 ring-offset-white rounded-xl' : ''}`}
                  >
                    <div
                      className="w-full aspect-square rounded-xl border border-black/[0.06] shadow-sm group-hover:shadow-md transition-shadow"
                      style={{ background: bg.gradient }}
                    />
                    <span className="text-[9px] text-secondary/50 font-medium group-hover:text-on-surface transition-colors">
                      {bg.label}
                    </span>
                  </button>
                ))}
              </div>

              {lastAppliedColor && (
                <button
                  onClick={() => handleApplyColor(lastAppliedColor, true)}
                  className="btn-press w-full mt-3 py-2 bg-primary/10 hover:bg-primary/15 text-primary rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Icon name="select_all" size={14} />
                  החל על כל האלבום
                </button>
              )}
            </div>

            {/* Placeholder for uploaded backgrounds */}
            <div className="rounded-xl border-2 border-dashed border-black/[0.06] p-4 flex flex-col items-center gap-2 text-center">
              <Icon name="add_photo_alternate" size={24} className="text-secondary/30" />
              <span className="text-[11px] text-secondary/40 font-medium leading-snug">
                בקרוב — תוכלו להעלות רקעים משלכם
              </span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="ai"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            {/* Target selector */}
            <div className="flex gap-1.5 mb-4">
              {TARGETS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  disabled={isBusy}
                  onClick={() => setTarget(t.id)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl text-[10px] font-semibold transition-all duration-200 ${
                    target === t.id
                      ? 'bg-primary/10 text-primary shadow-sm'
                      : 'text-secondary/50 hover:text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  <Icon name={t.icon} size={16} filled={target === t.id} />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Quick prompts */}
            <div className="mb-3">
              <span className="text-[10px] text-secondary/50 font-semibold tracking-wide mb-1.5 block">השראה מהירה</span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((qp) => (
                  <button
                    key={qp.label}
                    type="button"
                    disabled={isBusy}
                    onClick={() => setPrompt(qp.prompt)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                      prompt === qp.prompt
                        ? 'bg-primary/12 text-primary'
                        : 'bg-surface-container-low text-secondary/60 hover:bg-surface-container-high hover:text-on-surface'
                    }`}
                  >
                    {qp.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt input */}
            <div className="mb-4">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="תארו את הרקע שתרצו... למשל: חוף ים עם קונכיות ומים שקטים"
                rows={3}
                disabled={isBusy}
                className="w-full bg-surface-container-low border-none rounded-xl text-sm px-3 py-2.5 placeholder:text-outline focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none disabled:opacity-50"
              />
            </div>

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={isBusy || !prompt.trim()}
              className="btn-press w-full py-2.5 bg-gradient-to-r from-primary to-primary/80 text-on-primary rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 transition-colors mb-3 shadow-sm"
            >
              {isGenerating ? (
                <>
                  <span className="inline-block animate-spin">
                    <Icon name="progress_activity" size={18} />
                  </span>
                  יוצר רקע...
                </>
              ) : (
                <>
                  <Icon name="auto_awesome" size={18} />
                  צור רקע
                </>
              )}
            </button>

            {/* Hint before any preview — sets expectation */}
            {!previewUrl && (
              <p
                className={`text-[10px] leading-relaxed text-center px-1 mb-1 ${
                  isGenerating ? 'text-secondary/40' : 'text-secondary/55'
                }`}
              >
                {isGenerating
                  ? 'יוצרים תצוגה מקדימה… מיד אחריה יופיעו כאן אפשרויות להחלה על כל האלבום.'
                  : 'לאחר יצירת תצוגה מקדימה יופיעו כאן שתי אפשרויות: להעתיק את אותו הרקע לכל הדפים, או ליצור רקע ייחודי בכל דף לפי אותו תיאור.'}
              </p>
            )}

            {/* Preview + actions (album-wide only after image exists) */}
            <AnimatePresence>
              {previewUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex flex-col gap-4"
                >
                  <div className="flex flex-col gap-1.5">
                    <span
                      className="text-[11px] font-bold text-on-surface/90"
                      style={{ fontFamily: 'var(--font-family-headline)' }}
                    >
                      תצוגה מקדימה
                    </span>
                    <p className="text-[10px] text-secondary/50 leading-snug">
                      לדף שבחרת במבט על. לחיצה על דף אחר ברשת מעדכנת את היעד.
                    </p>
                    <div
                      className="w-full rounded-xl overflow-hidden shadow-md border border-black/[0.06] mt-1"
                      style={{ aspectRatio: selectedTarget.ratio === '16:9' ? '16/9' : '1/1' }}
                    >
                      <img
                        src={previewUrl}
                        alt="תצוגת רקע שנוצרה ב-AI"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Step 1 — current spread */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-semibold text-secondary/60 uppercase tracking-wide">
                      שלב 1 · רק הדף הזה
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleApply}
                        disabled={isBusy}
                        aria-label="החל את הרקע המוצג רק על הדף הנבחר"
                        className="btn-press flex-1 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-sm disabled:opacity-40"
                      >
                        <Icon name="check" size={16} />
                        החל על הדף הזה בלבד
                      </button>
                      <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={isBusy}
                        aria-label="צור תצוגה מקדימה חדשה עם אותו תיאור"
                        className="btn-press px-4 py-2.5 bg-surface-container-low rounded-xl text-sm font-semibold text-secondary/70 flex items-center justify-center gap-1.5 hover:bg-surface-container-high transition-colors disabled:opacity-40 shrink-0"
                      >
                        <Icon name="refresh" size={16} />
                        מחדש
                      </button>
                    </div>
                  </div>

                  <div className="h-px bg-gradient-to-l from-transparent via-black/[0.08] to-transparent" aria-hidden />

                  {/* Step 2 — whole album (revealed only with preview) */}
                  <section
                    role="region"
                    aria-labelledby="ai-bg-album-wide-heading"
                    className="rounded-2xl border border-sage/15 bg-gradient-to-br from-sage/[0.06] to-transparent px-3.5 py-3 flex flex-col gap-2.5"
                  >
                    <h4
                      id="ai-bg-album-wide-heading"
                      className="text-[11px] font-bold text-deep-brown"
                      style={{ fontFamily: 'var(--font-family-headline)' }}
                    >
                      שלב 2 · כל שאר הדפים
                    </h4>
                    <p className="text-[10px] text-secondary/60 leading-relaxed">
                      יש לכם רקע לדוגמה. בחרו איך להרחיב לשאר האלבום (אפשר גם את שני הסוגים בזה אחר זה):
                    </p>
                    <button
                      type="button"
                      onClick={handleApplySameToAll}
                      disabled={isBusy}
                      aria-describedby="ai-bg-same-all-desc"
                      className="btn-press w-full py-2.5 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-2 bg-white border border-black/[0.08] text-deep-brown shadow-[0_2px_12px_rgba(45,40,35,0.06)] hover:border-sage/25 hover:bg-white transition-colors disabled:opacity-40 disabled:pointer-events-none text-right px-3"
                    >
                      <Icon name="copy_all" size={18} className="text-sage shrink-0" aria-hidden />
                      <span className="flex-1 leading-snug">אותה תמונה בדיוק לכל הדפים</span>
                    </button>
                    <p id="ai-bg-same-all-desc" className="text-[9px] text-secondary/45 leading-snug -mt-1 mb-0 px-0.5">
                      העתקה פשוטה של התצוגה המקדימה — מהיר ואחיד.
                    </p>
                    <button
                      type="button"
                      onClick={handleApplyStyledToAll}
                      disabled={!prompt.trim() || isBusy}
                      aria-describedby="ai-bg-styled-all-desc"
                      className="btn-press w-full py-2.5 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-2 bg-sage text-white shadow-[0_4px_16px_rgba(142,137,115,0.28)] hover:bg-sage/92 transition-colors disabled:opacity-40 disabled:pointer-events-none text-right px-3"
                    >
                      <Icon name="auto_awesome" size={18} className="shrink-0 opacity-95" aria-hidden />
                      <span className="flex-1 leading-snug">
                        {isBatchStyling && batchProgress
                          ? `יוצר רקעים… ${batchProgress.done} מתוך ${batchProgress.total}`
                          : 'רקע אחר בכל דף — באותו סגנון (AI)'}
                      </span>
                    </button>
                    <p id="ai-bg-styled-all-desc" className="text-[9px] text-secondary/45 leading-snug -mt-1 px-0.5">
                      לפי התיאור בשדה למעלה: יצירה נפרדת לכל דף, מגוון בקומפוזיציה.
                      {!prompt.trim() && (
                        <span className="block mt-1 text-amber-800/80">נדרש תיאור בשדה למעלה.</span>
                      )}
                    </p>
                  </section>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
