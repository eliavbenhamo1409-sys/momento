import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useEditorStore } from '../../store/editorStore'
import { useUIStore } from '../../store/uiStore'
import { useShallow } from 'zustand/react/shallow'
import Icon from '../shared/Icon'
import LayoutPickerPanel from './LayoutPickerPanel'
import TextInsertPanel from './TextInsertPanel'
import AIBackgroundPanel from './AIBackgroundPanel'

type ToolId =
  | 'select'
  | 'replace'
  | 'layout'
  | 'text'
  | 'ai'
  | 'add'
  | 'delete'

interface ToolBtnProps {
  icon: string
  label: string
  active: boolean
  danger?: boolean
  onClick: () => void
}

function ToolBtn({ icon, label, active, danger, onClick }: ToolBtnProps) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className={`relative rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/25 w-full py-2 px-1 ${
        danger
          ? active
            ? 'bg-error text-on-error shadow-sm'
            : 'text-error/60 hover:bg-error/8'
          : active
            ? 'bg-deep-brown text-white shadow-[0_4px_14px_rgba(47,46,43,0.3)]'
            : 'text-secondary/70 hover:text-on-surface hover:bg-surface-container-high/70'
      }`}
    >
      <Icon name={icon} size={20} filled={active && !danger} className={active && !danger ? 'text-white' : ''} />
      <span className={`text-[9px] font-semibold leading-none mt-0.5 ${
        active && !danger ? 'text-white/90' : danger && active ? 'text-on-error/80' : ''
      }`}>
        {label}
      </span>
    </motion.button>
  )
}

function Separator() {
  return (
    <div
      className="w-10 h-px my-0.5 shrink-0 rounded-full mx-auto"
      style={{
        background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.10), transparent)',
      }}
      aria-hidden
    />
  )
}

function PhotoEditPanel() {
  const { selectedPhotoId, spreads, currentSpreadIndex } = useEditorStore(useShallow((s) => ({
    selectedPhotoId: s.selectedPhotoId,
    spreads: s.spreads,
    currentSpreadIndex: s.currentSpreadIndex,
  })))

  const spread = spreads[currentSpreadIndex]
  const slotId = selectedPhotoId?.replace(`${spread?.id}-`, '') ?? ''
  const photoElement = spread?.design?.elements.find(
    (el) => el.type === 'photo' && el.slotId === slotId,
  )
  const hasPhoto = photoElement && 'photoUrl' in photoElement && photoElement.photoUrl

  if (!selectedPhotoId || !hasPhoto) return null

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      className="absolute right-full top-0 me-3 w-44 rounded-2xl bg-white/95 backdrop-blur-xl border border-black/[0.06] shadow-[0_8px_32px_rgba(45,40,35,0.12)] p-3.5 flex flex-col items-center gap-2 pointer-events-auto text-center"
    >
      <Icon name="touch_app" size={20} className="text-primary/60" />
      <span className="text-[11px] text-secondary/70 font-medium leading-snug">
        חלון עריכה פתוח
      </span>
    </motion.div>
  )
}

