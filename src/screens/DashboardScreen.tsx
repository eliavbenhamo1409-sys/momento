import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router'
import PageTransition from '../components/shared/PageTransition'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import ProjectCard from '../components/dashboard/ProjectCard'
import OrderCard from '../components/dashboard/OrderCard'
import EmptyState from '../components/dashboard/EmptyState'
import Skeleton from '../components/shared/Skeleton'
import Icon from '../components/shared/Icon'
import { useUIStore } from '../store/uiStore'
import { listUserAlbums, deleteAlbum, type AlbumRow } from '../lib/albumService'
import { listUserOrders, type OrderWithAlbum } from '../lib/orderService'
import { ALBUM_SIZES } from '../lib/constants'

type Tab = 'projects' | 'orders'

function albumToProject(album: AlbumRow) {
  const spreads = album.spreads ?? []
  let photoCount = 0
  for (const s of spreads) {
    if (s.design) {
      photoCount += s.design.elements.filter((e) => e.type === 'photo' && e.photoUrl).length
    } else {
      photoCount += (s.leftPhotos?.filter(Boolean).length ?? 0) + (s.rightPhotos?.filter(Boolean).length ?? 0)
    }
  }

  const config = album.config as unknown as Record<string, unknown> | null
  return {
    id: album.id,
    title: album.title,
    coverUrl: album.cover_url,
    size: (config?.size as string) ?? '30x30',
    pages: spreads.length * 2,
    photosCount: photoCount,
    lastEdited: album.updated_at,
    status: album.status,
  }
}

function orderRowToCardData(o: OrderWithAlbum) {
  const cfg = o.album_config as unknown as Record<string, unknown> | null
  const sizeId = (cfg?.size as string) ?? '30x30'
  const sizeLabel = ALBUM_SIZES.find((s) => s.id === sizeId)?.closedDimensions ?? sizeId
  const pages = (cfg?.pages as number) ?? 0

  return {
    id: o.id,
    orderNumber: o.order_number,
    title: o.album_title,
    coverUrl: o.album_cover_url ?? 'https://picsum.photos/seed/order-fallback/400/300',
    status: o.status,
    size: sizeLabel,
    pages,
    price: o.total_price,
    orderedAt: o.created_at,
  }
}

