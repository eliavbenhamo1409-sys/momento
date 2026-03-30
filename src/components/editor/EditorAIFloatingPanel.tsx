import { useState } from 'react'
import { motion } from 'motion/react'
import { useUIStore } from '../../store/uiStore'
import LoadingButton from '../shared/LoadingButton'
import Icon from '../shared/Icon'

const quickActions = ['תאורה', 'חדות', 'איזון צבע', 'שיפור פנים', 'הסרת רעש']

interface Props {
  imageSrc: string
}

export default function EditorAIFloatingPanel({ imageSrc }: Props) {
  const addToast = useUIStore((s) => s.addToast)
  const [activeChips, setActiveChips] = useState<string[]>([])
  const [freeText, setFreeText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const toggleChip = (label: string) => {
    setActiveChips((s) =>
      s.includes(label) ? s.filter((x) => x !== label) : [...s, label],
    )
  }

  const handleImprove = async () => {
    setIsProcessing(true)
    await new Promise((r) => setTimeout(r, 2000))
    setIsProcessing(false)
    addToast('התמונה שופרה בהצלחה', 'success')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="absolute top-2 end-2 z-30 w-[min(18rem,calc(100%-0.75rem))] max-h-[min(24rem,70vh)] overflow-y-auto no-scrollbar bg-surface-container-lowest rounded-xl shadow-[0_10px_30px_rgba(90,80,70,0.2)] border border-outline-variant/20 p-4"
      dir="rtl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon name="auto_awesome" filled size={20} className="text-primary" />
        <h3
          className="font-bold text-on-surface text-sm"
          style={{ fontFamily: 'var(--font-family-headline)' }}
        >
          שיפור תמונה חכם
        </h3>
      </div>

      <div className="w-full aspect-square max-h-24 rounded-lg overflow-hidden bg-surface-container mb-3">
        <img src={imageSrc} alt="" className="w-full h-full object-cover" />
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {quickActions.map((label) => {
          const on = activeChips.includes(label)
          return (
            <button
              key={label}
              type="button"
              onClick={() => toggleChip(label)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                on
                  ? 'bg-primary-fixed text-on-primary-fixed'
                  : 'bg-surface-container text-secondary hover:bg-primary-fixed/60'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold text-secondary uppercase tracking-wider block pr-0.5">
          מה תרצה לשפר?
        </label>
        <input
          type="text"
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          placeholder="למשל: להבהיר פנים ולרכך רקע"
          className="w-full bg-surface-container-high border-none rounded-lg text-sm px-3 py-2 placeholder:text-outline focus:ring-2 focus:ring-primary/20 transition-all outline-none"
        />
        <LoadingButton
          type="button"
          onClick={handleImprove}
          loading={isProcessing}
          loadingLabel="משפר..."
          disabled={activeChips.length === 0 && !freeText.trim()}
          className="w-full py-2.5 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:bg-primary-container transition-all flex items-center justify-center gap-2"
        >
          <Icon name="magic_button" size={18} />
          שפר עם AI
        </LoadingButton>
      </div>
    </motion.div>
  )
}
