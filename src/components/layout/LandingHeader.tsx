import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import { useUIStore } from '../../store/uiStore'
import Icon from '../shared/Icon'

export default function LandingHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { isLoggedIn, userName, openAuthModal, logout } = useUIStore()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
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

  const handleCreate = () => {
    if (isLoggedIn) {
      navigate('/upload')
    } else {
      openAuthModal('login', '/upload')
    }
  }

  const handleLogin = () => {
    openAuthModal('login', '/dashboard')
  }

  const handleLogout = () => {
    logout()
    setMenuOpen(false)
  }

  const initial = (userName || 'א')[0].toUpperCase()

  return (
    <header
      className={`fixed top-0 w-full z-50 flex justify-between items-center px-8 md:px-16 py-4 transition-all duration-300 ${
        scrolled
          ? 'glass-header border-b border-muted-border/15'
          : 'bg-transparent'
      }`}
    >
      <div
        className="text-xl font-semibold text-deep-brown tracking-tight cursor-pointer"
        style={{ fontFamily: 'var(--font-family-headline)' }}
        onClick={() => navigate('/')}
      >
        Momento
      </div>

      <nav className="hidden md:flex items-center gap-8">
        {['איך זה עובד', 'דוגמאות', 'מחירים', 'שאלות נפוצות'].map((item) => (
          <a
            key={item}
            href={`#${item}`}
            className="text-warm-gray hover:text-deep-brown transition-colors duration-300 text-sm"
          >
            {item}
          </a>
        ))}
      </nav>

      <div className="flex items-center gap-4">
        {isLoggedIn ? (
          /* Authenticated state — avatar with dropdown */
          <div className="relative" ref={menuRef}>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2.5 py-1.5 px-2 rounded-full hover:bg-surface-container/40 transition-colors"
            >
              <span className="text-sm font-medium text-deep-brown hidden sm:block">{userName}</span>
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
                  className="absolute left-0 top-full mt-2 w-56 rounded-2xl overflow-hidden py-2 px-2"
                  style={{
                    background: 'rgba(255,255,255,0.92)',
                    backdropFilter: 'blur(24px)',
                    boxShadow: '0 8px 40px rgba(90,80,70,0.12), 0 2px 12px rgba(90,80,70,0.06)',
                    border: '1px solid rgba(216,208,207,0.3)',
                  }}
                >
                  <DropdownItem icon="dashboard" label="דשבורד" onClick={() => { navigate('/dashboard'); setMenuOpen(false) }} />
                  <DropdownItem icon="add_circle" label="צור אלבום חדש" onClick={() => { navigate('/upload'); setMenuOpen(false) }} />
                  <div className="h-px bg-muted-border/15 my-1 mx-2" />
                  <DropdownItem icon="logout" label="התנתקות" onClick={handleLogout} danger />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          /* Guest state */
          <>
            <button
              onClick={handleLogin}
              className="text-sage font-medium hover:text-deep-brown transition-colors text-sm"
            >
              התחברות
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleCreate}
              className="text-on-primary px-6 py-2.5 rounded-full font-medium text-sm hover:opacity-90 transition-all"
              style={{
                background: 'linear-gradient(135deg, #605c48 0%, #8E8973 100%)',
                boxShadow: '0 4px 16px rgba(96,92,72,0.2)',
              }}
            >
              התחל יצירה
            </motion.button>
          </>
        )}
      </div>
    </header>
  )
}

function DropdownItem({ icon, label, onClick, danger }: {
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
      <Icon name={icon} size={18} className={danger ? 'text-error/60' : 'text-warm-gray'} />
      {label}
    </button>
  )
}
