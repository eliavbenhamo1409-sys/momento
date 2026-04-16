import { Routes, Route, useLocation } from 'react-router'
import { AnimatePresence } from 'motion/react'
import { Suspense, lazy } from 'react'
import LandingPage from './screens/LandingPage'
import AuthModal from './components/auth/AuthModal'
import ToastContainer from './components/shared/ToastContainer'

const DashboardScreen = lazy(() => import('./screens/DashboardScreen'))
const UploadScreen = lazy(() => import('./screens/UploadScreen'))
const CurateScreen = lazy(() => import('./screens/CurateScreen'))
const ConfigureScreen = lazy(() => import('./screens/ConfigureScreen'))
const SetupScreen = lazy(() => import('./screens/SetupScreen'))
const GenerationScreen = lazy(() => import('./screens/GenerationScreen'))
const EditorScreen = lazy(() => import('./screens/EditorScreen'))
const CheckoutScreen = lazy(() => import('./screens/CheckoutScreen'))
const ConfirmationScreen = lazy(() => import('./screens/ConfirmationScreen'))
const PrivacyPage = lazy(() => import('./screens/PrivacyPage'))
const TermsPage = lazy(() => import('./screens/TermsPage'))
const CookiesPage = lazy(() => import('./screens/CookiesPage'))

const AdminLayout = lazy(() => import('./admin/AdminLayout'))
const AdminDashboard = lazy(() => import('./admin/AdminDashboard'))
const AdminOrderDetail = lazy(() => import('./admin/AdminOrderDetail'))

function RouteLoader() {
  return (
    <div className="min-h-[100svh] w-full flex items-center justify-center ambient-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-white ring-1 ring-black/[0.04] flex items-center justify-center shadow-[0_12px_40px_rgba(0,0,0,0.10)]">
          <div className="w-6 h-6 rounded-full border-2 border-sage/25 border-t-sage animate-spin" />
        </div>
        <p className="text-sm text-warm-gray" style={{ fontFamily: 'var(--font-family-body)' }}>
          טוען…
        </p>
      </div>
    </div>
  )
}

export default function App() {
  const location = useLocation()

  return (
    <>
      <AnimatePresence mode="wait">
        <Suspense fallback={<RouteLoader />}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<DashboardScreen />} />
            <Route path="/upload" element={<UploadScreen />} />
            <Route path="/curate" element={<CurateScreen />} />
            <Route path="/configure" element={<ConfigureScreen />} />
            <Route path="/setup" element={<SetupScreen />} />
            <Route path="/generating" element={<GenerationScreen />} />
            <Route path="/editor" element={<EditorScreen />} />
            <Route path="/editor/:albumId" element={<EditorScreen />} />
            <Route path="/checkout" element={<CheckoutScreen />} />
            <Route path="/confirmation" element={<ConfirmationScreen />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/cookies" element={<CookiesPage />} />
            <Route path="/admin.eliav" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="orders" element={<AdminDashboard />} />
              <Route path="orders/:orderId" element={<AdminOrderDetail />} />
            </Route>
          </Routes>
        </Suspense>
      </AnimatePresence>
      <AuthModal />
      <ToastContainer />
    </>
  )
}
