import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import {
  listAllOrders,
  updateOrderStatus,
  getAdminStats,
  type AdminOrder,
  type AdminOrderStatus,
  type AdminStats,
} from './adminService'

const STATUS_CONFIG: Record<AdminOrderStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'ממתין', color: '#92400e', bg: '#fef3c7' },
  processing: { label: 'בעיבוד', color: '#1e40af', bg: '#dbeafe' },
  printing: { label: 'בהדפסה', color: '#7c3aed', bg: '#ede9fe' },
  shipped: { label: 'נשלח', color: '#047857', bg: '#d1fae5' },
  delivered: { label: 'נמסר', color: '#065f46', bg: '#a7f3d0' },
}

const STATUS_FLOW: AdminOrderStatus[] = ['pending', 'processing', 'printing', 'shipped', 'delivered']

export default function AdminDashboard() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<AdminOrderStatus | 'all'>('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const navigate = useNavigate()

  const fetchOrders = useCallback(async () => {
    try {
      const data = await listAllOrders()
      setOrders(data)
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const stats: AdminStats = useMemo(() => getAdminStats(orders), [orders])

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          o.order_number.toLowerCase().includes(q) ||
          o.customer_name.toLowerCase().includes(q) ||
          o.album_title.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [orders, statusFilter, searchQuery])

  const handleStatusChange = async (orderId: string, newStatus: AdminOrderStatus) => {
    setUpdatingId(orderId)
    try {
      await updateOrderStatus(orderId, newStatus)
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus, updated_at: new Date().toISOString() } : o)),
      )
    } catch (err) {
      console.error('Failed to update status:', err)
    } finally {
      setUpdatingId(null)
    }
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const formatPrice = (price: number) => `₪${price.toLocaleString('he-IL')}`

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white rounded-xl border border-[#e5e7eb] animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-white rounded-xl border border-[#e5e7eb] animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div>
        <h1 className="text-xl font-bold text-[#111827]">סקירה כללית</h1>
        <p className="text-[13px] text-[#6b7280] mt-1">ניהול הזמנות ומעקב</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="סה״כ הזמנות" value={stats.totalOrders} icon="receipt_long" />
        <StatCard label="הכנסות" value={formatPrice(stats.totalRevenue)} icon="payments" />
        <StatCard label="ממתין / בעיבוד" value={stats.pendingCount} icon="pending_actions" accent="#f59e0b" />
        <StatCard label="בהדפסה" value={stats.printingCount} icon="print" accent="#7c3aed" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#e5e7eb] flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[18px] text-[#9ca3af]">
              search
            </span>
            <input
              type="text"
              placeholder="חיפוש לפי מספר הזמנה, שם לקוח או אלבום..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg text-[13px] text-[#111827] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#6b7280] transition-colors"
            />
          </div>

          <div className="flex gap-1.5">
            <FilterChip
              label="הכל"
              active={statusFilter === 'all'}
              onClick={() => setStatusFilter('all')}
              count={orders.length}
            />
            {STATUS_FLOW.map((s) => (
              <FilterChip
                key={s}
                label={STATUS_CONFIG[s].label}
                active={statusFilter === s}
                onClick={() => setStatusFilter(s)}
                count={orders.filter((o) => o.status === s).length}
              />
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-[#f9fafb] text-[#6b7280] text-right">
                <th className="px-5 py-3 font-medium">מספר הזמנה</th>
                <th className="px-5 py-3 font-medium">לקוח</th>
                <th className="px-5 py-3 font-medium">אלבום</th>
                <th className="px-5 py-3 font-medium">סטטוס</th>
                <th className="px-5 py-3 font-medium">מחיר</th>
                <th className="px-5 py-3 font-medium">תאריך</th>
                <th className="px-5 py-3 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center text-[#9ca3af]">
                      <span className="material-symbols-outlined text-3xl mb-2 block">inbox</span>
                      {orders.length === 0 ? 'אין הזמנות עדיין' : 'אין תוצאות לחיפוש'}
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-t border-[#f3f4f6] hover:bg-[#f9fafb] transition-colors cursor-pointer"
                      onClick={() => navigate(`/admin.eliav/orders/${order.id}`)}
                    >
                      <td className="px-5 py-3.5">
                        <span className="font-mono font-medium text-[#111827]">{order.order_number}</span>
                      </td>
                      <td className="px-5 py-3.5 text-[#374151]">{order.customer_name}</td>
                      <td className="px-5 py-3.5 text-[#374151] max-w-[180px] truncate">{order.album_title}</td>
                      <td className="px-5 py-3.5">
                        <select
                          value={order.status}
                          onChange={(e) => {
                            e.stopPropagation()
                            handleStatusChange(order.id, e.target.value as AdminOrderStatus)
                          }}
                          onClick={(e) => e.stopPropagation()}
                          disabled={updatingId === order.id}
                          className="text-[12px] font-medium px-2.5 py-1 rounded-md border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#6b7280] transition-colors"
                          style={{
                            color: STATUS_CONFIG[order.status].color,
                            backgroundColor: STATUS_CONFIG[order.status].bg,
                          }}
                        >
                          {STATUS_FLOW.map((s) => (
                            <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-[#111827] tabular-nums">
                        {formatPrice(order.total_price)}
                      </td>
                      <td className="px-5 py-3.5 text-[#6b7280] tabular-nums">{formatDate(order.created_at)}</td>
                      <td className="px-5 py-3.5">
                        <span className="material-symbols-outlined text-[16px] text-[#9ca3af]">chevron_left</span>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  accent = '#111827',
}: {
  label: string
  value: string | number
  icon: string
  accent?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl border border-[#e5e7eb] px-5 py-4 flex items-start gap-4"
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${accent}0a` }}
      >
        <span className="material-symbols-outlined text-[20px]" style={{ color: accent }}>
          {icon}
        </span>
      </div>
      <div>
        <p className="text-[22px] font-bold text-[#111827] tabular-nums leading-tight">{value}</p>
        <p className="text-[12px] text-[#6b7280] mt-0.5">{label}</p>
      </div>
    </motion.div>
  )
}

function FilterChip({
  label,
  active,
  onClick,
  count,
}: {
  label: string
  active: boolean
  onClick: () => void
  count: number
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors flex items-center gap-1.5 ${
        active
          ? 'bg-[#111827] text-white'
          : 'bg-[#f3f4f6] text-[#6b7280] hover:bg-[#e5e7eb] hover:text-[#374151]'
      }`}
    >
      {label}
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full tabular-nums ${
        active ? 'bg-white/20 text-white' : 'bg-white text-[#9ca3af]'
      }`}>
        {count}
      </span>
    </button>
  )
}
