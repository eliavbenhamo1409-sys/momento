import { useState, useRef, useCallback } from 'react'
import { motion } from 'motion/react'
import Icon from '../shared/Icon'
import LoadingButton from '../shared/LoadingButton'
import { useFileUpload } from '../../hooks/useFileUpload'

export default function UploadDropzone() {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { processFiles, simulateUpload } = useFileUpload()

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files)
      }
    },
    [processFiles],
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
      className="w-full max-w-lg mx-auto"
    >
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed flex flex-col items-center justify-center py-16 px-8 transition-all duration-200 ${
          isDragging
            ? 'border-sage bg-sage/[0.06] scale-[1.01]'
            : 'border-outline-variant/30 bg-surface-container hover:border-primary/40 hover:bg-surface-container-high'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="w-20 h-20 rounded-full bg-primary-fixed flex items-center justify-center mb-6">
          <Icon
            name="cloud_upload"
            size={36}
            className="text-primary"
          />
        </div>

        <h3 className="text-xl font-medium mb-2" style={{ fontFamily: 'var(--font-family-headline)' }}>
          {isDragging ? 'שחרר כדי להעלות' : 'גרור תמונות לכאן'}
        </h3>
        <p className="text-secondary text-sm mb-6">
          או לחץ לבחירה מהמחשב או מהטלפון
        </p>

        <div className="flex gap-3">
          <span className="flex items-center gap-1.5 px-4 py-2 bg-surface-container-highest rounded-full text-xs text-secondary font-medium">
            <Icon name="photo_library" size={14} />
            JPG, PNG, HEIC
          </span>
          <span className="flex items-center gap-1.5 px-4 py-2 bg-surface-container-highest rounded-full text-xs text-secondary font-medium">
            <Icon name="speed" size={14} />
            עד 500 תמונות
          </span>
        </div>
      </div>

      <LoadingButton
        onClick={(e) => {
          e.stopPropagation()
          simulateUpload(78)
        }}
        className="mt-4 mx-auto block text-xs text-sage hover:underline"
      >
        הדגמה — העלה 78 תמונות לדוגמה
      </LoadingButton>
    </motion.div>
  )
}
