import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router'
import { motion } from 'motion/react'
import JSZip from 'jszip'
import {
  getOrderDetail,
  getExportSignedUrls,
  updateOrderStatus,
  type AdminOrder,
  type AdminOrderStatus,
} from './adminService'
import { ALBUM_SIZES } from '../lib/constants'

const STATUS_CONFIG: Record<AdminOrderStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'ממתין', color: '#92400e', bg: '#fef3c7' },
  processing: { label: 'בעיבוד', color: '#1e40af', bg: '#dbeafe' },
  printing: { label: 'בהדפסה', color: '#7c3aed', bg: '#ede9fe' },
  shipped: { label: 'נשלח', color: '#047857', bg: '#d1fae5' },
  delivered: { label: 'נמסר', color: '#065f46', bg: '#a7f3d0' },
}

const STATUS_FLOW: AdminOrderStatus[] = ['pending', 'processing', 'printing', 'shipped', 'delivered']

export default function AdminOrderDetail() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<AdminOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [exportUrls, setExportUrls] = useState<{ path: string; url: string }[]>([])
  const [loadingExports, setLoadingExports] = useState(false)
  const [downloadingAll, setDownloadingAll] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const fetchOrder = useCallback(async () => {
    if (!orderId) return
    try {
      const data = await getOrderDetail(orderId)
      setOrder(data)
      if (data?.export_paths?.length) {
        setLoadingExports(true)
        const urls = await getExportSignedUrls(data.export_paths)
        setExportUrls(urls)
        setLoadingExports(false)
      }
    } catch (err) {
      console.error('Failed to fetch order:', err)
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => { fetchOrder() }, [fetchOrder])

  const handleStatusChange = async (newStatus: AdminOrderStatus) => {
    if (!order) return
    setUpdatingStatus(true)
    try {
      await updateOrderStatus(order.id, newStatus)
      setOrder({ ...order, status: newStatus })
    } catch (err) {
      console.error('Failed to update status:', err)
    } finally {
      setUpdatingStatus(false)
    }
  }

  const downloadSinglePage = async (url: string, filename: string) => {
    const response = await fetch(url)
    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = filename
    link.click()
    URL.revokeObjectURL(blobUrl)
  }

  const downloadAllAsZip = async () => {
    if (!order || exportUrls.length === 0) return
    setDownloadingAll(true)
    try {
      const zip = new JSZip()
      for (let i = 0; i < exportUrls.length; i++) {
        const { url } = exportUrls[i]
        const response = await fetch(url)
        const blob = await response.blob()
        const filename = `spread-${String(i + 1).padStart(3, '0')}.jpg`
        zip.file(filename, blob)
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const blobUrl = URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `${order.order_number}-print-files.zip`
      link.click()
      URL.revokeObjectURL(blobUrl)
    } catch (err) {
      console.error('Failed to create ZIP:', err)
    } finally {
      setDownloadingAll(false)
    }
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  const formatPrice = (price: number) => `₪${price.toLocaleString('he-IL')}`

  if (loading) {
    return (
      <div className="space-y-6 max-w-[900px]">
        <div className="h-10 w-48 bg-[#e5e7eb] rounded-lg animate-pulse" />
        <div className="h-64 bg-white rounded-xl border border-[#e5e7eb] animate-pulse" />
        <div className="h-96 bg-white rounded-xl border border-[#e5e7eb] animate-pulse" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <span className="material-symbols-outlined text-4xl text-[#9ca3af] block mb-3">error_outline</span>
        <p className="text-[#6b7280] mb-4">הזמנה לא נמצאה</p>
        <button onClick={() => navigate('/admin.eliav')} className="text-[13px] text-[#111827] underline">
          חזרה לרשימה
        </button>
      </div>
    )
  }

  const albumConfig = order.album_config as Record<string, unknown> | null
  const sizeId = (albumConfig?.size as string) ?? '30x30'
  const sizeLabel = ALBUM_SIZES.find((s) => s.id === sizeId)?.label ?? sizeId
  const pages = (albumConfig?.pages as number) ?? 0

  return (
    <div className="space-y-6 max-w-[900px]">
      {/* Back + Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin.eliav')}
          className="w-9 h-9 rounded-lg bg-white border border-[#e5e7eb] flex items-center justify-center hover:bg-[#f3f4f6] transition-colors"
        >
          <span className="material-symbols-outlined text-[18px] text-[#6b7280]">arrow_forward</span>
        </button>
        <div>
          <h1 className="text-lg font-bold text-[#111827] font-mono">{order.order_number}</h1>
          <p className="text-[12px] text-[#6b7280]">{formatDate(order.created_at)}</p>
        </div>
        <div className="mr-auto flex items-center gap-3">
          <select
            value={order.status}
            onChange={(e) => handleStatusChange(e.target.value as AdminOrderStatus)}
            disabled={updatingStatus}
            className="text-[13px] font-medium px-3 py-1.5 rounded-lg border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#6b7280]"
            style={{
              color: STATUS_CONFIG[order.status].color,
              backgroundColor: STATUS_CONFIG[order.status].bg,
            }}
          >
            {STATUS_FLOW.map((s) => (
              <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Order Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="bg-white rounded-xl border border-[#e5e7eb] p-5"
        >
          <h2 className="text-[13px] font-semibold text-[#111827] mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-[#6b7280]">person</span>
            פרטי לקוח
          </h2>
          <dl className="space-y-3 text-[13px]">
            <InfoRow label="שם" value={order.customer_name} />
            {order.shipping_address && (
              <>
                <InfoRow label="טלפון" value={order.shipping_address.phone} mono />
                <InfoRow label="כתובת" value={`${order.shipping_address.address}, ${order.shipping_address.city}`} />
                <InfoRow label="מיקוד" value={order.shipping_address.zip} mono />
              </>
            )}
          </dl>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="bg-white rounded-xl border border-[#e5e7eb] p-5"
        >
          <h2 className="text-[13px] font-semibold text-[#111827] mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-[#6b7280]">menu_book</span>
            פרטי אלבום
          </h2>
          <dl className="space-y-3 text-[13px]">
            <InfoRow label="שם אלבום" value={order.album_title} />
            <InfoRow label="גודל" value={sizeLabel} />
            <InfoRow label="עמודים" value={String(pages)} />
            <InfoRow label="מחיר" value={formatPrice(order.total_price)} bold />
          </dl>
        </motion.div>
      </div>

      {/* Print Files */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.1 }}
        className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-[#e5e7eb] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[#6b7280]">print</span>
            <h2 className="text-[13px] font-semibold text-[#111827]">
              קבצי הדפסה (300 DPI)
            </h2>
            <span className="text-[11px] text-[#9ca3af] bg-[#f3f4f6] px-2 py-0.5 rounded-full tabular-nums">
              {exportUrls.length} דפים פתוחים
            </span>
          </div>
          {exportUrls.length > 0 && (
            <button
              onClick={downloadAllAsZip}
              disabled={downloadingAll}
              className="flex items-center gap-2 px-4 py-2 bg-[#111827] text-white text-[12px] font-medium rounded-lg hover:bg-[#1f2937] transition-colors disabled:opacity-50"
            >
              {downloadingAll ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-[16px]">download</span>
              )}
              {downloadingAll ? 'מכין ZIP...' : 'הורד הכל (ZIP)'}
            </button>
          )}
        </div>

        <div className="p-5">
          {loadingExports ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[2/1] bg-[#f3f4f6] rounded-lg animate-pulse" />
              ))}
            </div>
          ) : exportUrls.length === 0 ? (
            <div className="text-center py-12 text-[#9ca3af]">
              <span className="material-symbols-outlined text-3xl block mb-2">image_not_supported</span>
              <p className="text-[13px]">אין קבצי הדפסה זמינים להזמנה זו</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {exportUrls.map(({ url }, i) => (
                <div
                  key={i}
                  className="group relative bg-[#f9fafb] rounded-lg overflow-hidden border border-[#e5e7eb] hover:border-[#d1d5db] transition-colors"
                >
                  <div className="aspect-[2/1]">
                    <img
                      src={url}
                      alt={`עמוד ${i + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <button
                      onClick={() => downloadSinglePage(url, `${order.order_number}-page-${String(i + 1).padStart(3, '0')}.jpg`)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-lg px-3 py-1.5 text-[12px] font-medium text-[#111827] flex items-center gap-1.5 shadow-lg"
                    >
                      <span className="material-symbols-outlined text-[14px]">download</span>
                      עמוד {i + 1}
                    </button>
                  </div>
                  <div className="px-2.5 py-2 text-[11px] text-[#6b7280] font-medium tabular-nums">
                    עמוד {i + 1}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

function InfoRow({
  label,
  value,
  mono = false,
  bold = false,
}: {
  label: string
  value: string
  mono?: boolean
  bold?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-[#6b7280]">{label}</dt>
      <dd className={`text-[#111827] ${mono ? 'font-mono' : ''} ${bold ? 'font-semibold' : ''}`}>
        {value}
      </dd>
    </div>
  )
}
