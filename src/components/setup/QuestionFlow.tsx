import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useNavigate } from 'react-router'
import { useAlbumStore } from '../../store/albumStore'
import { getFamiliesForConfig } from '../../lib/designFamilies'
import type { DesignFamily } from '../../types'
import Icon from '../shared/Icon'

const VIBE_EXAMPLES = [
  'רומנטי, רך, חמים, עם גוונים פסטליים כמו שקיעה על חוף הים',
  'מודרני, מינימליסטי, נקי, עם הרבה אוויר ולבן',
  'חם ואינטימי, כמו ערב בבית עם נרות וקפה',
  'שמח וצבעוני, אנרגטי, חגיגי, כמו מסיבה',
  'קלאסי ויוקרתי, אלגנטי, עם זהב ושחור',
  'טבעי ורגוע, ירוק וחום, כמו גן בוטני',
]

const MAX_REFERENCES = 5

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function QuestionFlow() {
  const navigate = useNavigate()
  const { config, setConfigField, vibeReferences, addVibeReference, removeVibeReference } = useAlbumStore()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [placeholderIdx, setPlaceholderIdx] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % VIBE_EXAMPLES.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const vibeText = config.vibeText || ''

  const suggestedFamilies = useMemo(
    () => getFamiliesForConfig(config.type, config.mood, config.style),
    [config.type, config.mood, config.style],
  )

  const bgMode = config.backgroundMode || 'white'
  const canProceed = bgMode === 'white' || vibeText.trim().length >= 3 || vibeReferences.length > 0

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const remaining = MAX_REFERENCES - vibeReferences.length
    const toProcess = Array.from(files).slice(0, remaining)

    for (const file of toProcess) {
      if (!file.type.startsWith('image/')) continue
      try {
        const dataUrl = await fileToDataUrl(file)
        addVibeReference({
          id: `ref-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          dataUrl,
          name: file.name,
        })
      } catch (err) {
        console.error('Failed to read reference image:', err)
      }
    }
  }, [vibeReferences.length, addVibeReference])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col h-full justify-start overflow-y-auto py-6 scrollbar-thin"
    >
      <div className="mb-6">
        <h2
          className="text-2xl font-bold text-deep-brown mb-2"
          style={{ fontFamily: 'var(--font-family-headline)' }}
        >
          עיצוב הרקע
        </h2>
        <p className="text-warm-gray text-sm leading-relaxed">
          בחרו רקע לבן נקי או תנו ל-AI ליצור רקעים ייחודיים.
        </p>
      </div>

      {/* ── Background Mode Toggle ───────────────────────── */}

      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setConfigField('backgroundMode', 'white')}
          className={`flex-1 rounded-xl p-4 border-2 transition-all duration-200 text-right ${
            bgMode === 'white'
              ? 'border-sage bg-sage/[0.04] shadow-md shadow-sage/10'
              : 'border-outline-variant/15 bg-surface-container-lowest hover:border-outline-variant/30'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center ${
              bgMode === 'white' ? 'border-sage bg-white' : 'border-outline-variant/20 bg-white'
            }`}>
              <Icon name="crop_square" size={18} className={bgMode === 'white' ? 'text-sage' : 'text-warm-gray/40'} />
            </div>
            <span className="text-sm font-bold text-deep-brown">רקע לבן</span>
          </div>
          <p className="text-[11px] text-warm-gray leading-relaxed">
            נקי, מקצועי, קלאסי — התמונות מדברות בעד עצמן.
          </p>
        </button>

        <button
          onClick={() => setConfigField('backgroundMode', 'ai-generated')}
          className={`flex-1 rounded-xl p-4 border-2 transition-all duration-200 text-right ${
            bgMode === 'ai-generated'
              ? 'border-sage bg-sage/[0.04] shadow-md shadow-sage/10'
              : 'border-outline-variant/15 bg-surface-container-lowest hover:border-outline-variant/30'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              bgMode === 'ai-generated' ? 'bg-sage/10' : 'bg-surface-container-low'
            }`}>
              <Icon name="auto_awesome" size={18} className={bgMode === 'ai-generated' ? 'text-sage' : 'text-warm-gray/40'} />
            </div>
            <span className="text-sm font-bold text-deep-brown">רקע AI</span>
          </div>
          <p className="text-[11px] text-warm-gray leading-relaxed">
            רקעים ייחודיים שנוצרו ב-AI לפי הוייב שלכם.
          </p>
        </button>
      </div>

      {/* ── AI Options (only when ai-generated is selected) ── */}

      <AnimatePresence>
        {bgMode === 'ai-generated' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="relative mb-3">
              <textarea
                ref={textareaRef}
                value={vibeText}
                onChange={(e) => setConfigField('vibeText', e.target.value)}
                placeholder={VIBE_EXAMPLES[placeholderIdx]}
                rows={3}
                dir="rtl"
                className="w-full rounded-xl bg-surface-container-lowest border-2 border-outline-variant/20 
                  focus:border-sage/50 focus:ring-2 focus:ring-sage/10 
                  px-5 py-3.5 text-deep-brown text-sm leading-relaxed resize-none
                  placeholder:text-warm-gray/40 transition-all duration-200
                  font-medium"
                style={{ fontFamily: 'var(--font-family-body)' }}
              />
            </div>

            <div className="flex flex-wrap gap-2 mb-5">
              {[
                { label: 'רומנטי', text: 'רומנטי, רך, חמים, פסטלי, שקיעה' },
                { label: 'מודרני', text: 'מודרני, מינימליסטי, נקי, עם הרבה אוויר' },
                { label: 'חמים', text: 'חמים, אינטימי, נרות וקפה, בז׳ וחום' },
                { label: 'טבעי', text: 'טבעי, ירוק, רגוע, גן בוטני, טרי' },
                { label: 'יוקרתי', text: 'יוקרתי, אלגנטי, קרם וזהב, סטודיו' },
                { label: 'ים', text: 'ים, חוף, תכלת וחול, רוגע, אופק' },
              ].map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => setConfigField('vibeText', chip.text)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                    vibeText === chip.text
                      ? 'bg-sage/15 text-sage border border-sage/30'
                      : 'bg-surface-container-low text-warm-gray border border-transparent hover:bg-sage/8 hover:text-sage/80'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Reference Images */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <Icon name="image" size={16} className="text-warm-gray/50" />
                <span className="text-xs font-bold text-deep-brown">
                  תמונות השראה
                </span>
                <span className="text-[10px] text-warm-gray/40">
                  (עד {MAX_REFERENCES})
                </span>
              </div>

              <div className="flex gap-3 items-start">
                <AnimatePresence mode="popLayout">
                  {vibeReferences.map((ref) => (
                    <motion.div
                      key={ref.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                      className="relative group shrink-0"
                    >
                      <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-outline-variant/15 shadow-sm">
                        <img src={ref.dataUrl} alt={ref.name} className="w-full h-full object-cover" />
                      </div>
                      <button
                        onClick={() => removeVibeReference(ref.id)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-deep-brown/80 text-white 
                          flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity
                          hover:bg-red-500 shadow-sm"
                      >
                        <Icon name="close" size={12} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {vibeReferences.length < MAX_REFERENCES && (
                  <motion.button
                    layout
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`w-16 h-16 rounded-lg border-2 border-dashed flex flex-col items-center justify-center
                      transition-all duration-200 shrink-0 cursor-pointer
                      ${isDragging
                        ? 'border-sage bg-sage/10 scale-105'
                        : 'border-outline-variant/25 bg-surface-container-lowest hover:border-sage/40 hover:bg-sage/[0.03]'
                      }`}
                  >
                    <Icon name="add" size={20} className={isDragging ? 'text-sage' : 'text-warm-gray/35'} />
                  </motion.button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) handleFiles(e.target.files)
                  e.target.value = ''
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Design Family ────────────────────────────────── */}

      <h3
        className="text-sm font-bold text-deep-brown mb-3"
        style={{ fontFamily: 'var(--font-family-headline)' }}
      >
        סגנון עיצוב
      </h3>

      <div className="grid grid-cols-2 gap-3 mb-5">
        {suggestedFamilies.map((family, idx) => (
          <FamilyCard
            key={family.id}
            family={family}
            isSelected={config.designFamily === family.id}
            isRecommended={idx === 0}
            onSelect={() => setConfigField('designFamily', family.id)}
          />
        ))}
      </div>

      {/* ── CTA ──────────────────────────────────────────── */}

      <button
        onClick={() => {
          if (!config.designFamily && suggestedFamilies.length > 0) {
            setConfigField('designFamily', suggestedFamilies[0].id)
          }
          if (!config.type) setConfigField('type', 'general')
          if (!config.style) setConfigField('style', 'modern')
          if (!config.mood) setConfigField('mood', 'romantic')
          if (config.people.length === 0) setConfigField('people', ['couple'])
          navigate('/generating')
        }}
        disabled={!canProceed}
        className="w-full py-4 bg-primary text-on-primary rounded-xl text-lg font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 mt-auto shrink-0"
      >
        צור אלבום אוטומטי
      </button>
    </motion.div>
  )
}

// ─── Family Selection Card ───────────────────────────────────────────

const FAMILY_ICONS: Record<string, string> = {
  'contemporary-luxury': 'diamond',
  'japanese-airy': 'spa',
  'soft-personal': 'favorite',
  'parisian-editorial': 'auto_stories',
  'timeless-classic': 'photo_album',
}

const FAMILY_ACCENTS: Record<string, string> = {
  'contemporary-luxury': '#8A8570',
  'japanese-airy': '#A09B8F',
  'soft-personal': '#A89E92',
  'parisian-editorial': '#B8A898',
  'timeless-classic': '#B5A998',
}

function FamilyCard({
  family,
  isSelected,
  isRecommended,
  onSelect,
}: {
  family: DesignFamily
  isSelected: boolean
  isRecommended: boolean
  onSelect: () => void
}) {
  const accent = FAMILY_ACCENTS[family.id] ?? '#8A8570'
  const icon = FAMILY_ICONS[family.id] ?? 'palette'

  return (
    <motion.button
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      onClick={onSelect}
      className={`relative text-right rounded-xl p-4 transition-all duration-200 border-2 ${
        isSelected
          ? 'border-sage bg-sage/[0.04] shadow-md shadow-sage/10'
          : 'border-outline-variant/15 bg-surface-container-lowest hover:border-outline-variant/30 hover:shadow-sm'
      }`}
    >
      {isRecommended && !isSelected && (
        <span className="absolute -top-2 start-3 text-[9px] font-bold text-sage bg-sage/10 px-2 py-0.5 rounded-full">
          מומלץ
        </span>
      )}

      <div className="flex items-start justify-between mb-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${accent}15` }}
        >
          <span style={{ color: accent }}><Icon name={icon} size={18} /></span>
        </div>
        <div
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
            isSelected ? 'border-sage' : 'border-outline-variant/30'
          }`}
        >
          {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-sage" />}
        </div>
      </div>

      <p
        className="text-sm font-bold text-deep-brown mb-1"
        style={{ fontFamily: 'var(--font-family-headline)' }}
      >
        {family.nameHe}
      </p>
      <p className="text-[11px] text-warm-gray leading-relaxed line-clamp-2">
        {family.descriptionHe}
      </p>

      <div className="flex gap-1.5 mt-3">
        {[
          family.composition.symmetry === 'asymmetric' ? 'א-סימטרי' :
          family.composition.symmetry === 'strict' ? 'סימטרי' :
          family.composition.symmetry === 'dynamic' ? 'דינמי' : 'מאוזן',
          family.rhythm.pace === 'slow' ? 'קצב רגוע' :
          family.rhythm.pace === 'fast' ? 'קצב מהיר' : 'קצב בינוני',
        ].map((tag) => (
          <span
            key={tag}
            className="text-[9px] font-medium px-1.5 py-0.5 rounded-full"
            style={{
              color: accent,
              backgroundColor: `${accent}10`,
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </motion.button>
  )
}