export default function EditorSidebar() {
  const { selectedPhotoId, spreadCount, currentSpreadId, swapPhase } = useEditorStore(useShallow((s) => ({
    selectedPhotoId: s.selectedPhotoId,
    spreadCount: s.spreads.length,
    currentSpreadId: s.spreads[s.currentSpreadIndex]?.id ?? null,
    swapPhase: s.swapPhase,
  })))
  const addSpread = useEditorStore((s) => s.addSpread)
  const deleteSpread = useEditorStore((s) => s.deleteSpread)
  const toggleOverview = useEditorStore((s) => s.toggleOverview)
  const enterSwapMode = useEditorStore((s) => s.enterSwapMode)
  const cancelSwapMode = useEditorStore((s) => s.cancelSwapMode)
  const addToast = useUIStore((s) => s.addToast)
  const [activeTool, setActiveTool] = useState<ToolId>('select')
  const [showLayoutPicker, setShowLayoutPicker] = useState(false)
  const [showTextPanel, setShowTextPanel] = useState(false)
  const [showAIBg, setShowAIBg] = useState(false)

  const closeAll = useCallback(() => {
    setShowLayoutPicker(false)
    setShowTextPanel(false)
    setShowAIBg(false)
  }, [])

  const run = (id: ToolId, action: () => void) => {
    setActiveTool(id)
    action()
  }

  return (
    <aside
      className="fixed right-6 top-[43%] -translate-y-1/2 z-[45] pointer-events-none max-md:right-3"
      aria-label="כלי עריכה"
    >
      <motion.nav
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="editor-glass-toolbar pointer-events-auto flex flex-col items-center gap-0.5 py-3 px-1.5 rounded-[28px] w-[68px] relative"
      >
        <ToolBtn
          icon="near_me"
          label="בחירה"
          active={activeTool === 'select'}
          onClick={() => { closeAll(); run('select', () => {}) }}
        />
        <ToolBtn
          icon="swap_horiz"
          label="החלפה"
          active={activeTool === 'replace' || swapPhase !== 'off'}
          onClick={() => {
            closeAll()
            if (swapPhase !== 'off') {
              cancelSwapMode()
              setActiveTool('select')
            } else {
              run('replace', () => enterSwapMode())
            }
          }}
        />
        <ToolBtn
          icon="grid_view"
          label="מבט על"
          active={false}
          onClick={() => { closeAll(); toggleOverview() }}
        />

        <Separator />

        <ToolBtn
          icon="dashboard_customize"
          label="פריסה"
          active={activeTool === 'layout' || showLayoutPicker}
          onClick={() => {
            setShowTextPanel(false)
            setShowLayoutPicker((v) => !v)
            setActiveTool('layout')
          }}
        />
        <ToolBtn
          icon="text_fields"
          label="טקסט"
          active={activeTool === 'text' || showTextPanel}
          onClick={() => {
            setShowLayoutPicker(false)
            setShowTextPanel((v) => !v)
            setActiveTool('text')
          }}
        />

        <Separator />

        <ToolBtn
          icon="auto_awesome"
          label="רקע AI"
          active={activeTool === 'ai' || showAIBg}
          onClick={() => {
            setShowLayoutPicker(false)
            setShowTextPanel(false)
            setShowAIBg((v) => !v)
            setActiveTool('ai')
          }}
        />
        <ToolBtn
          icon="add_circle"
          label="הוספה"
          active={activeTool === 'add'}
          onClick={() => {
            closeAll()
            run('add', () => {
              addSpread()
              addToast('נוסף דף ריק — העלו תמונות מהמחשב', 'success')
            })
          }}
        />

        <Separator />

        <ToolBtn
          icon="delete"
          label="מחיקה"
          danger
          active={activeTool === 'delete'}
          onClick={() => {
            closeAll()
            run('delete', () => {
              if (currentSpreadId && spreadCount > 1) {
                deleteSpread(currentSpreadId)
                addToast('העמוד נמחק')
              } else {
                addToast('לא ניתן למחוק את העמוד האחרון')
              }
            })
          }}
        />

        <AnimatePresence>
          {selectedPhotoId && <PhotoEditPanel />}
          {showLayoutPicker && (
            <LayoutPickerPanel
              key="layout-picker"
              onClose={() => setShowLayoutPicker(false)}
            />
          )}
          {showTextPanel && (
            <TextInsertPanel
              key="text-panel"
              onClose={() => setShowTextPanel(false)}
            />
          )}
          {showAIBg && (
            <AIBackgroundPanel
              key="ai-bg-panel"
              onClose={() => setShowAIBg(false)}
            />
          )}
        </AnimatePresence>
      </motion.nav>
    </aside>
  )
}
