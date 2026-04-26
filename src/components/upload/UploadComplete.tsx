import { useRef } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router'
import { useAlbumStore } from '../../store/albumStore'
import { useFileUpload } from '../../hooks/useFileUpload'
import Icon from '../shared/Icon'

const MIN_PHOTOS = 20

export default function UploadComplete() {
  const photos = useAlbumStore((s) => s.photos)
  const { processFiles, addSamplePhotoBatch } = useFileUpload()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  const displayPhotos = photos.slice(0, 7)
  const remaining = photos.length - 7
  const belowMin = photos.length < MIN_PHOTOS
  const needed = MIN_PHOTOS - photos.length
  const progress = Math.min((photos.length / MIN_PHOTOS) * 100, 100)

  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files, true)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto"
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,.heic,.heif,.tiff,.tif"
        onChange={handleAddFiles}
        className="hidden"
      />

      {/* Success icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, ease: [0.175, 0.885, 0.32, 1.275] }}
        className="w-14 h-14 rounded-full flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, rgba(139,133,115,0.12) 0%, rgba(139,133,115,0.04) 100%)',
        }}
      >
        <Icon name="check_circle" filled size={34} className="text-sage" />
      </motion.div>

      <motion.h3
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="text-xl font-bold text-deep-brown"
        style={{ fontFamily: 'var(--font-family-headline)' }}
      >
        {photos.length} תמונות — מעולה!
      </motion.h3>

      {/* Thumbnail strip */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="flex gap-2.5 justify-center flex-wrap"
      >
        {displayPhotos.map((photo, i) => (
          <motion.div
            key={photo.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.04, duration: 0.35 }}
            className="w-[52px] h-[52px] rounded-xl overflow-hidden ring-1 ring-black/[0.04] shadow-sm"
          >
            <img src={photo.thumbnailUrl} alt="" className="w-full h-full object-cover" />
          </motion.div>
        ))}
        {remaining > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.58, duration: 0.35 }}
            className="w-[52px] h-[52px] rounded-xl bg-surface-container-high flex items-center justify-center ring-1 ring-black/[0.04]"
          >
            <span className="text-[11px] font-bold text-warm-gray">+{remaining}</span>
          </motion.div>
        )}
      </motion.div>

      {/* Progress / status area */}
      {belowMin ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.45 }}
          className="w-full rounded-2xl p-6 flex flex-col gap-5"
          style={{
            background: 'linear-gradient(160deg, rgba(139,133,115,0.06) 0%, rgba(250,250,247,0.9) 50%, rgba(139,133,115,0.04) 100%)',
            boxShadow: '0 2px 20px rgba(90, 80, 70, 0.06), inset 0 1px 0 rgba(255,255,255,0.7)',
          }}
        >
          {/* Progress indicator */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-deep-brown/80">
                {photos.length} מתוך {MIN_PHOTOS} תמונות מינימום
              </span>
              <span className="text-xs text-sage font-semibold tabular-nums">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ delay: 0.5, duration: 0.7, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #57534E 0%, #8B8573 100%)',
                }}
              />
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-secondary leading-relaxed">
              {needed === 1
                ? 'חסרה עוד תמונה אחת כדי להמשיך'
                : `חסרות עוד ${needed} תמונות כדי להמשיך`}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => inputRef.current?.click()}
              className="btn-press flex-1 py-3.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-shadow hover:shadow-md"
              style={{
                background: '#2D2926',
                boxShadow: '0 4px 14px rgba(26,23,20,0.2)',
              }}
            >
              <Icon name="add_photo_alternate" size={18} />
              העלה תמונות נוספות
            </button>
            <button
              onClick={() => addSamplePhotoBatch(needed + 5, true)}
              className="btn-press py-3.5 px-5 rounded-xl text-xs font-medium text-warm-gray bg-white/60 ring-1 ring-black/[0.05] hover:bg-white/90 transition-colors"
            >
              דמו +{needed + 5}
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <button
            onClick={() => inputRef.current?.click()}
            className="btn-press flex items-center gap-2 text-sm text-sage font-medium px-5 py-2.5 rounded-full bg-sage/[0.06] hover:bg-sage/[0.1] transition-colors"
          >
            <Icon name="add_photo_alternate" size={17} />
            הוסף עוד תמונות
          </button>
        </motion.div>
      )}

      {/* AI reassurance */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.4 }}
        className="flex items-start gap-3.5 rounded-2xl p-5 w-full"
        style={{
          background: 'linear-gradient(135deg, rgba(232,228,220,0.25) 0%, rgba(250,250,247,0.6) 100%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)',
        }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, rgba(139,133,115,0.12) 0%, rgba(139,133,115,0.04) 100%)' }}
        >
          <Icon name="auto_awesome" filled size={18} className="text-sage" />
        </div>
        <div className="text-sm pt-0.5">
          <p className="font-semibold text-deep-brown mb-1">מפה אנחנו לוקחים</p>
          <p className="text-secondary/80 text-[13px] leading-relaxed">
            נסנן כפילויות, נבחר את הטובות, ונסדר לפי הסיפור שלכם.
          </p>
        </div>
      </motion.div>

      {/* Continue button */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.4 }}
        className="w-full"
      >
        <button
          onClick={() => navigate('/curate')}
          disabled={belowMin}
          className={`btn-press w-full py-4 rounded-2xl font-semibold text-lg transition-shadow ${
            belowMin
              ? 'bg-surface-container-high text-on-surface-variant/30 cursor-not-allowed'
              : 'text-white'
          }`}
          style={!belowMin ? {
            background: '#2D2926',
            boxShadow: '0 8px 24px rgba(26, 23, 20, 0.2), 0 2px 8px rgba(26, 23, 20, 0.1)',
          } : undefined}
        >
          המשך
        </button>
      </motion.div>
    </motion.div>
  )
}
