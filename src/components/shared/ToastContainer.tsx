import { AnimatePresence, motion } from 'motion/react'
import { useUIStore } from '../../store/uiStore'

export default function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts)

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 items-center pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`px-6 py-3 rounded-xl text-sm font-medium shadow-lg pointer-events-auto ${
              toast.type === 'error'
                ? 'bg-error-container text-on-error-container'
                : toast.type === 'success'
                  ? 'bg-primary-fixed text-on-primary-fixed'
                  : 'bg-surface-container-lowest text-on-surface'
            }`}
          >
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
