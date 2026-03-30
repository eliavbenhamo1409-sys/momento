import { useState } from 'react'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import { useUIStore } from '../../store/uiStore'
import { supabase } from '../../lib/supabase'
import LoadingButton from '../shared/LoadingButton'
import Icon from '../shared/Icon'

export default function AuthModal() {
  const { isAuthModalOpen, authMode, authRedirectTo, closeAuthModal, setAuthMode, addToast } =
    useUIStore()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (authMode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: name || email.split('@')[0] },
          },
        })
        if (signUpError) throw signUpError
        addToast('החשבון נוצר בהצלחה!', 'success')
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) throw signInError
      }
      navigate(authRedirectTo || '/dashboard')
      resetForm()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'שגיאה בהתחברות'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError(null)
    setGoogleLoading(true)
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + (authRedirectTo || '/dashboard'),
        },
      })
      if (oauthError) {
        setError(oauthError.message)
        setGoogleLoading(false)
      }
    } catch {
      setGoogleLoading(false)
    }
  }

  const resetForm = () => {
    setName('')
    setEmail('')
    setPassword('')
    setError(null)
  }

  if (!isAuthModalOpen) return null

  return (
    <AnimatePresence>
      {isAuthModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[90] flex items-center justify-center"
          onClick={closeAuthModal}
        >
          <div className="absolute inset-0 bg-deep-brown/50 backdrop-blur-sm" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-[440px] max-w-[95vw] rounded-3xl overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, #FEFAFA 0%, #F7F1F1 100%)',
              boxShadow: '0 24px 80px rgba(47,46,43,0.2), 0 8px 24px rgba(47,46,43,0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #8E8973 0%, #CDC7AE 50%, #8E8973 100%)' }} />

            <div className="p-10 pt-8">
              <button
                onClick={closeAuthModal}
                className="absolute top-5 left-5 w-8 h-8 rounded-full bg-surface-container/50 hover:bg-surface-container flex items-center justify-center text-warm-gray hover:text-deep-brown transition-all"
              >
                <Icon name="close" size={18} />
              </button>

              <AnimatePresence mode="wait">
                <motion.div
                  key={authMode}
                  initial={{ opacity: 0, x: authMode === 'login' ? -12 : 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: authMode === 'login' ? 12 : -12 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="mb-8">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                      style={{
                        background: 'linear-gradient(135deg, rgba(142,137,115,0.1) 0%, rgba(142,137,115,0.03) 100%)',
                      }}
                    >
                      <Icon
                        name={authMode === 'login' ? 'login' : 'person_add'}
                        size={24}
                        className="text-sage"
                      />
                    </div>
                    <h2
                      className="text-2xl font-bold text-deep-brown mb-1.5"
                      style={{ fontFamily: 'var(--font-family-headline)' }}
                    >
                      {authMode === 'login' ? 'ברוכים השבים' : 'יצירת חשבון'}
                    </h2>
                    <p className="text-sm text-warm-gray">
                      {authMode === 'login'
                        ? 'התחבר כדי לגשת לאלבומים שלך'
                        : 'הרשם כדי להתחיל ליצור אלבומים'}
                    </p>
                  </div>

                  <LoadingButton
                    loading={googleLoading}
                    loadingLabel="מתחבר..."
                    onClick={handleGoogleLogin}
                    className="w-full py-3.5 rounded-xl text-sm font-medium text-deep-brown flex items-center justify-center gap-3 transition-all mb-6"
                    style={{
                      background: 'rgba(255,255,255,0.8)',
                      boxShadow: '0 1px 8px rgba(90,80,70,0.08), 0 1px 2px rgba(90,80,70,0.06)',
                      border: '1px solid rgba(216,208,207,0.3)',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    {authMode === 'login' ? 'התחבר עם Google' : 'הרשם עם Google'}
                  </LoadingButton>

                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1 h-px bg-muted-border/25" />
                    <span className="text-[11px] text-warm-gray/60 font-medium">או עם אימייל</span>
                    <div className="flex-1 h-px bg-muted-border/25" />
                  </div>

                  {error && (
                    <div className="mb-4 p-3 rounded-xl bg-error/5 border border-error/15 text-error text-sm text-center">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {authMode === 'signup' && (
                      <div>
                        <label className="block text-xs font-medium text-deep-brown/80 mb-1.5">שם מלא</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-white/60 border border-muted-border/25 text-sm focus:ring-2 focus:ring-sage/15 focus:border-sage/30 transition-all outline-none placeholder:text-warm-gray/40"
                          placeholder="ישראל ישראלי"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-medium text-deep-brown/80 mb-1.5">אימייל</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-xl bg-white/60 border border-muted-border/25 text-sm focus:ring-2 focus:ring-sage/15 focus:border-sage/30 transition-all outline-none placeholder:text-warm-gray/40"
                        placeholder="your@email.com"
                        dir="ltr"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-deep-brown/80 mb-1.5">סיסמה</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={6}
                          className="w-full px-4 py-3 rounded-xl bg-white/60 border border-muted-border/25 text-sm focus:ring-2 focus:ring-sage/15 focus:border-sage/30 transition-all outline-none"
                          dir="ltr"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray/50 hover:text-warm-gray transition-colors"
                        >
                          <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={18} />
                        </button>
                      </div>
                      {authMode === 'login' && (
                        <button type="button" className="text-[11px] text-sage/80 mt-1.5 hover:text-sage transition-colors">
                          שכחתי סיסמה
                        </button>
                      )}
                    </div>

                    <LoadingButton
                      type="submit"
                      loading={loading}
                      loadingLabel="מתחבר..."
                      className="w-full py-3.5 rounded-xl font-semibold text-white transition-all mt-2"
                      style={{
                        background: 'linear-gradient(135deg, #605c48 0%, #8E8973 100%)',
                        boxShadow: '0 4px 16px rgba(96,92,72,0.25)',
                      }}
                    >
                      {authMode === 'login' ? 'התחבר' : 'צור חשבון'}
                    </LoadingButton>
                  </form>

                  <p className="text-center text-sm text-warm-gray mt-7">
                    {authMode === 'login' ? 'אין לך חשבון?' : 'כבר יש לך חשבון?'}{' '}
                    <button
                      onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setError(null) }}
                      className="text-sage font-semibold hover:underline transition-colors"
                    >
                      {authMode === 'login' ? 'הרשם' : 'התחבר'}
                    </button>
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
