import { useState } from 'react'
import { motion } from 'motion/react'
import { useEditorStore } from '../../store/editorStore'
import { useUIStore } from '../../store/uiStore'
import Icon from '../shared/Icon'

interface FontOption {
  family: string
  label: string
  category: 'hebrew' | 'english' | 'script' | 'serif'
  sampleText: string
}

const FONTS: FontOption[] = [
  // Hebrew
  { family: 'Heebo', label: 'Heebo', category: 'hebrew', sampleText: 'שלום עולם' },
  { family: 'Assistant', label: 'Assistant', category: 'hebrew', sampleText: 'שלום עולם' },
  { family: 'Rubik', label: 'Rubik', category: 'hebrew', sampleText: 'שלום עולם' },
  { family: 'Frank Ruhl Libre', label: 'Frank Ruhl', category: 'hebrew', sampleText: 'שלום עולם' },
  { family: 'Secular One', label: 'Secular One', category: 'hebrew', sampleText: 'שלום עולם' },
  { family: 'Varela Round', label: 'Varela Round', category: 'hebrew', sampleText: 'שלום עולם' },
  { family: 'Suez One', label: 'Suez One', category: 'hebrew', sampleText: 'שלום עולם' },

  // Hebrew Script / Handwriting
  { family: 'Amatic SC', label: 'Amatic SC', category: 'script', sampleText: 'אהבה ושמחה' },
  { family: 'Karantina', label: 'Karantina', category: 'script', sampleText: 'אהבה ושמחה' },

  // English Script (connected)
  { family: 'Great Vibes', label: 'Great Vibes', category: 'script', sampleText: 'Love & Joy' },
  { family: 'Dancing Script', label: 'Dancing Script', category: 'script', sampleText: 'Love & Joy' },
  { family: 'Pacifico', label: 'Pacifico', category: 'script', sampleText: 'Love & Joy' },
  { family: 'Satisfy', label: 'Satisfy', category: 'script', sampleText: 'Love & Joy' },
  { family: 'Sacramento', label: 'Sacramento', category: 'script', sampleText: 'Love & Joy' },
  { family: 'Allura', label: 'Allura', category: 'script', sampleText: 'Love & Joy' },
  { family: 'Alex Brush', label: 'Alex Brush', category: 'script', sampleText: 'Love & Joy' },

  // English Sans
  { family: 'Plus Jakarta Sans', label: 'Jakarta Sans', category: 'english', sampleText: 'Hello World' },
  { family: 'Montserrat', label: 'Montserrat', category: 'english', sampleText: 'Hello World' },
  { family: 'Quicksand', label: 'Quicksand', category: 'english', sampleText: 'Hello World' },
  { family: 'Raleway', label: 'Raleway', category: 'english', sampleText: 'Hello World' },

  // English Serif
  { family: 'Playfair Display', label: 'Playfair', category: 'serif', sampleText: 'Hello World' },
  { family: 'Cormorant Garamond', label: 'Cormorant', category: 'serif', sampleText: 'Hello World' },
]

const CATEGORIES = [
  { id: 'hebrew' as const, label: 'עברית' },
  { id: 'script' as const, label: 'כתב מחובר' },
  { id: 'english' as const, label: 'אנגלית' },
  { id: 'serif' as const, label: 'סריף' },
]

export default function TextInsertPanel({ onClose }: { onClose: () => void }) {
  const addTextToSpread = useEditorStore((s) => s.addTextToSpread)
  const addToast = useUIStore((s) => s.addToast)
  const [text, setText] = useState('')
  const [selectedFont, setSelectedFont] = useState('Great Vibes')
  const [activeCategory, setActiveCategory] = useState<FontOption['category']>('script')

  const filteredFonts = FONTS.filter((f) => f.category === activeCategory)

  const handleInsert = () => {
    if (!text.trim()) {
      addToast('הכנס טקסט לפני הוספה')
      return
    }
    addTextToSpread(text, selectedFont)
    addToast('הטקסט נוסף לעמוד', 'success')
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="absolute md:right-full md:top-0 md:me-3 max-md:bottom-full max-md:mb-3 max-md:right-0 w-72 max-w-[min(18rem,calc(100vw-3rem))] max-h-[75vh] overflow-y-auto no-scrollbar rounded-2xl bg-white/95 backdrop-blur-xl border border-black/[0.06] shadow-[0_8px_32px_rgba(45,40,35,0.12)] p-4 pointer-events-auto"
      dir="rtl"
    >
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-sm font-bold text-on-surface"
          style={{ fontFamily: 'var(--font-family-headline)' }}
        >
          הוסף טקסט
        </h3>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-full flex items-center justify-center text-secondary/50 hover:text-on-surface hover:bg-surface-container-high/70 transition-colors"
        >
          <Icon name="close" size={16} />
        </button>
      </div>

      {/* Text input */}
      <div className="mb-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="הכנס טקסט כאן..."
          rows={2}
          className="w-full bg-surface-container-low border-none rounded-xl text-sm px-3 py-2.5 placeholder:text-outline focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
          style={{ fontFamily: selectedFont }}
        />
      </div>

      {/* Preview */}
      {text && (
        <div className="mb-4 p-4 rounded-xl bg-surface-container-lowest border border-black/[0.04] text-center">
          <span
            className="text-lg text-on-surface leading-relaxed"
            style={{ fontFamily: selectedFont }}
          >
            {text}
          </span>
        </div>
      )}

      {/* Category tabs */}
      <div className="flex gap-1 mb-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
              activeCategory === cat.id
                ? 'bg-primary/10 text-primary'
                : 'text-secondary/50 hover:text-on-surface hover:bg-surface-container-low'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Font list */}
      <div className="flex flex-col gap-1.5 mb-4 max-h-[12rem] overflow-y-auto no-scrollbar">
        {filteredFonts.map((font) => (
          <motion.button
            key={font.family}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedFont(font.family)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
              selectedFont === font.family
                ? 'bg-primary/8 ring-1 ring-primary/20'
                : 'hover:bg-surface-container-low'
            }`}
          >
            <span
              className="text-sm text-on-surface"
              style={{ fontFamily: font.family }}
            >
              {font.sampleText}
            </span>
            <span className="text-[9px] text-secondary/40 font-medium">
              {font.label}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Insert button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleInsert}
        disabled={!text.trim()}
        className="w-full py-2.5 bg-primary text-on-primary rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
      >
        <Icon name="add" size={18} />
        הוסף לעמוד
      </motion.button>
    </motion.div>
  )
}
