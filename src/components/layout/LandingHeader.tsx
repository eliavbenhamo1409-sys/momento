import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import { useUIStore } from '../../store/uiStore'
import { useShallow } from 'zustand/react/shallow'
import Icon from '../shared/Icon'
import BrandLogo from '../shared/BrandLogo'

export default function LandingHeader() {
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

  const navColor = 'text-warm-gray hover:text-deep-brown'

  return (
    <header
      className="fixed top-0 z-50 flex w-full items-center justify-between border-b border-black/[0.06] bg-white/95 px-6 py-3 shadow-[0_1px_0_rgba(26,23,20,0.04)] backdrop-blur-md transition-colors duration-300 md:px-12 md:py-4 lg:px-16"
    >
      <BrandLogo
        tone="dark"
        heightClass="h-14 sm:h-16 md:h-[4.5rem] lg:h-[5.25rem]"
        onClick={() => navigate('/')}
      />

      <nav className="hidden items-center gap-8 md:flex lg:gap-10">
        {['איך זה עובד', 'מחירים', 'שאלות נפוצות'].map((item) => (
          <a
            key={item}
            href={`#${item}`}
            className={`${navColor} text-[13px] font-medium tracking-[0.05em] transition-colors duration-300`}
          >
            {item}
          </a>
        ))}
      </nav>

      <div className="flex items-center gap-4 md:gap-5">
        {isLoggedIn ? (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="btn-press flex items-center gap-2.5 rounded-full px-2 py-1.5 transition-colors hover:bg-surface-container-high"
            >
              <span className="hidden text-sm font-medium text-deep-brown/80 transition-colors duration-300 sm:block">
                {userName}
              </span>
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white transition-all duration-300"
                style={{ background: '#2D2926' }}
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
                  className="absolute left-0 top-full mt-2 w-56 overflow-hidden rounded-2xl px-2 py-2"
                  style={{
                    background: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(24px)',
                    boxShadow: '0 8px 40px rgba(26,23,20,0.1), 0 2px 12px rgba(26,23,20,0.05)',
                    border: '1px solid rgba(0,0,0,0.05)',
                  }}
                >
                  <DropdownItem icon="dashboard" label="דשבורד" onClick={() => { navigate('/dashboard'); setMenuOpen(false) }} />
                  <DropdownItem icon="add_circle" label="אלבום חדש" onClick={() => { navigate('/upload'); setMenuOpen(false) }} />
                  <div className="mx-2 my-1 h-px bg-muted-border/15" />
                  <DropdownItem icon="logout" label="התנתקות" onClick={handleLogout} danger />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={handleLogin}
              className={`${navColor} text-[13px] font-medium tracking-wide transition-colors duration-300`}
            >
              התחברות
            </button>
            <motion.button
              type="button"
              onClick={handleCreate}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-6 py-2.5 text-[12px] font-medium tracking-[0.12em] text-white transition-all duration-500 md:px-7 md:py-2.5"
              style={{
                background: '#2D2926',
                border: '1px solid transparent',
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
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
        danger ? 'text-error/80 hover:bg-error/5' : 'text-deep-brown hover:bg-surface-container/50'
      }`}
    >
      <Icon name={icon} size={18} className={danger ? 'text-error/60' : 'text-warm-gray'} />
      {label}
    </button>
  )
}
