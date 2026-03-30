import { motion } from 'motion/react'
import type { ReactNode, ButtonHTMLAttributes } from 'react'

interface LoadingButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children: ReactNode
  loading?: boolean
  loadingLabel?: string
  className?: string
}

export default function LoadingButton({
  children,
  loading = false,
  loadingLabel,
  className = '',
  disabled,
  ...rest
}: LoadingButtonProps) {
  const isDisabled = disabled || loading

  return (
    <motion.button
      whileTap={isDisabled ? undefined : { scale: 0.97 }}
      whileHover={isDisabled ? undefined : { scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={className}
      disabled={isDisabled}
      style={isDisabled ? { opacity: loading ? 0.85 : 0.5, pointerEvents: 'none' } : undefined}
      {...(rest as Record<string, unknown>)}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span
            className="inline-block w-4 h-4 rounded-full border-2 border-current/30 animate-spin"
            style={{ borderTopColor: 'currentColor' }}
          />
          {loadingLabel && <span>{loadingLabel}</span>}
        </span>
      ) : (
        children
      )}
    </motion.button>
  )
}
