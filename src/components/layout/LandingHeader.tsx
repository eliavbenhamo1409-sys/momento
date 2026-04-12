import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import { useUIStore } from '../../store/uiStore'
import { useShallow } from 'zustand/react/shallow'
import Icon from '../shared/Icon'
import BrandLogo from '../shared/BrandLogo'

export default function LandingHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { isLoggedIn, userName, openAuthModal, logout } = useUIStore(useShallow((s) => ({
    isLoggedIn: s.isLoggedIn,
    userName: s.userName,
    openAuthModal: s.openAuthModal,
    logout: s.logout,
  })))

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
    if (isLoggedIn) navigate('/upload')
    else openAuthModal('login', '/upload')
  }

  const handleLogin = () => openAuthModal('login', '/dashboard')

  const handleLogout = () => {
    logout()
    setMenuOpen(false)
  }

  const initial = (userName || 'א')[0].toUpperCase()

  const navColor = scrolled
    ? 'text-warm-gray hover:text-deep-brown'
    : 'text-white/60 hover:text-white'

  return (
    <header
      className={`fixed top-0 w-full z-50 flex justify-between items-center px-8 md:px-16 py-5 transition-all duration-700 ${
        scrolled
          ? 'glass-header border-b border-muted-border/10'
          : 'bg-transparent'
      }`}
    >
      <BrandLogo
        tone={scrolled ? 'dark' : 'light'}
        heightClass="h-10 sm:h-12"
        onClick={() => navigate('/')}
      />

      <nav className="hidden md:flex items-center gap-10">
        {['איך זה עובד', 'מחירים', 'שאלות נפוצות'].map((item) => (
          <a
            key={item}
            href={`#${item}`}
            className={`${navColor} transition-colors duration-300 text-[13px] tracking-[0.05em] font-medium`}
          >
            {item}
          </a>
        ))}
      </nav>

      <div className="flex items-center gap-5">
        {isLoggedIn ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="btn-press flex items-center gap-2.5 py-1.5 px-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <span
                className={`text-sm font-medium hidden sm:block transition-colors duration-300 ${
                  scrolled ? 'text-deep-brown' : 'text-white/70'
                }`}
              >
                {userName}
              </span>
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300"
                style={{
                  background: scrolled ? '#2D2926' : 'rgba(255,255,255,0.15)',
                  color: scrolled ? '#fff' : 'rgba(255,255,255,0.8)',
                  backdropFilter: scrolled ? 'none' : 'blur(8px)',
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
                  transition={{ duration: 0.2 }}
                  className="absolute left-0 top-full mt-2 w-56 rounded-2xl overflow-hidden py-2 px-2"
                  style={{
                    background: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(24px)',
                    boxShadow: '0 8px 40px rgba(26,23,20,0.1), 0 2px 12px rgba(26,23,20,0.05)',
                    border: '1px solid rgba(0,0,0,0.05)',
                  }}
                >
                  <DropdownItem icon="dashboard" label="דשבורד" onClick={() => { navigate('/dashboard'); setMenuOpen(false) }} />
                  <DropdownItem icon="add_circle" label="אלבום חדש" onClick={() => { navigate('/upload'); setMenuOpen(false) }} />
                  <div className="h-px bg-muted-border/15 my-1 mx-2" />
                  <DropdownItem icon="logout" label="התנתקות" onClick={handleLogout} danger />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <>
            <button
              onClick={handleLogin}
              className={`${navColor} font-medium transition-colors duration-300 text-[13px] tracking-wide`}
            >
              התחברות
            </button>
            <motion.button
              onClick={handleCreate}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-7 py-2.5 text-[12px] font-medium tracking-[0.12em] transition-all duration-500"
              style={{
                background: scrolled ? '#2D2926' : 'rgba(255,255,255,0.12)',
                color: scrolled ? '#fff' : 'rgba(255,255,255,0.85)',
                backdropFilter: scrolled ? 'none' : 'blur(12px)',
                border: scrolled ? '1px solid transparent' : '1px solid rgba(255,255,255,0.2)',
                borderRadius: '2px',
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
  icon: string; label: string; onClick: () => void; danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
        danger ? 'text-error/80 hover:bg-error/5' : 'text-deep-brown hover:bg-surface-container/50'
      }`}
    >
      <Icon name={icon} size={18} className={danger ? 'text-error/60' : 'text-warm-gray'} />
      {label}
    </button>
  )
}
