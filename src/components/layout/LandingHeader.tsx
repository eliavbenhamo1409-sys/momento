import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react'
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

  const { scrollYProgress } = useScroll()
  const progressScaleX = useTransform(scrollYProgress, [0, 1], [0, 1])

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

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] z-[60] scroll-progress origin-left"
        style={{ scaleX: progressScaleX }}
      />

      <header
        className={`fixed top-0 w-full z-50 flex justify-between items-center px-8 md:px-16 py-4 transition-all duration-500 ${
          scrolled ? 'glass-header border-b border-muted-border/15' : 'bg-transparent'
        }`}
      >
        <BrandLogo heightClass="h-12 sm:h-14 md:h-16" onClick={() => navigate('/')} />

        <nav className="hidden md:flex items-center gap-8">
          {['איך זה עובד', 'מחירים', 'שאלות נפוצות'].map((item) => (
            <a
              key={item}
              href={`#${item}`}
              className="hover-underline text-warm-gray hover:text-deep-brown transition-colors duration-300 text-sm font-medium"
            >
              {item}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="btn-press flex items-center gap-2.5 py-1.5 px-2 rounded-full hover:bg-surface-container/40 transition-colors"
              >
                <span className="text-sm font-medium text-deep-brown hidden sm:block">{userName}</span>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
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
                    className="absolute left-0 top-full mt-2 w-56 rounded-2xl overflow-hidden py-2 px-2"
                    style={{
                      background: 'rgba(255,255,255,0.92)',
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
                className="hover-underline text-warm-gray font-medium hover:text-deep-brown transition-colors text-sm"
              >
                התחברות
              </button>
              <motion.button
                onClick={handleCreate}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="text-white px-6 py-2.5 rounded-full font-medium text-sm"
                style={{ background: '#2D2926' }}
              >
                התחל יצירה
              </motion.button>
            </>
          )}
        </div>
      </header>
    </>
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
