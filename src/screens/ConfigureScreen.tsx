import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import PageTransition from '../components/shared/PageTransition'
import ProductLayout from '../components/layout/ProductLayout'
import Icon from '../components/shared/Icon'
import { useAlbumStore } from '../store/albumStore'
import {
  ALBUM_SIZES,
  PAGE_OPTIONS,
  PRICE_PER_EXTRA_SPREAD,
  calcAlbumPrice,
} from '../lib/constants'

export default function ConfigureScreen() {
  const navigate = useNavigate()
  const { config, setConfigField } = useAlbumStore()
  const [selectedSize, setSelectedSize] = useState(config.size || '30x30')
  const [selectedPages, setSelectedPages] = useState(config.pages || 20)
  const [extraSpreads, setExtraSpreads] = useState(0)

  const totalPages = selectedPages + extraSpreads * 2
  const price = useMemo(
    () => calcAlbumPrice(selectedSize, selectedPages) + extraSpreads * PRICE_PER_EXTRA_SPREAD,
    [selectedSize, selectedPages, extraSpreads],
  )

  const sizeObj = ALBUM_SIZES.find((s) => s.id === selectedSize)!

  const handleContinue = () => {
    setConfigField('size', selectedSize)
    setConfigField('pages', totalPages)
    navigate('/setup')
  }

  return (
    <PageTransition>
      <ProductLayout currentStep="configure" showBack backTo="/upload" backLabel="חזרה">
        <div className="h-full flex">
          {/* Right side: Configuration options */}
          <div className="flex-[55] px-12 py-6 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h1
                className="text-3xl font-bold text-deep-brown mb-2"
                style={{ fontFamily: 'var(--font-family-headline)' }}
              >
                בחרו את המפרט לאלבום
              </h1>
              <p className="text-secondary text-sm mb-8">
                גודל, מספר עמודים ותוספות — הכל ניתן לשינוי גם אחר כך.
              </p>

              {/* Album Size */}
              <div className="mb-8">
                <label className="text-xs font-bold text-secondary uppercase tracking-wider block mb-3">
                  גודל אלבום
                </label>
                <div className="flex gap-4">
                  {ALBUM_SIZES.map((size) => {
                    const active = selectedSize === size.id
                    return (
                      <button
                        key={size.id}
                        onClick={() => setSelectedSize(size.id)}
                        className={`flex-1 rounded-xl p-5 transition-all duration-200 border-2 text-right ${
                          active
                            ? 'border-sage bg-sage/5 shadow-md'
                            : 'border-outline-variant/20 bg-surface-container-lowest hover:border-outline-variant/40'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              active ? 'border-sage' : 'border-outline-variant/40'
                            }`}
                          >
                            {active && <div className="w-2.5 h-2.5 rounded-full bg-sage" />}
                          </div>
                          {size.id === '60x60' && (
                            <span className="text-[10px] font-bold text-sage bg-sage/10 px-2 py-0.5 rounded-full">
                              פרימיום
                            </span>
                          )}
                        </div>
                        <p className="text-lg font-bold text-deep-brown mb-0.5" style={{ fontFamily: 'var(--font-family-headline)' }}>
                          {size.label}
                        </p>
                        <p className="text-xs text-warm-gray">
                          פתוח: {size.openDimensions} ס"מ
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Page Count */}
              <div className="mb-8">
                <label className="text-xs font-bold text-secondary uppercase tracking-wider block mb-3">
                  מספר עמודים
                </label>
                <div className="flex gap-3">
                  {PAGE_OPTIONS.map((p) => {
                    const active = selectedPages === p
                    return (
                      <button
                        key={p}
                        onClick={() => { setSelectedPages(p); setExtraSpreads(0) }}
                        className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all duration-150 ${
                          active
                            ? 'bg-sage text-white shadow-lg shadow-sage/20'
                            : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-variant'
                        }`}
                      >
                        {p} עמודים
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Extra Spreads */}
              <div className="mb-8">
                <label className="text-xs font-bold text-secondary uppercase tracking-wider block mb-3">
                  דפים נוספים
                  <span className="text-warm-gray font-normal mr-2">(כל דף = 2 עמודים, ₪{PRICE_PER_EXTRA_SPREAD} לדף)</span>
                </label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setExtraSpreads(Math.max(0, extraSpreads - 1))}
                    disabled={extraSpreads === 0}
                    className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant hover:bg-surface-variant transition-colors disabled:opacity-30"
                  >
                    <Icon name="remove" size={20} />
                  </button>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-deep-brown w-8 text-center" style={{ fontFamily: 'var(--font-family-headline)' }}>
                      {extraSpreads}
                    </span>
                    <span className="text-xs text-warm-gray">
                      {extraSpreads > 0 ? `(+${extraSpreads * 2} עמודים)` : 'ללא תוספת'}
                    </span>
                  </div>
                  <button
                    onClick={() => setExtraSpreads(extraSpreads + 1)}
                    className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant hover:bg-surface-variant transition-colors"
                  >
                    <Icon name="add" size={20} />
                  </button>
                </div>
              </div>

              {/* Continue */}
              <button
                onClick={handleContinue}
                className="w-full py-4 bg-primary text-on-primary rounded-xl text-lg font-bold shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] transition-all"
              >
                המשך לעיצוב הסגנון
              </button>
            </motion.div>
          </div>

          {/* Left side: Live summary card */}
          <div className="flex-[45] p-6 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="w-full max-w-sm"
            >
              {/* Album visual mock */}
              <div className="relative mb-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedSize}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="flex justify-center"
                  >
                    {/* Closed album */}
                    <div
                      className="bg-surface-container-lowest rounded-sm editorial-shadow relative overflow-hidden flex items-center justify-center"
                      style={{
                        width: selectedSize === '60x60' ? 200 : 160,
                        height: selectedSize === '60x60' ? 200 : 160,
                      }}
                    >
                      <div className="absolute inset-3 border border-outline-variant/20 rounded-sm" />
                      <div className="text-center z-10">
                        <p className="text-xs text-outline-variant mb-1">ס"מ</p>
                        <p className="text-xl font-bold text-deep-brown" style={{ fontFamily: 'var(--font-family-headline)' }}>
                          {sizeObj.closedDimensions}
                        </p>
                      </div>
                      {/* Spine effect */}
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-r from-black/[0.06] to-transparent" />
                    </div>
                    {/* Open spread hint */}
                    <div
                      className="bg-surface-container-high rounded-sm absolute -z-10 opacity-40"
                      style={{
                        width: selectedSize === '60x60' ? 220 : 180,
                        height: selectedSize === '60x60' ? 200 : 160,
                        top: 4,
                        right: -10,
                        transform: 'rotate(2deg)',
                      }}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Summary card */}
              <div className="bg-surface-container rounded-2xl p-6 space-y-4">
                <h3
                  className="font-bold text-deep-brown text-sm"
                  style={{ fontFamily: 'var(--font-family-headline)' }}
                >
                  סיכום המפרט
                </h3>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-warm-gray">גודל</span>
                    <span className="font-medium">{sizeObj.label}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-warm-gray">פתוח</span>
                    <span className="font-medium">{sizeObj.openDimensions} ס"מ</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-warm-gray">עמודים</span>
                    <span className="font-medium">
                      {totalPages} עמודים
                      {extraSpreads > 0 && (
                        <span className="text-sage text-xs mr-1">({selectedPages}+{extraSpreads * 2})</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-warm-gray">דפים (ספר פתוח)</span>
                    <span className="font-medium">{Math.floor(totalPages / 2)} דפים</span>
                  </div>
                </div>

                <div className="border-t border-muted-border/20 pt-4">
                  {extraSpreads > 0 && (
                    <div className="flex justify-between items-center text-xs text-warm-gray mb-2">
                      <span>תוספת {extraSpreads} דפים</span>
                      <span>+₪{extraSpreads * PRICE_PER_EXTRA_SPREAD}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-deep-brown">מחיר</span>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={price}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.15 }}
                        className="text-2xl font-bold text-deep-brown"
                        style={{ fontFamily: 'var(--font-family-headline)' }}
                      >
                        ₪{price}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                  <p className="text-[11px] text-warm-gray mt-1">כולל כריכה קשה, עיצוב AI ומשלוח חינם</p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs text-warm-gray justify-center">
                <Icon name="info" size={14} />
                <span>תמיד ניתן להוסיף עמודים נוספים גם אחר כך</span>
              </div>
            </motion.div>
          </div>
        </div>
      </ProductLayout>
    </PageTransition>
  )
}
