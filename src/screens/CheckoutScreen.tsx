import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { motion } from 'motion/react'
import PageTransition from '../components/shared/PageTransition'
import ProductLayout from '../components/layout/ProductLayout'
import Icon from '../components/shared/Icon'
import { useAlbumStore } from '../store/albumStore'
import { calcAlbumPrice, ALBUM_SIZES } from '../lib/constants'

export default function CheckoutScreen() {
  const navigate = useNavigate()
  const { config, albumTitle } = useAlbumStore()
  const sizeObj = ALBUM_SIZES.find((s) => s.id === config.size)
  const totalPrice = useMemo(() => calcAlbumPrice(config.size, config.pages), [config.size, config.pages])
  const [isProcessing, setIsProcessing] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setIsProcessing(true)
    await new Promise((r) => setTimeout(r, 2000))
    navigate('/confirmation')
  }

  const inputClass = (field: string) =>
    `w-full px-4 py-2.5 rounded-lg bg-surface-container-lowest border text-sm outline-none transition-all ${
      errors[field]
        ? 'border-error focus:ring-2 focus:ring-error/20'
        : 'border-muted-border/40 focus:ring-2 focus:ring-primary/20 focus:border-primary/40'
    }`

  return (
    <PageTransition>
      <ProductLayout showSteps={false} showBack backTo="/editor" backLabel="חזור לעורך">
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

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3.5 bg-primary text-on-primary rounded-xl font-bold text-lg shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {isProcessing ? 'מעבד...' : `השלם הזמנה — ₪${totalPrice}`}
              </button>
            </motion.form>
          </div>
        </div>
      </ProductLayout>
    </PageTransition>
  )
}