export default function DashboardScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('projects')
  const [albums, setAlbums] = useState<AlbumRow[]>([])
  const [orders, setOrders] = useState<OrderWithAlbum[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const navigate = useNavigate()
  const userName = useUIStore((s) => s.userName)
  const userId = useUIStore((s) => s.userId)
  const isLoggedIn = useUIStore((s) => s.isLoggedIn)
  const openAuthModal = useUIStore((s) => s.openAuthModal)

  const fetchData = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setFetchError(false)
    try {
      const [albumData, orderData] = await Promise.all([
        listUserAlbums(userId),
        listUserOrders(userId),
      ])
      setAlbums(albumData)
      setOrders(orderData)
    } catch (err) {
      console.error('Failed to fetch data:', err)
      setFetchError(true)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false)
      openAuthModal('login', '/dashboard')
      return
    }
    fetchData()
  }, [isLoggedIn, fetchData, openAuthModal])

  const handleDelete = async (albumId: string) => {
    if (!confirm('למחוק את האלבום?')) return
    try {
      await deleteAlbum(albumId)
      setAlbums((prev) => prev.filter((a) => a.id !== albumId))
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  const projects = albums.map(albumToProject)
  const orderCards = orders.map(orderRowToCardData)
  const greeting = getGreeting()

  return (
    <PageTransition>
      <div className="min-h-screen bg-soft-cream">
        <DashboardHeader />

        <main className="max-w-6xl mx-auto px-6 md:px-10 pt-28 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <h1
              className="text-3xl md:text-4xl font-light text-deep-brown mb-2"
              style={{ fontFamily: 'var(--font-family-headline)' }}
            >
              {greeting}, <span className="font-bold">{userName || 'אורח'}</span>
            </h1>
            <p className="text-secondary text-[15px]">
              מה עושים היום? ממשיכים לערוך, או מתחילים משהו חדש?
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="mb-10"
          >
            <button
              onClick={() => navigate('/upload')}
              className="btn-press group w-full relative overflow-hidden rounded-2xl p-7 md:p-8 flex items-center gap-5 text-right transition-shadow"
              style={{
                background: 'linear-gradient(135deg, rgba(139,133,115,0.06) 0%, rgba(232,228,220,0.12) 50%, rgba(250,250,247,0.4) 100%)',
                boxShadow: '0 2px 20px rgba(90,80,70,0.05), inset 0 1px 0 rgba(255,255,255,0.6)',
              }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                style={{
                  background: '#2D2926',
                  boxShadow: '0 4px 16px rgba(26,23,20,0.2)',
                }}
              >
                <Icon name="add" size={28} className="text-white" />
              </div>
              <div>
                <p className="text-lg font-semibold text-deep-brown mb-0.5" style={{ fontFamily: 'var(--font-family-headline)' }}>
                  הרכיבו זיכרון
                </p>
                <p className="text-sm text-secondary/80">שופכים תמונות, מקבלים אלבום. קל.</p>
              </div>
              <Icon name="arrow_back" size={22} className="text-sage/50 mr-auto group-hover:text-sage transition-colors" />
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.18 }}
            className="flex gap-1 mb-8 p-1 bg-surface-container/60 rounded-xl w-fit"
          >
            {[
              { id: 'projects' as Tab, label: 'האלבומים שלי', icon: 'palette', count: projects.length },
              { id: 'orders' as Tab, label: 'הזמנות', icon: 'local_shipping', count: orderCards.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-deep-brown'
                    : 'text-warm-gray hover:text-deep-brown/70'
                }`}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="tab-bg"
                    className="absolute inset-0 bg-white rounded-[10px]"
                    style={{ boxShadow: '0 1px 8px rgba(90,80,70,0.08)' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Icon name={tab.icon} size={18} />
                  {tab.label}
                  <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold tabular-nums ${
                    activeTab === tab.id ? 'bg-sage/10 text-sage' : 'bg-surface-container-high text-warm-gray'
                  }`}>
                    {tab.count}
                  </span>
                </span>
              </button>
            ))}
          </motion.div>

          <AnimatePresence mode="wait">
            {activeTab === 'projects' ? (
              <motion.div
                key="projects"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
              >
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="rounded-2xl overflow-hidden bg-white" style={{ boxShadow: '0 2px 16px rgba(90,80,70,0.06)' }}>
                        <Skeleton height={180} borderRadius={0} />
                        <div className="p-5 flex flex-col gap-3">
                          <Skeleton width="60%" height={18} borderRadius={8} />
                          <Skeleton width="40%" height={14} borderRadius={6} />
                          <div className="flex gap-4 mt-1">
                            <Skeleton width={60} height={12} borderRadius={4} />
                            <Skeleton width={60} height={12} borderRadius={4} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : fetchError ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <span className="material-symbols-outlined text-3xl text-warm-gray/50">cloud_off</span>
                    <p className="text-sm text-warm-gray font-medium">לא הצלחנו לטעון את האלבומים</p>
                    <button
                      onClick={fetchData}
                      className="px-5 py-2 rounded-full bg-sage text-white text-sm font-medium hover:bg-sage/90 transition-colors"
                    >
                      נסה שוב
                    </button>
                  </div>
                ) : projects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {projects.map((project, i) => (
                      <ProjectCard key={project.id} project={project} index={i} onDelete={handleDelete} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon="palette"
                    title="פה עוד ריק"
                    description="הגיע הזמן להרכיב את הזיכרון הראשון שלכם."
                    actionLabel="הרכיבו זיכרון"
                    onAction={() => navigate('/upload')}
                  />
                )}
              </motion.div>
            ) : (
              <motion.div
                key="orders"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
              >
                {orderCards.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {orderCards.map((order, i) => (
                      <OrderCard key={order.id} order={order} index={i} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon="local_shipping"
                    title="עדיין בלי הזמנות"
                    description="ברגע שתזמינו אלבום, הוא יופיע פה."
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </PageTransition>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'בוקר טוב'
  if (hour < 17) return 'צהריים טובים'
  if (hour < 21) return 'ערב טוב'
  return 'לילה טוב'
}
