import { motion } from 'motion/react'
import { useEditorStore } from '../../store/editorStore'
import { useUIStore } from '../../store/uiStore'
import { LAYOUT_TEMPLATES } from '../../lib/layoutGrammar'
import Icon from '../shared/Icon'

interface LayoutOption {
  id: string
  name: string
  slots: number
  preview: { page: 'L' | 'R'; x: number; y: number; w: number; h: number }[]
}

function buildPreview(template: typeof LAYOUT_TEMPLATES[0]): LayoutOption['preview'] {
  return template.slots
    .filter((s) => !s.id.endsWith('-mirror'))
    .map((s) => ({
      page: s.page === 'left' ? 'L' as const : 'R' as const,
      x: s.x,
      y: s.y,
      w: s.width,
      h: s.height,
    }))
}

const LAYOUT_OPTIONS: LayoutOption[] = LAYOUT_TEMPLATES
  .filter((t) => t.category !== 'cover' && t.category !== 'closing')
  .map((t) => ({
    id: t.id,
    name: t.name,
    slots: t.slots.filter((s) => !s.id.endsWith('-mirror')).length,
    preview: buildPreview(t),
  }))

function MiniPreview({ layout, isActive }: { layout: LayoutOption; isActive: boolean }) {
  return (
    <div
      className={`relative w-full aspect-[2/1] rounded-lg overflow-hidden transition-all duration-200 ${
        isActive
          ? 'ring-2 ring-primary ring-offset-1 ring-offset-white'
          : 'ring-1 ring-black/[0.06]'
      }`}
      style={{ backgroundColor: '#f5f0eb' }}
    >
      <div className="absolute inset-0 flex">
        {/* Left page */}
        <div className="relative w-1/2 h-full">
          {layout.preview
            .filter((s) => s.page === 'L')
            .map((s, i) => (
              <div
                key={`l-${i}`}
                className="absolute bg-primary/20 border border-primary/10 rounded-[2px]"
                style={{
                  left: `${s.x}%`, top: `${s.y}%`,
                  width: `${s.w}%`, height: `${s.h}%`,
                }}
              />
            ))}
        </div>
        {/* Gutter line */}
        <div className="w-px bg-black/[0.06]" />
        {/* Right page */}
        <div className="relative w-1/2 h-full">
          {layout.preview
            .filter((s) => s.page === 'R')
            .map((s, i) => (
              <div
                key={`r-${i}`}
                className="absolute bg-primary/20 border border-primary/10 rounded-[2px]"
                style={{
                  left: `${s.x}%`, top: `${s.y}%`,
                  width: `${s.w}%`, height: `${s.h}%`,
                }}
              />
            ))}
        </div>
      </div>
    </div>
  )
}

export default function LayoutPickerPanel({ onClose }: { onClose: () => void }) {
  const currentTemplate = useEditorStore((s) => s.spreads[s.currentSpreadIndex]?.templateId ?? '')
  const changeSpreadTemplate = useEditorStore((s) => s.changeSpreadTemplate)
  const addToast = useUIStore((s) => s.addToast)

  // Group by slot count
  const grouped = new Map<number, LayoutOption[]>()
  for (const opt of LAYOUT_OPTIONS) {
    const arr = grouped.get(opt.slots) ?? []
    arr.push(opt)
    grouped.set(opt.slots, arr)
  }
  const sortedGroups = [...grouped.entries()].sort((a, b) => a[0] - b[0])

  const handleSelect = (templateId: string, slots: number) => {
    changeSpreadTemplate(templateId)
    addToast(`הפריסה שונתה — ${slots} תמונות`, 'success')
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="absolute md:right-full md:top-0 md:me-3 max-md:bottom-full max-md:mb-3 max-md:right-0 w-72 max-w-[min(18rem,calc(100vw-3rem))] max-h-[70vh] overflow-y-auto no-scrollbar rounded-2xl bg-white/95 backdrop-blur-xl border border-black/[0.06] shadow-[0_8px_32px_rgba(45,40,35,0.12)] p-4 pointer-events-auto"
      dir="rtl"
    >
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-sm font-bold text-on-surface"
          style={{ fontFamily: 'var(--font-family-headline)' }}
        >
          בחר פריסה
        </h3>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-full flex items-center justify-center text-secondary/50 hover:text-on-surface hover:bg-surface-container-high/70 transition-colors"
        >
          <Icon name="close" size={16} />
        </button>
      </div>

      <div className="flex flex-col gap-5">
        {sortedGroups.map(([count, options]) => (
          <div key={count}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-semibold text-secondary/60 tracking-wide">
                {count} {count === 1 ? 'תמונה' : 'תמונות'}
              </span>
              <div className="flex-1 h-px bg-black/[0.04]" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {options.map((opt) => (
                <motion.button
                  key={opt.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleSelect(opt.id, opt.slots)}
                  className="flex flex-col gap-1.5 p-1.5 rounded-xl hover:bg-surface-container-low/60 transition-colors"
                >
                  <MiniPreview layout={opt} isActive={currentTemplate === opt.id} />
                  <span className="text-[10px] text-secondary/60 font-medium truncate w-full text-center">
                    {opt.name}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
