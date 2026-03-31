import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useEditorStore } from '../../store/editorStore'
import { useUIStore } from '../../store/uiStore'
import { useShallow } from 'zustand/react/shallow'
import Icon from '../shared/Icon'
import LayoutPickerPanel from './LayoutPickerPanel'
import TextInsertPanel from './TextInsertPanel'
import AIBackgroundPanel from './AIBackgroundPanel'
import MarginsPanel from './MarginsPanel'
import type { PhotoElement, QuoteElement } from '../../types'

type ToolId =
  | 'select'
  | 'replace'
  | 'layout'
  | 'text'
  | 'ai'
  | 'add'
  | 'delete'
  | 'layers'
  | 'margins'

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
      className={`relative rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/25 md:w-full py-2 px-2 md:px-1 ${
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
      <span className={`text-[9px] font-semibold leading-none mt-0.5 hidden md:block ${
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
      className="md:w-10 md:h-px h-8 w-px my-0.5 shrink-0 rounded-full mx-auto"
      style={{
        background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.10), transparent)',
      }}
      aria-hidden
    />
  )
}

function LayersPanel({ onClose }: { onClose: () => void }) {
  const elements = useEditorStore((s) => {
    const spread = s.spreads[s.currentSpreadIndex]
    return spread?.design?.elements ?? []
  })
  const moveLayer = useEditorStore((s) => s.moveElementLayer)
  const selectPhoto = useEditorStore((s) => s.selectPhoto)

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="absolute md:right-full md:top-0 md:me-3 max-md:bottom-full max-md:mb-3 max-md:right-0 w-72 max-w-[min(18rem,calc(100vw-3rem))] max-h-[70vh] overflow-y-auto no-scrollbar rounded-2xl bg-white/95 backdrop-blur-xl border border-black/[0.06] shadow-[0_8px_32px_rgba(45,40,35,0.12)] p-4 pointer-events-auto"
      dir="rtl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
            <Icon name="layers" size={16} className="text-primary" />
          </div>
          <h3 className="text-sm font-bold text-on-surface" style={{ fontFamily: 'var(--font-family-headline)' }}>
            שכבות
          </h3>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-full flex items-center justify-center text-secondary/50 hover:text-on-surface hover:bg-surface-container-high/70 transition-colors"
        >
          <Icon name="close" size={16} />
        </button>
      </div>

      <div className="flex flex-col gap-1">
        {[...elements].reverse().map((el, revIdx) => {
          const idx = elements.length - 1 - revIdx
          const isPhoto = el.type === 'photo'
          const isQuote = el.type === 'quote'
          const pe = el as PhotoElement
          const qe = el as QuoteElement

          let label = ''
          let icon = ''
          let thumb: string | null = null

          if (isPhoto) {
            label = pe.photoUrl ? `תמונה ${pe.slotId.slice(-4)}` : 'משבצת ריקה'
            icon = pe.photoUrl ? 'image' : 'crop_free'
            thumb = pe.photoUrl || null
          } else if (isQuote) {
            label = qe.text?.slice(0, 20) || 'טקסט'
            icon = 'text_fields'
          } else {
            label = 'עיצוב'
            icon = 'star'
          }

          return (
            <div
              key={`${el.type}-${idx}`}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-container-low transition-colors group cursor-pointer"
              onClick={() => {
                if (isPhoto && pe.photoUrl) selectPhoto(pe.slotId)
              }}
            >
              {thumb ? (
                <div className="w-8 h-8 rounded-md overflow-hidden shrink-0 bg-surface-container-low">
                  <img src={thumb} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-md flex items-center justify-center bg-surface-container-low shrink-0">
                  <Icon name={icon} size={16} className="text-secondary/50" />
                </div>
              )}
              <span className="text-[11px] text-on-surface font-medium flex-1 truncate">{label}</span>
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); moveLayer(idx, 'up') }}
                  disabled={idx >= elements.length - 1}
                  className="w-5 h-5 rounded flex items-center justify-center text-secondary/50 hover:bg-surface-container-high disabled:opacity-20"
                >
                  <Icon name="arrow_upward" size={12} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); moveLayer(idx, 'down') }}
                  disabled={idx <= 0}
                  className="w-5 h-5 rounded flex items-center justify-center text-secondary/50 hover:bg-surface-container-high disabled:opacity-20"
                >
                  <Icon name="arrow_downward" size={12} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

export default function EditorSidebar() {
  const { spreadCount, currentSpreadId, swapPhase } = useEditorStore(useShallow((s) => ({
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
  const [showLayers, setShowLayers] = useState(false)
  const [showMargins, setShowMargins] = useState(false)

  const closeAll = useCallback(() => {
    setShowLayoutPicker(false)
    setShowTextPanel(false)
    setShowAIBg(false)
    setShowLayers(false)
    setShowMargins(false)
  }, [])

  useEffect(() => {
    const handler = () => {
      closeAll()
      setShowAIBg(true)
      setActiveTool('ai')
    }
    document.addEventListener('momento:bg-click', handler)
    return () => document.removeEventListener('momento:bg-click', handler)
  }, [closeAll])

  const run = (id: ToolId, action: () => void) => {
    setActiveTool(id)
    action()
  }

  return (
    <aside
      className="fixed z-[45] pointer-events-none md:right-6 md:top-[43%] md:-translate-y-1/2 max-md:bottom-20 max-md:left-1/2 max-md:-translate-x-1/2"
      aria-label="כלי עריכה"
    >
      <motion.nav
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="editor-glass-toolbar pointer-events-auto flex items-center gap-0.5 py-1.5 px-2 rounded-[28px] relative md:flex-col md:py-3 md:px-1.5 md:w-[68px]"
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
        <ToolBtn
          icon="layers"
          label="שכבות"
          active={activeTool === 'layers' || showLayers}
          onClick={() => {
            setShowLayoutPicker(false)
            setShowTextPanel(false)
            setShowAIBg(false)
            setShowMargins(false)
            setShowLayers((v) => !v)
            setActiveTool('layers')
          }}
        />
        <ToolBtn
          icon="padding"
          label="שוליים"
          active={activeTool === 'margins' || showMargins}
          onClick={() => {
            setShowLayoutPicker(false)
            setShowTextPanel(false)
            setShowAIBg(false)
            setShowLayers(false)
            setShowMargins((v) => !v)
            setActiveTool('margins')
          }}
        />

        <Separator />

        <ToolBtn
          icon="palette"
          label="רקעים"
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
          {showLayers && (
            <LayersPanel
              key="layers-panel"
              onClose={() => setShowLayers(false)}
            />
          )}
          {showMargins && (
            <MarginsPanel
              key="margins-panel"
              onClose={() => setShowMargins(false)}
            />
          )}
        </AnimatePresence>
      </motion.nav>
    </aside>
  )
}
