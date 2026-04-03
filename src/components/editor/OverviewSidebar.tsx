import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useEditorStore } from '../../store/editorStore'
import { useUIStore } from '../../store/uiStore'
import { PREDEFINED_BG_COLORS } from '../../lib/constants'
import Icon from '../shared/Icon'

const PANEL_SPRING = { type: 'spring' as const, stiffness: 500, damping: 35, mass: 0.7 }

export type OverviewMode = 'idle' | 'replace' | 'swap-source' | 'swap-target' | 'remove' | 'bg-color' | 'bg-ai' | 'bg-ai-panel' | 'delete-spread'

interface Props {
  activeMode: OverviewMode
  spreadsCount: number
  onSetMode: (mode: OverviewMode) => void
  onSelectBgColor: (color: string) => void
  onClose: () => void
}

function SidebarBtn({
  icon,
  label,
  active,
  danger,
  onClick,
}: {
  icon: string
  label: string
  active?: boolean
  danger?: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className={`w-full rounded-2xl flex items-center gap-3 py-2.5 px-3 transition-all duration-200 outline-none text-right ${
        danger
          ? active
            ? 'bg-error text-on-error shadow-sm'
            : 'text-error/70 hover:bg-error/8'
          : active
            ? 'bg-deep-brown text-white shadow-[0_4px_14px_rgba(47,46,43,0.25)]'
            : 'text-secondary/80 hover:text-on-surface hover:bg-surface-container-high/60'
      }`}
    >
      <Icon name={icon} size={19} filled={active && !danger} className={active && !danger ? 'text-white' : ''} />
      <span className={`text-[11px] font-semibold leading-none ${
        active && !danger ? 'text-white/90' : danger && active ? 'text-on-error/80' : ''
      }`}>
        {label}
      </span>
    </motion.button>
  )
}

function SidebarSeparator() {
  return (
    <div
      className="w-10 h-px my-1 shrink-0 rounded-full mx-auto"
      style={{ background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.08), transparent)' }}
      aria-hidden
    />
  )
}

function BgColorPanel({ onSelectColor, onApplyAll, onClose }: {
  onSelectColor: (color: string) => void
  onApplyAll: (color: string) => void
  onClose: () => void
}) {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-2.5"
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-on-surface leading-snug" style={{ fontFamily: 'var(--font-family-headline)' }}>
          בחר צבע, אז לחץ על עמוד
        </span>
        <button
          type="button"
          onClick={onClose}
          className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-black/[0.04] transition-colors"
        >
          <Icon name="close" size={14} className="text-secondary/50" />
        </button>
      </div>

      <div className="grid grid-cols-6 gap-1.5">
        {PREDEFINED_BG_COLORS.map((bg) => (
          <motion.button
            key={bg.value}
            type="button"
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => { setSelected(bg.value); onSelectColor(bg.value) }}
            className={`aspect-square rounded-lg border shadow-sm transition-shadow ${
              selected === bg.value
                ? 'ring-2 ring-primary ring-offset-1 ring-offset-white border-primary/30'
                : 'border-black/[0.06] hover:shadow-md'
            }`}
            style={{ background: bg.gradient }}
            title={bg.label}
          />
        ))}
      </div>

      {selected && (
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onApplyAll(selected)}
          className="w-full py-1.5 bg-primary/10 hover:bg-primary/15 text-primary rounded-xl text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors"
        >
          <Icon name="select_all" size={13} />
          החל על כל האלבום
        </motion.button>
      )}
    </motion.div>
  )
}

export default function OverviewSidebar({
  activeMode,
  spreadsCount: _spreadsCount,
  onSetMode,
  onSelectBgColor,
  onClose: _onClose,
}: Props) {
  const addSpread = useEditorStore((s) => s.addSpread)
  const setAllSpreadsBgColor = useEditorStore((s) => s.setAllSpreadsBgColor)
  const addToast = useUIStore((s) => s.addToast)

  const toggle = (mode: OverviewMode) => {
    onSetMode(activeMode === mode ? 'idle' : mode)
  }

  const handleAddSpread = useCallback(() => {
    addSpread()
    addToast('נוסף דף ריק', 'success')
  }, [addSpread, addToast])

  const handleBgApplyAll = useCallback((color: string) => {
    setAllSpreadsBgColor(color)
    addToast('הרקע הוחל על כל האלבום', 'success')
  }, [setAllSpreadsBgColor, addToast])

  return (
    <motion.aside
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ ...PANEL_SPRING }}
      className="fixed z-[55] top-[72px] right-4 md:right-6 bottom-[56px] w-[200px] pointer-events-auto"
      dir="rtl"
    >
      <div className="h-full flex flex-col bg-white/90 backdrop-blur-xl rounded-[22px] border border-black/[0.06] shadow-[0_8px_40px_rgba(45,40,35,0.10)] overflow-hidden">
        {/* Actions */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-2.5 py-3">
          <div className="flex flex-col gap-0.5">
            <div className="mb-0.5">
              <span className="text-[9px] text-secondary/40 font-bold px-1 mb-0.5 block">תמונה</span>
            </div>
            <SidebarBtn
              icon="swap_horiz"
              label="החלף תמונה"
              active={activeMode === 'replace'}
              onClick={() => toggle('replace')}
            />
            <SidebarBtn
              icon="compare_arrows"
              label="העבר תמונה"
              active={activeMode === 'swap-source' || activeMode === 'swap-target'}
              onClick={() => toggle('swap-source')}
            />
            <SidebarBtn
              icon="delete_outline"
              label="הסר תמונה"
              danger
              active={activeMode === 'remove'}
              onClick={() => toggle('remove')}
            />

            <SidebarSeparator />

            <div className="mb-0.5">
              <span className="text-[9px] text-secondary/40 font-bold px-1 mb-0.5 block">עמוד</span>
            </div>
            <SidebarBtn
              icon="palette"
              label="צבע רקע"
              active={activeMode === 'bg-color'}
              onClick={() => toggle('bg-color')}
            />
            <SidebarBtn
              icon="auto_awesome"
              label="רקע AI"
              active={activeMode === 'bg-ai'}
              onClick={() => toggle('bg-ai')}
            />

            <AnimatePresence>
              {activeMode === 'bg-color' && (
                <div className="mt-1 mb-1">
                  <BgColorPanel
                    key="bg-panel"
                    onSelectColor={onSelectBgColor}
                    onApplyAll={handleBgApplyAll}
                    onClose={() => onSetMode('idle')}
                  />
                </div>
              )}
            </AnimatePresence>

            <SidebarSeparator />

            <div className="mb-0.5">
              <span className="text-[9px] text-secondary/40 font-bold px-1 mb-0.5 block">אלבום</span>
            </div>
            <SidebarBtn
              icon="add_circle"
              label="הוסף עמוד"
              onClick={handleAddSpread}
            />
            <SidebarBtn
              icon="delete"
              label="מחק עמוד"
              danger
              active={activeMode === 'delete-spread'}
              onClick={() => toggle('delete-spread')}
            />
          </div>
        </div>
      </div>
    </motion.aside>
  )
}
