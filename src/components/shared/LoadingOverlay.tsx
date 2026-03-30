import { motion } from 'motion/react'
import { overlayFade } from '../../lib/animations'

interface LoadingOverlayProps {
  label?: string
  fullScreen?: boolean
  className?: string
}

export default function LoadingOverlay({
  label,
  fullScreen = true,
  className = '',
}: LoadingOverlayProps) {
  return (
    <motion.div
      variants={overlayFade}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`${
        fullScreen ? 'fixed inset-0 z-50' : 'absolute inset-0 z-10'
      } flex flex-col items-center justify-center gap-5 ${className}`}
      style={{
        background: 'radial-gradient(ellipse at 50% 40%, rgba(247,241,241,0.97) 0%, rgba(247,241,241,0.92) 100%)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="relative flex items-center justify-center">
        <motion.div
          className="w-10 h-10 rounded-full border-2 border-sage/30"
          style={{ borderTopColor: 'var(--color-sage)' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute w-5 h-5 rounded-full bg-sage/10"
          animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.15, 0.4] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {label && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="text-sm font-medium text-warm-gray font-headline"
        >
          {label}
        </motion.p>
      )}
    </motion.div>
  )
}
