import { motion } from 'motion/react'
import Icon from '../shared/Icon'
import { ORDER_STATUS_MAP } from '../../lib/constants'

interface Props {
  order: {
    id: string
    orderNumber: string
    title: string
    coverUrl: string
    status: string
    size: string
    pages: number
    price: number
    orderedAt: string
    estimatedDelivery?: string
  }
  index: number
}

export default function OrderCard({ order, index }: Props) {
  const statusInfo = ORDER_STATUS_MAP[order.status] ?? ORDER_STATUS_MAP.draft
  const formattedDate = new Date(order.orderedAt).toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.06 * index }}
      className="flex items-center gap-5 rounded-2xl p-5 transition-all hover:translate-y-[-2px]"
      style={{
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 2px 16px rgba(90,80,70,0.05), 0 1px 4px rgba(90,80,70,0.03)',
        border: '1px solid rgba(216,208,207,0.2)',
      }}
    >
      {/* Cover thumbnail */}
      <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 ring-1 ring-black/[0.04]">
        <img
          src={order.coverUrl}
          alt={order.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1.5">
          <h3
            className="text-[15px] font-semibold text-deep-brown truncate"
            style={{ fontFamily: 'var(--font-family-headline)' }}
          >
            {order.title}
          </h3>
          <span className={`shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full ${statusInfo.color} ${statusInfo.bg}`}>
            {statusInfo.label}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-warm-gray">
          <span className="flex items-center gap-1">
            <Icon name="tag" size={12} />
            {order.orderNumber}
          </span>
          <span className="w-px h-3 bg-muted-border/30" />
          <span>{order.size} ס"מ · {order.pages} עמ׳</span>
          <span className="w-px h-3 bg-muted-border/30" />
          <span>{formattedDate}</span>
        </div>

        {order.estimatedDelivery && order.status === 'shipped' && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-sage">
            <Icon name="local_shipping" size={14} />
            <span>
              צפי הגעה: {new Date(order.estimatedDelivery).toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })}
            </span>
          </div>
        )}
      </div>

      {/* Price */}
      <div className="text-left shrink-0 hidden sm:block">
        <p
          className="text-lg font-bold text-deep-brown tabular-nums"
          style={{ fontFamily: 'var(--font-family-headline)' }}
        >
          ₪{order.price}
        </p>
      </div>
    </motion.div>
  )
}
