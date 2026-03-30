import { motion } from 'motion/react'

interface SkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: string | number
  className?: string
}

export default function Skeleton({
  width = '100%',
  height = '100%',
  borderRadius = 8,
  className = '',
}: SkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
      className={`skeleton-shimmer ${className}`}
      style={{
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, var(--color-surface-container) 25%, var(--color-surface-container-low) 50%, var(--color-surface-container) 75%)',
        backgroundSize: '200% 100%',
      }}
    />
  )
}
