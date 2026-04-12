import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import { useUIStore } from '../../store/uiStore'
import Icon from '../shared/Icon'
import BrandLogo from '../shared/BrandLogo'

interface Props {
  showBack?: boolean
  backTo?: string
  backLabel?: string
  onBack?: () => void
}

export default function ProductHeader({ showBack, backTo, backLabel, onBack }: Props) {
  const navigate = useNavigate()
  const isLoggedIn = useUIStore((s) => s.isLoggedIn)
  const userName = useUIStore((s) => s.userName)
  const logout = useUIStore((s) => s.logout)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  const initial = (userName || 'א')[0].toUpperCase()

  return (
    <header className="h-[60px] w-full glass-header border-b border-muted-border/10 flex items-center justify-between px-8 shrink-0 z-40">
      <div className="flex items-center gap-4">
        <BrandLogo heightClass="h-7" onClick={() => navigate('/')} />
        {showBack && (
          <>
            <div className="h-5 w-px bg-outline-variant/30" />
            <button
              onClick={() => onBack ? onBack() : navigate(backTo || '/')}
              className="flex items-center gap-1 text-warm-gray hover:text-deep-brown text-sm transition-colors"
            >
              <Icon name="arrow_forward" size={18} />
              {backLabel || 'חזרה'}
            </button>
          </>
        )}
      </div>

      {isLoggedIn && (
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="btn-press flex items-center gap-2 py-1 px-1.5 rounded-full hover:bg-surface-container/40 transition-colors"
          >
            <span className="text-xs font-medium text-warm-gray hidden sm:block">{userName}</span>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{
                background: '#2D2926',
                boxShadow: '0 2px 6px rgba(26,23,20,0.2)',
              }}
            >
              {initial}
            </div>
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.18 }}
                className="absolute left-0 top-full mt-1.5 w-52 rounded-2xl overflow-hidden py-2 px-2"
                style={{
                  background: 'rgba(255,255,255,0.92)',
                  backdropFilter: 'blur(24px)',
                  boxShadow: '0 8px 32px rgba(90,80,70,0.1), 0 2px 8px rgba(90,80,70,0.05)',
                  border: '1px solid rgba(216,208,207,0.25)',
                }}
              >
                <MenuBtn icon="dashboard" label="דשבורד" onClick={() => { navigate('/dashboard'); setMenuOpen(false) }} />
                <MenuBtn icon="add_circle" label="הרכיבו זיכרון" onClick={() => { navigate('/upload'); setMenuOpen(false) }} />
                <div className="h-px bg-muted-border/15 my-1 mx-2" />
                <MenuBtn icon="logout" label="התנתקות" onClick={() => { logout(); navigate('/'); setMenuOpen(false) }} danger />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </header>
  )
}

function MenuBtn({ icon, label, onClick, danger }: { icon: string; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors ${
        danger ? 'text-error/80 hover:bg-error/5' : 'text-deep-brown hover:bg-surface-container/50'
      }`}
    >
      <Icon name={icon} size={17} className={danger ? 'text-error/60' : 'text-warm-gray'} />
      {label}
    </button>
  )
}
