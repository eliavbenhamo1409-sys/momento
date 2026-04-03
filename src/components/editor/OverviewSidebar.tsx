import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useEditorStore } from '../../store/editorStore'
import { useUIStore } from '../../store/uiStore'
import { PREDEFINED_BG_COLORS } from '../../lib/constants'
import Icon from '../shared/Icon'

const PANEL_SPRING = { type: 'spring' as const, stiffness: 500, damping: 35, mass: 0.7 }

interface SelectedPhoto {
  spreadId: string
  slotId: string
  spreadIndex: number
  photoUrl: string
  photoId: string
}

interface Props {
  selectedPhoto: SelectedPhoto | null
  spreadsCount: number
  onReplace: () => void
  onRemove: () => void
  onNavigate: () => void
  onStartSwap: () => void
  onClose: () => void
}

function SidebarBtn({
  icon,
  label,
  active,
  danger,
  disabled,
  onClick,
}: {
  icon: string
  label: string
  active?: boolean
  danger?: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      type="button"
      whileHover={disabled ? undefined : { scale: 1.04 }}
      whileTap={disabled ? undefined : { scale: 0.94 }}
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-2xl flex items-center gap-3 py-2.5 px-3 transition-all duration-200 outline-none text-right ${
        disabled
          ? 'opacity-30 cursor-not-allowed'
          : danger
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

function BgColorPanel({ spreadId, onClose }: { spreadId: string; onClose: () => void }) {
  const setSpreadBgColor = useEditorStore((s) => s.setSpreadBgColor)
  const setAllSpreadsBgColor = useEditorStore((s) => s.setAllSpreadsBgColor)
  const addToast = useUIStore((s) => s.addToast)
  const [lastApplied, setLastApplied] = useState<string | null>(null)

  const apply = (color: string) => {
    setSpreadBgColor(spreadId, color)
    setLastApplied(color)
    addToast('הרקע עודכן', 'success')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-2.5"
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-on-surface" style={{ fontFamily: 'var(--font-family-headline)' }}>
          צבע רקע
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
            onClick={() => apply(bg.value)}
            className={`aspect-square rounded-lg border shadow-sm transition-shadow ${
              lastApplied === bg.value
                ? 'ring-2 ring-primary ring-offset-1 ring-offset-white border-primary/30'
                : 'border-black/[0.06] hover:shadow-md'
            }`}
            style={{ background: bg.gradient }}
            title={bg.label}
          />
        ))}
      </div>

      {lastApplied && (
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setAllSpreadsBgColor(lastApplied)
            addToast('הרקע הוחל על כל האלבום', 'success')
          }}
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
  selectedPhoto,
  spreadsCount,
  onReplace,
  onRemove,
  onNavigate,
  onStartSwap,
  onClose,
}: Props) {
  const addSpread = useEditorStore((s) => s.addSpread)
  const deleteSpread = useEditorStore((s) => s.deleteSpread)
  const addToast = useUIStore((s) => s.addToast)

  const [showBgPanel, setShowBgPanel] = useState(false)
  const hasPhoto = !!selectedPhoto

  const handleDeleteSpread = useCallback(() => {
    if (!selectedPhoto) return
    const spreadId = selectedPhoto.spreadId
    if (spreadsCount <= 1) {
      addToast('לא ניתן למחוק את העמוד האחרון')
      return
    }
    deleteSpread(spreadId)
    addToast('העמוד נמחק')
  }, [selectedPhoto, spreadsCount, deleteSpread, addToast])

  const handleAddSpread = useCallback(() => {
    addSpread()
    addToast('נוסף דף ריק', 'success')
  }, [addSpread, addToast])

  const handleGenerateBg = useCallback(() => {
    if (!selectedPhoto) return
    useEditorStore.getState().setCurrentSpread(selectedPhoto.spreadIndex)
    onClose()
    setTimeout(() => {
      useEditorStore.setState({ sidebarMode: 'ai' })
    }, 100)
  }, [selectedPhoto, onClose])

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
        {/* Photo preview area */}
        <div className="px-3 pt-3 pb-2">
          <AnimatePresence mode="wait">
            {hasPhoto ? (
              <motion.div
                key={selectedPhoto.slotId}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.2 }}
                className="relative rounded-xl overflow-hidden aspect-[4/3] bg-surface-container-low"
              >
                <img
                  src={selectedPhoto.photoUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-black/50 backdrop-blur-sm rounded-md text-[8px] text-white/90 font-medium">
                  עמוד {selectedPhoto.spreadIndex * 2 + 1}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-xl aspect-[4/3] bg-black/[0.02] border border-dashed border-black/[0.08] flex flex-col items-center justify-center gap-1.5"
              >
                <Icon name="touch_app" size={22} className="text-secondary/25" />
                <span className="text-[10px] text-secondary/35 font-medium">
                  העבר עכבר על תמונה
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-2.5 pb-2.5">
          <div className="flex flex-col gap-0.5">
            {/* Photo-specific actions */}
            <div className="mb-0.5">
              <span className="text-[9px] text-secondary/40 font-bold px-1 mb-0.5 block">תמונה</span>
            </div>
            <SidebarBtn
              icon="swap_horiz"
              label="החלף תמונה"
              disabled={!hasPhoto}
              onClick={onReplace}
            />
            <SidebarBtn
              icon="compare_arrows"
              label="העבר תמונה"
              disabled={!hasPhoto}
              onClick={onStartSwap}
            />
            <SidebarBtn
              icon="delete_outline"
              label="הסר תמונה"
              danger
              disabled={!hasPhoto}
              onClick={onRemove}
            />
            <SidebarBtn
              icon="open_in_full"
              label="עבור לעמוד"
              disabled={!hasPhoto}
              onClick={onNavigate}
            />

            <SidebarSeparator />

            {/* Spread actions */}
            <div className="mb-0.5">
              <span className="text-[9px] text-secondary/40 font-bold px-1 mb-0.5 block">עמוד</span>
            </div>
            <SidebarBtn
              icon="palette"
              label="צבע רקע"
              active={showBgPanel}
              disabled={!selectedPhoto}
              onClick={() => setShowBgPanel((v) => !v)}
            />
            <SidebarBtn
              icon="auto_awesome"
              label="רקע AI"
              disabled={!selectedPhoto}
              onClick={handleGenerateBg}
            />

            <AnimatePresence>
              {showBgPanel && selectedPhoto && (
                <div className="mt-1 mb-1">
                  <BgColorPanel
                    key="bg-panel"
                    spreadId={selectedPhoto.spreadId}
                    onClose={() => setShowBgPanel(false)}
                  />
                </div>
              )}
            </AnimatePresence>

            <SidebarSeparator />

            {/* Album actions */}
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
              disabled={!selectedPhoto || spreadsCount <= 1}
              onClick={handleDeleteSpread}
            />
          </div>
        </div>
      </div>
    </motion.aside>
  )
}
