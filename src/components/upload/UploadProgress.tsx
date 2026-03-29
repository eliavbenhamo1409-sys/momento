import { motion } from 'motion/react'
import { useAlbumStore } from '../../store/albumStore'

export default function UploadProgress() {
  const { uploadProgress, photos } = useAlbumStore()

  const circumference = 2 * Math.PI * 28
  const offset = circumference - (uploadProgress / 100) * circumference

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-center gap-6"
    >
      <div className="relative w-16 h-16">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
          <circle
            cx="32" cy="32" r="28"
            fill="none"
            stroke="var(--color-surface-container-highest)"
            strokeWidth="3"
          />
          <circle
            cx="32" cy="32" r="28"
            fill="none"
            stroke="var(--color-sage)"
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-300"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-deep-brown">
          {uploadProgress}%
        </span>
      </div>

      <p className="text-warm-gray text-sm">
        מעלה {photos.length || '...'} תמונות...
      </p>

      <div className="w-64 h-1 bg-surface-container-highest rounded-full overflow-hidden">
        <div
          className="h-full shimmer-bar rounded-full transition-all duration-300"
          style={{ width: `${uploadProgress}%` }}
        />
      </div>
    </motion.div>
  )
}
