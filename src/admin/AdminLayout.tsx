import { Outlet, NavLink, useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { useAdminGuard } from './useAdminGuard'
import { useUIStore } from '../store/uiStore'

const NAV_ITEMS = [
  { to: '/admin', label: 'סקירה כללית', icon: 'dashboard', end: true },
  { to: '/admin/orders', label: 'הזמנות', icon: 'receipt_long', end: false },
]

export default function AdminLayout() {
  const { loading } = useAdminGuard()
  const userName = useUIStore((s) => s.userName)
  const isLoggedIn = useUIStore((s) => s.isLoggedIn)
  const logout = useUIStore((s) => s.logout)
  const navigate = useNavigate()

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
          <h1 className="text-[15px] font-bold text-[#111827] tracking-tight">Momento</h1>
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
