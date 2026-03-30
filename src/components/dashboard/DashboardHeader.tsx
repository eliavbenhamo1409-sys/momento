import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router'
import { useUIStore } from '../../store/uiStore'
import Icon from '../shared/Icon'

export default function DashboardHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const userName = useUIStore((s) => s.userName)
  const logout = useUIStore((s) => s.logout)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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

  const handleLogout = () => {
    logout()
    navigate('/')
    setMenuOpen(false)
  }

  return (
    <header
      className={`fixed top-0 w-full z-50 flex justify-between items-center px-8 md:px-16 py-4 transition-all duration-300 ${
        scrolled
          ? 'glass-header border-b border-muted-border/15'
          : 'bg-transparent'
      }`}
    >
      <span
        className="text-xl font-semibold text-deep-brown tracking-tight cursor-pointer"
        style={{ fontFamily: 'var(--font-family-headline)' }}
        onClick={() => navigate('/')}
      >
        Momento
      </span>

      <div className="relative" ref={menuRef}>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-3 py-2 px-3 rounded-full hover:bg-surface-container/60 transition-colors"
        >
          <span className="text-sm font-medium text-deep-brown hidden sm:block">
            {userName}
          </span>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
            style={{
              background: 'linear-gradient(135deg, #8E8973 0%, #7B7660 100%)',
              boxShadow: '0 2px 8px rgba(142,137,115,0.3)',
            }}
          >
            {initial}
          </div>
        </motion.button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.2 }}
              className="absolute left-0 top-full mt-2 w-64 rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(24px)',
                boxShadow: '0 8px 40px rgba(90,80,70,0.12), 0 2px 12px rgba(90,80,70,0.06)',
                border: '1px solid rgba(216,208,207,0.3)',
              }}
            >
              {/* User info */}
              <div className="px-5 pt-5 pb-4 border-b border-muted-border/15">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                    style={{ background: 'linear-gradient(135deg, #8E8973 0%, #7B7660 100%)' }}
                  >
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-deep-brown truncate">{userName}</p>
                    <p className="text-xs text-warm-gray truncate">חשבון אישי</p>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="py-2 px-2">
                <MenuItem icon="dashboard" label="דשבורד" onClick={() => { navigate('/dashboard'); setMenuOpen(false) }} />
                <MenuItem icon="add_circle" label="צור אלבום חדש" onClick={() => { navigate('/upload'); setMenuOpen(false) }} />
                <MenuItem icon="settings" label="הגדרות חשבון" onClick={() => setMenuOpen(false)} />
              </div>

              {/* Logout */}
              <div className="border-t border-muted-border/15 p-2">
                <MenuItem icon="logout" label="התנתקות" onClick={handleLogout} danger />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}

function MenuItem({ icon, label, onClick, danger }: {
  icon: string
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
        danger
          ? 'text-error/80 hover:bg-error/5'
          : 'text-deep-brown hover:bg-surface-container/50'
      }`}
    >
      <Icon name={icon} size={19} className={danger ? 'text-error/60' : 'text-warm-gray'} />
      {label}
    </button>
  )
}
