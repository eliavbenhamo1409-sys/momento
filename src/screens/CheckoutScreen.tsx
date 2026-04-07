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

type ExportPhase =
  | { step: 'idle' }
  | { step: 'creating-order' }
  | { step: 'exporting'; current: number; total: number }
  | { step: 'uploading'; current: number; total: number }
  | { step: 'finalizing' }
  | { step: 'error'; message: string }

export default function CheckoutScreen() {
  const navigate = useNavigate()
  const config = useAlbumStore((s) => s.config)
  const albumTitle = useAlbumStore((s) => s.albumTitle)
  const albumId = useAlbumStore((s) => s.albumId)
  const spreads = useEditorStore((s) => s.spreads)
  const userId = useUIStore((s) => s.userId)
  const sizeObj = ALBUM_SIZES.find((s) => s.id === config.size)
  const totalPrice = useMemo(() => calcAlbumPrice(config.size, config.pages), [config.size, config.pages])

  const [errors, setErrors] = useState<Record<string, string>>({})
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
    cardNumber: '',
    expiry: '',
    cvv: '',
  })

  const update = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: '' }))
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.name) errs.name = 'שדה חובה'
    if (!form.address) errs.address = 'שדה חובה'
    if (!form.city) errs.city = 'שדה חובה'
    if (!form.phone) errs.phone = 'שדה חובה'
    if (!form.cardNumber) errs.cardNumber = 'שדה חובה'
    if (!form.expiry) errs.expiry = 'שדה חובה'
    if (!form.cvv) errs.cvv = 'שדה חובה'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSpreadReady = useCallback(async (_index: number, element: HTMLDivElement) => {
    const scale = calc300DpiScale(element.offsetWidth, config.size)
    const blob = await exportSpreadToBlob(element, {
      scale,
      quality: 0.92,
      backgroundColor: '#FFFFFF',
    })
    exportBlobsRef.current.push(blob)
    setPhase({ step: 'exporting', current: exportBlobsRef.current.length, total: spreads.length })
  }, [config.size, spreads.length])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    if (!userId || !albumId) {
      setPhase({ step: 'error', message: 'יש להתחבר כדי להשלים הזמנה' })
      return
    }

    setIsExporting(true)
    setPhase({ step: 'creating-order' })

    try {
      const shipping: ShippingAddress = {
        name: form.name,
        address: form.address,
        city: form.city,
        zip: form.zip,
        phone: form.phone,
      }

      const order = await createOrder(userId, albumId, shipping, totalPrice, config)
      orderIdRef.current = order.id
      orderNumberRef.current = order.order_number

      exportBlobsRef.current = []
      setPhase({ step: 'exporting', current: 0, total: spreads.length })
    } catch (err) {
      setPhase({ step: 'error', message: err instanceof Error ? err.message : 'שגיאה ביצירת הזמנה' })
      setIsExporting(false)
    }
  }

  const isProcessing = phase.step !== 'idle' && phase.step !== 'error'

  const inputClass = (field: string) =>
    `w-full px-4 py-2.5 rounded-lg bg-surface-container-lowest border text-sm outline-none transition-all ${
      errors[field]
        ? 'border-error focus:ring-2 focus:ring-error/20'
        : 'border-muted-border/40 focus:ring-2 focus:ring-primary/20 focus:border-primary/40'
    }`

  return (
    <PageTransition>
      <ProductLayout
        showSteps={false}
        showBack
        backTo={albumId ? `/editor/${albumId}` : '/dashboard'}
        backLabel="חזור לעורך"
      >
        <div className="h-full flex items-center justify-center px-6">
          <div className="w-full max-w-[920px] grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-2xl font-semibold mb-6" style={{ fontFamily: 'var(--font-family-headline)' }}>
                סיכום הזמנה
              </h2>

              <div className="flex gap-6 mb-6">
                <div className="w-32 h-40 rounded-xl overflow-hidden bg-surface-container editorial-shadow shrink-0">
                  <img
                    src="https://picsum.photos/seed/checkout-cover/300/400"
                    alt="Album cover"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3" style={{ fontFamily: 'var(--font-family-headline)' }}>
                    {albumTitle}
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between gap-8">
                      <span className="text-warm-gray">פורמט</span>
                      <span>{sizeObj?.label ?? config.size}</span>
                    </div>
                    <div className="flex justify-between gap-8">
                      <span className="text-warm-gray">פתוח</span>
                      <span>{sizeObj?.openDimensions} ס"מ</span>
                    </div>
                    <div className="flex justify-between gap-8">
                      <span className="text-warm-gray">עמודים</span>
                      <span>{config.pages}</span>
                    </div>
                    <div className="flex justify-between gap-8">
                      <span className="text-warm-gray">כריכה</span>
                      <span>כריכה קשה</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-muted-border/20 pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-warm-gray">סכום ביניים</span>
                  <span>₪{totalPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-warm-gray">משלוח</span>
                  <span className="text-sage font-medium">חינם</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-muted-border/20 text-lg font-semibold" style={{ fontFamily: 'var(--font-family-headline)' }}>
                  <span>סה"כ</span>
                  <span>₪{totalPrice}</span>
                </div>
              </div>
            </motion.div>

            {/* Payment Form */}
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-5"
            >
              <h2 className="text-2xl font-semibold mb-4" style={{ fontFamily: 'var(--font-family-headline)' }}>
                פרטי משלוח ותשלום
              </h2>

              <div>
                <label className="text-xs font-medium text-deep-brown mb-1 block">שם מלא</label>
                <input className={inputClass('name')} value={form.name} onChange={(e) => update('name', e.target.value)} />
                {errors.name && <p className="text-xs text-error mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="text-xs font-medium text-deep-brown mb-1 block">כתובת</label>
                <input className={inputClass('address')} value={form.address} onChange={(e) => update('address', e.target.value)} />
                {errors.address && <p className="text-xs text-error mt-1">{errors.address}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-deep-brown mb-1 block">עיר</label>
                  <input className={inputClass('city')} value={form.city} onChange={(e) => update('city', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium text-deep-brown mb-1 block">מיקוד</label>
                  <input className={inputClass('zip')} value={form.zip} onChange={(e) => update('zip', e.target.value)} dir="ltr" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-deep-brown mb-1 block">טלפון</label>
                <input className={inputClass('phone')} value={form.phone} onChange={(e) => update('phone', e.target.value)} dir="ltr" />
              </div>

              <div className="pt-3 border-t border-muted-border/20">
                <label className="text-xs font-medium text-deep-brown mb-1 block">מספר כרטיס</label>
                <input className={inputClass('cardNumber')} value={form.cardNumber} onChange={(e) => update('cardNumber', e.target.value)} dir="ltr" placeholder="0000 0000 0000 0000" />
              </div>

              <div className="grid grid-cols-5 gap-3">
                <div className="col-span-3">
                  <label className="text-xs font-medium text-deep-brown mb-1 block">תוקף</label>
                  <input className={inputClass('expiry')} value={form.expiry} onChange={(e) => update('expiry', e.target.value)} dir="ltr" placeholder="MM/YY" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-deep-brown mb-1 block">CVV</label>
                  <input className={inputClass('cvv')} value={form.cvv} onChange={(e) => update('cvv', e.target.value)} dir="ltr" placeholder="123" />
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-warm-gray">
                <Icon name="lock" size={14} />
                <span>תשלום מאובטח ומוצפן</span>
              </div>

              <LoadingButton
                type="submit"
                loading={isProcessing}
                loadingLabel="מעבד..."
                className="w-full py-3.5 bg-primary text-on-primary rounded-xl font-bold text-lg shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
              >
                {`השלם הזמנה — ₪${totalPrice}`}
              </LoadingButton>

              {phase.step === 'error' && (
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-error text-center"
                >
                  {phase.message}
                </motion.p>
              )}
            </motion.form>
          </div>
        </div>

        {/* Processing Overlay */}
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
                <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-primary-fixed/20 flex items-center justify-center">
                  <div className="w-7 h-7 border-[2.5px] border-primary/20 border-t-primary rounded-full animate-spin" />
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
                  {phase.step === 'exporting' && `עמוד ${(phase as { current: number; total: number }).current} מתוך ${(phase as { current: number; total: number }).total}`}
                  {phase.step === 'uploading' && `קובץ ${(phase as { current: number; total: number }).current} מתוך ${(phase as { current: number; total: number }).total}`}
                  {phase.step === 'finalizing' && 'כמעט שם...'}
                </p>

                {(phase.step === 'exporting' || phase.step === 'uploading') && (
                  <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary rounded-full"
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

        {/* Off-screen renderer — mounted only during export phase */}
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
