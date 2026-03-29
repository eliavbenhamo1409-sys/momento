import { motion } from 'motion/react'
import Icon from '../shared/Icon'

interface Props {
  icon: string
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export default function EmptyState({ icon, title, description, actionLabel, onAction }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
        style={{
          background: 'linear-gradient(135deg, rgba(142,137,115,0.08) 0%, rgba(142,137,115,0.03) 100%)',
        }}
      >
        <Icon name={icon} size={36} className="text-sage/50" />
      </div>

      <h3
        className="text-xl font-semibold text-deep-brown/70 mb-2"
        style={{ fontFamily: 'var(--font-family-headline)' }}
      >
        {title}
      </h3>
      <p className="text-sm text-warm-gray mb-6 max-w-xs">{description}</p>

      {actionLabel && onAction && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAction}
          className="px-6 py-3 rounded-xl text-sm font-semibold text-white transition-shadow"
          style={{
            background: 'linear-gradient(135deg, #8E8973 0%, #7B7660 100%)',
            boxShadow: '0 4px 16px rgba(142,137,115,0.25)',
          }}
        >
          {actionLabel}
        </motion.button>
      )}
    </motion.div>
  )
}
