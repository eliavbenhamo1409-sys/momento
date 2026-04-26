import { useState, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import PageTransition from '../components/shared/PageTransition'
import ProductLayout from '../components/layout/ProductLayout'
import LoadingButton from '../components/shared/LoadingButton'
import Icon from '../components/shared/Icon'
import OffScreenSpreadRenderer from '../components/export/OffScreenSpreadRenderer'
import { useAlbumStore } from '../store/albumStore'
import { useEditorStore } from '../store/editorStore'
import { useUIStore } from '../store/uiStore'
import { calcAlbumPrice, ALBUM_SIZES } from '../lib/constants'
import { exportSpreadToBlob, calc300DpiScale } from '../lib/exportSpread'
import {
  createOrder,
  updateOrderExport,
  updateAlbumStatus,
  uploadExportPage,
  type ShippingAddress,
} from '../lib/orderService'

type CheckoutStep = 'details' | 'payment'

type ExportPhase =
  | { step: 'idle' }
  | { step: 'creating-order' }
  | { step: 'exporting'; current: number; total: number }
  | { step: 'uploading'; current: number; total: number }
  | { step: 'finalizing' }
  | { step: 'error'; message: string }

const STEPS: { key: CheckoutStep; label: string; icon: string }[] = [
  { key: 'details', label: 'פרטים אישיים', icon: 'person' },
  { key: 'payment', label: 'תשלום', icon: 'credit_card' },
]

export default function CheckoutScreen() {
  const navigate = useNavigate()
  const config = useAlbumStore((s) => s.config)
  const albumTitle = useAlbumStore((s) => s.albumTitle)
  const albumId = useAlbumStore((s) => s.albumId)
  const spreads = useEditorStore((s) => s.spreads)
  const userId = useUIStore((s) => s.userId)
  const sizeObj = ALBUM_SIZES.find((s) => s.id === config.size)
  const totalPrice = useMemo(() => calcAlbumPrice(config.size, config.pages), [config.size, config.pages])
  const spreadCount = spreads.length
  const pageCount = spreadCount * 2

  const coverUrl = useMemo(() => {
    for (const s of spreads) {
      if (s.design) {
        for (const el of s.design.elements) {
          if (el.type === 'photo' && el.photoUrl) return el.photoUrl
        }
      }
      const first = s.leftPhotos?.find(Boolean) ?? s.rightPhotos?.find(Boolean)
      if (first) return first
    }
    return null
  }, [spreads])

  const [currentStep, setCurrentStep] = useState<CheckoutStep>('details')
  const [phase, setPhase] = useState<ExportPhase>({ step: 'idle' })
  const [isExporting, setIsExporting] = useState(false)

  const exportBlobsRef = useRef<Blob[]>([])
  const orderIdRef = useRef<string | null>(null)
  const orderNumberRef = useRef<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    address: '',
    city: '',
    zip: '',
    phone: '',
    email: '',
  })

  const update = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }))
  }

  /* ── Export callbacks (unchanged logic) ────────────────────── */

  const handleSpreadReady = useCallback(async (_index: number, element: HTMLDivElement) => {
    const scale = calc300DpiScale(element.offsetWidth, config.size)
    const blob = await exportSpreadToBlob(element, {
      scale,
      quality: 0.92,
      backgroundColor: '#FFFFFF',
    })
    exportBlobsRef.current.push(blob)
    setPhase({ step: 'exporting', current: exportBlobsRef.current.length, total: spreadCount })
  }, [config.size, spreadCount])

  const handleExportComplete = useCallback(async () => {
    const blobs = exportBlobsRef.current
    const oId = orderIdRef.current
    if (!oId || !userId) return

    setPhase({ step: 'uploading', current: 0, total: blobs.length })

    try {
      const paths: string[] = []
      for (let i = 0; i < blobs.length; i++) {
        const path = await uploadExportPage(userId, oId, i, blobs[i])
        paths.push(path)
        setPhase({ step: 'uploading', current: i + 1, total: blobs.length })
      }

      setPhase({ step: 'finalizing' })
      await updateOrderExport(oId, paths)

      if (albumId) {
        await updateAlbumStatus(albumId, 'ordered')
      }

      navigate('/confirmation', { state: { orderId: oId, orderNumber: orderNumberRef.current } })
    } catch (err) {
      setPhase({ step: 'error', message: err instanceof Error ? err.message : 'שגיאה בהעלאת קבצים' })
      setIsExporting(false)
    }
  }, [userId, albumId, navigate])

  const handleExportError = useCallback((error: Error) => {
    setPhase({ step: 'error', message: error.message })
    setIsExporting(false)
  }, [])

  /* ── Place order (no payment required for now) ────────────── */

  const handlePlaceOrder = async () => {
    if (!userId || !albumId) {
      setPhase({ step: 'error', message: 'יש להתחבר כדי להשלים הזמנה' })
      return
    }

    setIsExporting(true)
    setPhase({ step: 'creating-order' })

    try {
      const shipping: ShippingAddress = {
        name: form.name || 'לא צוין',
        address: form.address || 'לא צוין',
        city: form.city || 'לא צוין',
        zip: form.zip || '',
        phone: form.phone || 'לא צוין',
      }

      const order = await createOrder(userId, albumId, shipping, totalPrice, config)
      orderIdRef.current = order.id
      orderNumberRef.current = order.order_number

      exportBlobsRef.current = []
      setPhase({ step: 'exporting', current: 0, total: spreadCount })
    } catch (err) {
      setPhase({ step: 'error', message: err instanceof Error ? err.message : 'שגיאה ביצירת הזמנה' })
      setIsExporting(false)
    }
  }

  const isProcessing = phase.step !== 'idle' && phase.step !== 'error'

  const inputClass =
    'w-full px-4 py-3 rounded-xl bg-white border border-black/[0.08] text-sm outline-none transition-all focus:ring-2 focus:ring-sage/20 focus:border-sage/40 placeholder:text-warm-gray/40'

  return (
    <PageTransition>
      <ProductLayout
        showSteps={false}
        showBack
        backTo={currentStep === 'payment' ? undefined : (albumId ? `/editor/${albumId}` : '/dashboard')}
        backLabel={currentStep === 'payment' ? 'חזור לפרטים' : 'חזור לעורך'}
        onBack={currentStep === 'payment' ? () => setCurrentStep('details') : undefined}
      >
        <div className="h-full flex flex-col items-center px-4 sm:px-6 pt-2 pb-8 overflow-y-auto">
          {/* ── Step indicator ─────────────────────────────── */}
          <div className="flex items-center gap-3 mb-8 mt-2">
            {STEPS.map((s, i) => {
              const isActive = s.key === currentStep
              const isPast = STEPS.findIndex((x) => x.key === currentStep) > i
              return (
                <div key={s.key} className="flex items-center gap-3">
                  {i > 0 && (
                    <div
                      className="w-10 sm:w-16 h-px transition-colors duration-300"
                      style={{ backgroundColor: isPast ? 'var(--color-sage)' : 'rgba(0,0,0,0.08)' }}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (isPast) setCurrentStep(s.key)
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? 'bg-sage/12 text-sage shadow-[0_1px_4px_rgba(120,140,100,0.12)]'
                        : isPast
                          ? 'bg-sage/6 text-sage/70 cursor-pointer hover:bg-sage/10'
                          : 'bg-black/[0.03] text-warm-gray/60'
                    }`}
                  >
                    <Icon name={isPast ? 'check_circle' : s.icon} size={16} filled={isPast} />
                    <span className="hidden sm:inline">{s.label}</span>
                    <span className="sm:hidden">{i + 1}</span>
                  </button>
                </div>
              )
            })}
          </div>

          {/* ── Step content ───────────────────────────────── */}
          <div className="w-full max-w-lg">
            <AnimatePresence mode="wait">
              {currentStep === 'details' && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  {/* Order summary card */}
                  <div
                    className="rounded-2xl p-5 sm:p-6 mb-6"
                    style={{
                      background: 'rgba(255,255,255,0.75)',
                      backdropFilter: 'blur(12px)',
                      boxShadow: '0 2px 20px rgba(45,40,35,0.06), 0 1px 4px rgba(45,40,35,0.03)',
                      border: '1px solid rgba(0,0,0,0.05)',
                    }}
                  >
                    <h2
                      className="text-xl font-semibold mb-5"
                      style={{ fontFamily: 'var(--font-family-headline)' }}
                    >
                      סיכום הזמנה
                    </h2>

                    <div className="flex gap-5 mb-5">
                      <div className="w-24 h-28 sm:w-28 sm:h-32 rounded-xl overflow-hidden bg-surface-container shrink-0 ring-1 ring-black/[0.04]">
                        {coverUrl ? (
                          <img
                            src={coverUrl}
                            alt="כריכת האלבום"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-warm-gray/40">
                            <Icon name="menu_book" size={32} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3
                          className="font-semibold text-lg mb-3 truncate"
                          style={{ fontFamily: 'var(--font-family-headline)' }}
                        >
                          {albumTitle}
                        </h3>
                        <div className="space-y-1.5 text-sm">
                          <div className="flex justify-between gap-4">
                            <span className="text-warm-gray">פורמט</span>
                            <span className="font-medium">{sizeObj?.label ?? config.size}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-warm-gray">פתוח</span>
                            <span className="font-medium">{sizeObj?.openDimensions} ס"מ</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-warm-gray">עמודים</span>
                            <span className="font-medium">{pageCount}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-warm-gray">כריכה</span>
                            <span className="font-medium">כריכה קשה</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-black/[0.06] pt-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-warm-gray">סכום ביניים</span>
                        <span className="font-medium tabular-nums">₪{totalPrice}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-warm-gray">משלוח</span>
                        <span className="text-sage font-medium">חינם</span>
                      </div>
                      <div
                        className="flex justify-between pt-3 border-t border-black/[0.06] text-lg font-semibold"
                        style={{ fontFamily: 'var(--font-family-headline)' }}
                      >
                        <span>סה"כ</span>
                        <span className="tabular-nums">₪{totalPrice}</span>
                      </div>
                    </div>
                  </div>

                  {/* Personal details form */}
                  <div
                    className="rounded-2xl p-5 sm:p-6 mb-6"
                    style={{
                      background: 'rgba(255,255,255,0.75)',
                      backdropFilter: 'blur(12px)',
                      boxShadow: '0 2px 20px rgba(45,40,35,0.06), 0 1px 4px rgba(45,40,35,0.03)',
                      border: '1px solid rgba(0,0,0,0.05)',
                    }}
                  >
                    <h2
                      className="text-xl font-semibold mb-5"
                      style={{ fontFamily: 'var(--font-family-headline)' }}
                    >
                      פרטי משלוח
                    </h2>

                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-medium text-deep-brown/70 mb-1.5 block">שם מלא</label>
                        <input
                          className={inputClass}
                          value={form.name}
                          onChange={(e) => update('name', e.target.value)}
                          placeholder="ישראל ישראלי"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-deep-brown/70 mb-1.5 block">טלפון</label>
                        <input
                          className={inputClass}
                          value={form.phone}
                          onChange={(e) => update('phone', e.target.value)}
                          dir="ltr"
                          placeholder="050-0000000"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-deep-brown/70 mb-1.5 block">אימייל</label>
                        <input
                          className={inputClass}
                          value={form.email}
                          onChange={(e) => update('email', e.target.value)}
                          dir="ltr"
                          type="email"
                          placeholder="email@example.com"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-deep-brown/70 mb-1.5 block">כתובת</label>
                        <input
                          className={inputClass}
                          value={form.address}
                          onChange={(e) => update('address', e.target.value)}
                          placeholder="רחוב, מספר בית, דירה"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-deep-brown/70 mb-1.5 block">עיר</label>
                          <input
                            className={inputClass}
                            value={form.city}
                            onChange={(e) => update('city', e.target.value)}
                            placeholder="תל אביב"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-deep-brown/70 mb-1.5 block">מיקוד</label>
                          <input
                            className={inputClass}
                            value={form.zip}
                            onChange={(e) => update('zip', e.target.value)}
                            dir="ltr"
                            placeholder="0000000"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <motion.button
                    type="button"
                    onClick={() => setCurrentStep('payment')}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3.5 bg-sage text-white rounded-xl font-bold text-base shadow-lg shadow-sage/20 hover:shadow-xl hover:shadow-sage/25 transition-shadow flex items-center justify-center gap-2"
                    style={{ fontFamily: 'var(--font-family-headline)' }}
                  >
                    <span>המשך לתשלום</span>
                    <Icon name="arrow_back" size={18} />
                  </motion.button>
                </motion.div>
              )}

              {currentStep === 'payment' && (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  {/* Total card */}
                  <div
                    className="rounded-2xl p-5 sm:p-6 mb-6"
                    style={{
                      background: 'rgba(255,255,255,0.75)',
                      backdropFilter: 'blur(12px)',
                      boxShadow: '0 2px 20px rgba(45,40,35,0.06), 0 1px 4px rgba(45,40,35,0.03)',
                      border: '1px solid rgba(0,0,0,0.05)',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-warm-gray mb-0.5">סה"כ לתשלום</p>
                        <p
                          className="text-3xl font-bold tabular-nums"
                          style={{ fontFamily: 'var(--font-family-headline)' }}
                        >
                          ₪{totalPrice}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 text-xs text-warm-gray">
                        <span>{albumTitle}</span>
                        <span>{pageCount} עמודים · {sizeObj?.label}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card capture: UI only; wire PSP (e.g. Stripe) for production */}
                  <div
                    className="rounded-2xl p-5 sm:p-6 mb-6 relative overflow-hidden"
                    style={{
                      background: 'rgba(255,255,255,0.55)',
                      backdropFilter: 'blur(12px)',
                      boxShadow: '0 2px 20px rgba(45,40,35,0.06), 0 1px 4px rgba(45,40,35,0.03)',
                      border: '1px solid rgba(0,0,0,0.05)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-5">
                      <h2
                        className="text-xl font-semibold"
                        style={{ fontFamily: 'var(--font-family-headline)' }}
                      >
                        פרטי תשלום
                      </h2>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                        בקרוב
                      </span>
                    </div>

                    <div className="space-y-4 opacity-40 pointer-events-none select-none">
                      <div>
                        <label className="text-xs font-medium text-deep-brown/70 mb-1.5 block">מספר כרטיס</label>
                        <input
                          className={inputClass}
                          disabled
                          dir="ltr"
                          placeholder="0000 0000 0000 0000"
                        />
                      </div>
                      <div className="grid grid-cols-5 gap-3">
                        <div className="col-span-3">
                          <label className="text-xs font-medium text-deep-brown/70 mb-1.5 block">תוקף</label>
                          <input
                            className={inputClass}
                            disabled
                            dir="ltr"
                            placeholder="MM / YY"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-xs font-medium text-deep-brown/70 mb-1.5 block">CVV</label>
                          <input
                            className={inputClass}
                            disabled
                            dir="ltr"
                            placeholder="•••"
                          />
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-warm-gray/70 text-center mt-4">
                      שילוב מערכת סליקה יתווסף בקרוב
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-warm-gray mb-4 justify-center">
                    <Icon name="lock" size={14} />
                    <span>ההזמנה תישלח ללא חיוב בשלב זה</span>
                  </div>

                  <LoadingButton
                    type="button"
                    onClick={handlePlaceOrder}
                    loading={isProcessing}
                    loadingLabel="מעבד..."
                    className="w-full py-3.5 bg-sage text-white rounded-xl font-bold text-lg shadow-lg shadow-sage/20 hover:shadow-xl hover:shadow-sage/25 transition-shadow"
                  >
                    {`השלם הזמנה — ₪${totalPrice}`}
                  </LoadingButton>

                  {phase.step === 'error' && (
                    <motion.p
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-error text-center mt-3"
                    >
                      {phase.message}
                    </motion.p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Processing overlay ───────────────────────────── */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="bg-white rounded-2xl shadow-[0_12px_48px_rgba(45,40,35,0.12)] p-8 max-w-sm w-full mx-4 text-center"
              >
                <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-sage/15 flex items-center justify-center">
                  <div className="w-7 h-7 border-[2.5px] border-sage/20 border-t-sage rounded-full animate-spin" />
                </div>

                <h3
                  className="text-xl font-semibold mb-2"
                  style={{ fontFamily: 'var(--font-family-headline)' }}
                >
                  {phase.step === 'creating-order' && 'יוצר הזמנה...'}
                  {phase.step === 'exporting' && 'מייצא עמודים'}
                  {phase.step === 'uploading' && 'מעלה קבצים'}
                  {phase.step === 'finalizing' && 'משלים הזמנה...'}
                </h3>

                <p className="text-sm text-warm-gray mb-4">
                  {phase.step === 'creating-order' && 'רגע אחד...'}
                  {phase.step === 'exporting' &&
                    `עמוד ${(phase as { current: number; total: number }).current} מתוך ${(phase as { current: number; total: number }).total}`}
                  {phase.step === 'uploading' &&
                    `קובץ ${(phase as { current: number; total: number }).current} מתוך ${(phase as { current: number; total: number }).total}`}
                  {phase.step === 'finalizing' && 'כמעט שם...'}
                </p>

                {(phase.step === 'exporting' || phase.step === 'uploading') && (
                  <div className="w-full h-1.5 bg-black/[0.05] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-sage rounded-full"
                      initial={{ width: '0%' }}
                      animate={{
                        width: `${Math.round(
                          ((phase as { current: number; total: number }).current /
                            (phase as { current: number; total: number }).total) *
                            100,
                        )}%`,
                      }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    />
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Off-screen renderer — mounted only during export */}
        {isExporting && phase.step === 'exporting' && (
          <OffScreenSpreadRenderer
            spreads={spreads}
            albumSizeId={config.size}
            onSpreadReady={handleSpreadReady}
            onComplete={handleExportComplete}
            onError={handleExportError}
          />
        )}
      </ProductLayout>
    </PageTransition>
  )
}
