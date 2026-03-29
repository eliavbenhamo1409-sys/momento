import { Routes, Route, useLocation } from 'react-router'
import { AnimatePresence } from 'motion/react'
import LandingPage from './screens/LandingPage'
import DashboardScreen from './screens/DashboardScreen'
import UploadScreen from './screens/UploadScreen'
import ConfigureScreen from './screens/ConfigureScreen'
import SetupScreen from './screens/SetupScreen'
import GenerationScreen from './screens/GenerationScreen'
import EditorScreen from './screens/EditorScreen'
import CheckoutScreen from './screens/CheckoutScreen'
import ConfirmationScreen from './screens/ConfirmationScreen'
import AuthModal from './components/auth/AuthModal'
import ToastContainer from './components/shared/ToastContainer'

export default function App() {
  const location = useLocation()

  return (
    <>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<DashboardScreen />} />
          <Route path="/upload" element={<UploadScreen />} />
          <Route path="/configure" element={<ConfigureScreen />} />
          <Route path="/setup" element={<SetupScreen />} />
          <Route path="/generating" element={<GenerationScreen />} />
          <Route path="/editor" element={<EditorScreen />} />
          <Route path="/editor/:albumId" element={<EditorScreen />} />
          <Route path="/checkout" element={<CheckoutScreen />} />
          <Route path="/confirmation" element={<ConfirmationScreen />} />
        </Routes>
      </AnimatePresence>
      <AuthModal />
      <ToastContainer />
    </>
  )
}
