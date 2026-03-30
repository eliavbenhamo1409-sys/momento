import { motion, AnimatePresence } from 'motion/react'
import { useAlbumStore } from '../../store/albumStore'

const previewImages: Record<string, string> = {
  wedding: 'https://picsum.photos/seed/preview-wedding/400/500',
  family: 'https://picsum.photos/seed/preview-family/400/500',
  baby: 'https://picsum.photos/seed/preview-baby/400/500',
  travel: 'https://picsum.photos/seed/preview-travel/400/500',
  event: 'https://picsum.photos/seed/preview-event/400/500',
}

const styleLabels: Record<string, string> = {
  classic: 'קלאסי',
  modern: 'מודרני',
  warm: 'חם',
  minimal: 'מינימליסטי',
}

export default function LivePreview() {
  const { config } = useAlbumStore()
  const imgSrc = config.type ? previewImages[config.type] : null

  return (
    <div className="bg-surface-container rounded-2xl p-8 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-deep-brown text-sm" style={{ fontFamily: 'var(--font-family-headline)' }}>
          תצוגה מקדימה
        </h3>
        <span className="px-3 py-1 bg-white/50 text-[10px] font-bold uppercase tracking-widest rounded text-on-surface-variant">
          Live Draft
        </span>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {imgSrc ? (
            <motion.div
              key={config.type}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="flex gap-[2px] editorial-shadow transform rotate-1"
            >
              <div className="w-36 h-48 bg-white rounded-r-sm p-3 flex flex-col gap-2">
                <div className="flex-1 bg-surface-container rounded-sm overflow-hidden">
                  <img
                    src={imgSrc}
                    alt="Preview"
                    className={`w-full h-full object-cover ${
                      config.mood === 'nostalgic' ? 'sepia' : ''
                    } ${config.style === 'minimal' ? 'grayscale-[20%]' : ''}`}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="w-2/3 h-1.5 bg-surface-container-low rounded-full" />
                <div className="w-1/2 h-1.5 bg-surface-container-low rounded-full" />
              </div>
              <div className="w-36 h-48 bg-white rounded-l-sm p-3 grid grid-cols-2 grid-rows-2 gap-1.5">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="bg-surface-container rounded-sm overflow-hidden">
                    <img
                      src={`https://picsum.photos/seed/prev-${config.type}-${n}/200/200`}
                      alt=""
                      className={`w-full h-full object-cover ${
                        config.mood === 'nostalgic' ? 'sepia' : ''
                      }`}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-on-surface-variant/50"
            >
              <span className="material-symbols-outlined text-5xl mb-3 block opacity-30">
                auto_stories
              </span>
              <p className="text-sm">הבחירות שלך יופיעו כאן</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {config.style && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-auto pt-6 border-t border-outline-variant/10 flex items-center gap-2 text-on-surface-variant text-xs"
        >
          <span className="material-symbols-outlined text-sm">info</span>
          <p className="italic">
            העיצוב ה{styleLabels[config.style] || ''} נבחר כברירת מחדל
          </p>
        </motion.div>
      )}
    </div>
  )
}
