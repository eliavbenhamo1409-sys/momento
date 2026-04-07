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
    <button
      className={`btn-press ${className}`}
      disabled={isDisabled}
      style={isDisabled ? { opacity: loading ? 0.85 : 0.5, pointerEvents: 'none' } : undefined}
      {...rest}
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
    </button>
  )
}
