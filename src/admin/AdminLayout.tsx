import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { useAdminGuard } from './useAdminGuard'
import { useUIStore } from '../store/uiStore'

const ADMIN_BASE = '/admin.eliav'
const GATE_KEY = 'momento_admin_gate'
const ADMIN_USER = 'eliav'
const ADMIN_PASS = 'Momento2026!'

const NAV_ITEMS = [
  { to: ADMIN_BASE, label: 'סקירה כללית', icon: 'dashboard', end: true },
  { to: `${ADMIN_BASE}/orders`, label: 'הזמנות', icon: 'receipt_long', end: false },
]

function useGateAuth() {
  const [passed, setPassed] = useState(() => sessionStorage.getItem(GATE_KEY) === 'true')

  const verify = (user: string, pass: string): boolean => {
    if (user === ADMIN_USER && pass === ADMIN_PASS) {
      sessionStorage.setItem(GATE_KEY, 'true')
      setPassed(true)
      return true
    }
    return false
  }

  return { passed, verify }
}

function GateScreen({ onVerify }: { onVerify: (user: string, pass: string) => boolean }) {
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!onVerify(user, pass)) {
      setError(true)
      setTimeout(() => setError(false), 2000)
    }
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="bg-white rounded-2xl border border-[#e5e7eb] p-8 w-full max-w-sm"
        style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
      >
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#111827] flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-white text-[22px]">lock</span>
          </div>
          <img src="/momento-logo.png" alt="Momento" className="h-7 w-auto mx-auto object-contain invert mb-2" decoding="async" />
          <h1 className="text-[14px] font-semibold text-[#111827]">ניהול</h1>
          <p className="text-[12px] text-[#6b7280] mt-1">הזן פרטי כניסה</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="שם משתמש"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            className="w-full px-4 py-2.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg text-[13px] text-[#111827] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#6b7280] transition-colors"
            autoFocus
          />
          <input
            type="password"
            placeholder="סיסמה"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            className="w-full px-4 py-2.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg text-[13px] text-[#111827] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#6b7280] transition-colors"
          />
          {error && (
            <p className="text-[12px] text-[#ef4444] text-center">שם משתמש או סיסמה שגויים</p>
          )}
          <button
            type="submit"
            className="w-full py-2.5 bg-[#111827] text-white text-[13px] font-medium rounded-lg hover:bg-[#1f2937] transition-colors"
          >
            כניסה
          </button>
        </form>
      </motion.div>
    </div>
  )
}

export default function AdminLayout() {
  const { passed, verify } = useGateAuth()
  const { loading } = useAdminGuard()
  const userName = useUIStore((s) => s.userName)
  const isLoggedIn = useUIStore((s) => s.isLoggedIn)
  const logout = useUIStore((s) => s.logout)
  const navigate = useNavigate()

  if (!passed) {
    return <GateScreen onVerify={verify} />
  }

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen bg-[#f8f9fa] flex items-center justify-center flex-col gap-4">
        <div className="w-8 h-8 border-2 border-[#6b7280] border-t-transparent rounded-full animate-spin" />
        {!isLoggedIn && (
          <p className="text-[13px] text-[#6b7280]">נא להתחבר כדי לגשת לדשבורד הניהול</p>
        )}
      </div>
    )
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#f8f9fa] flex">
      <aside className="w-60 bg-white border-l border-[#e5e7eb] flex flex-col shrink-0 sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-[#e5e7eb]">
          <img src="/momento-logo.png" alt="Momento" className="h-6 w-auto object-contain invert" decoding="async" />
          <p className="text-[11px] text-[#6b7280] mt-0.5">ניהול הזמנות</p>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                  isActive
                    ? 'bg-[#f3f4f6] text-[#111827]'
                    : 'text-[#6b7280] hover:bg-[#f9fafb] hover:text-[#374151]'
                }`
              }
            >
              <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-[#e5e7eb]">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-[#e5e7eb] flex items-center justify-center text-[12px] font-bold text-[#374151]">
              {userName?.charAt(0) ?? 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-[#111827] truncate">{userName ?? 'Admin'}</p>
              <p className="text-[11px] text-[#9ca3af]">מנהל</p>
            </div>
          </div>
          <div className="flex gap-2 mt-2 px-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-[11px] text-[#6b7280] hover:text-[#111827] transition-colors"
            >
              לאפליקציה
            </button>
            <span className="text-[#d1d5db]">·</span>
            <button
              onClick={() => { logout(); navigate('/') }}
              className="text-[11px] text-[#6b7280] hover:text-[#ef4444] transition-colors"
            >
              התנתק
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="p-8"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  )
}
