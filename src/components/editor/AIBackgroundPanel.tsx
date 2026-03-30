import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useEditorStore } from '../../store/editorStore'
import { useUIStore } from '../../store/uiStore'
import { generateCustomBackground, imageUrlToDataUrl } from '../../lib/openai'
import Icon from '../shared/Icon'

type Target = 'spread' | 'left' | 'right'

const TARGETS: { id: Target; label: string; icon: string; ratio: '16:9' | '1:1' }[] = [
  { id: 'spread', label: 'כל הדף', icon: 'panorama', ratio: '16:9' },
  { id: 'left', label: 'עמוד שמאל', icon: 'crop_portrait', ratio: '1:1' },
  { id: 'right', label: 'עמוד ימין', icon: 'crop_portrait', ratio: '1:1' },
]

const QUICK_PROMPTS = [
  { label: 'חוף ים', prompt: 'חוף ים טרופי עם חול לבן ומים בצבע טורקיז, קונכיות על החול' },
  { label: 'שקיעה', prompt: 'שקיעה זהובה מעל האוקיינוס עם עננים צבעוניים' },
  { label: 'יער', prompt: 'יער ירוק עם אור שמש מסנן בין העצים, אווירה קסומה' },
  { label: 'פרחים', prompt: 'שדה פרחי בר צבעוניים ברוח קלה' },
  { label: 'שיש', prompt: 'משטח שיש לבן עם עורקי זהב אלגנטיים' },
  { label: 'כוכבים', prompt: 'שמיים זרועי כוכבים בלילה ברור עם שביל החלב' },
]

export default function AIBackgroundPanel({ onClose }: { onClose: () => void }) {
  const setSpreadGeneratedBg = useEditorStore((s) => s.setSpreadGeneratedBg)
  const addToast = useUIStore((s) => s.addToast)
  const [prompt, setPrompt] = useState('')
  const [target, setTarget] = useState<Target>('spread')
  const [isGenerating, setIsGenerating] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const selectedTarget = TARGETS.find((t) => t.id === target)!

  const collectPagePhotos = useCallback(async (): Promise<string[]> => {
    const { spreads, currentSpreadIndex } = useEditorStore.getState()
    const spread = spreads[currentSpreadIndex]
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
    addToast('הרקע הוחל בהצלחה ✨', 'success')
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="absolute md:right-full md:top-0 md:me-3 max-md:bottom-full max-md:mb-3 max-md:right-0 w-80 max-w-[min(20rem,calc(100vw-3rem))] max-h-[80vh] overflow-y-auto no-scrollbar rounded-2xl bg-white/95 backdrop-blur-xl border border-black/[0.06] shadow-[0_8px_32px_rgba(45,40,35,0.12)] p-4 pointer-events-auto"
      dir="rtl"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
            <Icon name="auto_awesome" size={16} className="text-primary" />
          </div>
          <h3
            className="text-sm font-bold text-on-surface"
            style={{ fontFamily: 'var(--font-family-headline)' }}
          >
            רקע בעזרת AI
          </h3>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-full flex items-center justify-center text-secondary/50 hover:text-on-surface hover:bg-surface-container-high/70 transition-colors"
        >
          <Icon name="close" size={16} />
        </button>
      </div>

      {/* Target selector */}
      <div className="flex gap-1.5 mb-4">
        {TARGETS.map((t) => (
          <button
            key={t.id}
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
          disabled={isGenerating}
          className="w-full bg-surface-container-low border-none rounded-xl text-sm px-3 py-2.5 placeholder:text-outline focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none disabled:opacity-50"
        />
      </div>

      {/* Generate button */}
      <motion.button
        whileHover={{ scale: isGenerating ? 1 : 1.02 }}
        whileTap={{ scale: isGenerating ? 1 : 0.98 }}
        onClick={handleGenerate}
        disabled={isGenerating || !prompt.trim()}
        className="w-full py-2.5 bg-gradient-to-r from-primary to-primary/80 text-on-primary rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 transition-all mb-4 shadow-sm"
      >
        {isGenerating ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
            >
              <Icon name="progress_activity" size={18} />
            </motion.div>
            יוצר רקע...
          </>
        ) : (
          <>
            <Icon name="auto_awesome" size={18} />
            צור רקע
          </>
        )}
      </motion.button>

      {/* Preview */}
      <AnimatePresence>
        {previewUrl && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex flex-col gap-3"
          >
            <span className="text-[10px] text-secondary/50 font-semibold tracking-wide">תצוגה מקדימה</span>
            <div
              className="w-full rounded-xl overflow-hidden shadow-md border border-black/[0.04]"
              style={{ aspectRatio: selectedTarget.ratio === '16:9' ? '16/9' : '1/1' }}
            >
              <img
                src={previewUrl}
                alt="רקע שנוצר"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleApply}
                className="flex-1 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-sm"
              >
                <Icon name="check" size={16} />
                החל רקע
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-4 py-2.5 bg-surface-container-low rounded-xl text-sm font-semibold text-secondary/70 flex items-center justify-center gap-1.5 hover:bg-surface-container-high transition-colors"
              >
                <Icon name="refresh" size={16} />
                חדש
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
