import { useEffect, useState } from 'react'
import PageTransition from '../components/shared/PageTransition'
import LandingHeader from '../components/layout/LandingHeader'
import HeroSection from '../components/landing/HeroSection'
import TrustStrip from '../components/landing/TrustStrip'
import VideoShowcase from '../components/landing/VideoShowcase'
import HowItWorks from '../components/landing/HowItWorks'
import PricingSection from '../components/landing/PricingSection'
import FaqSection from '../components/landing/FaqSection'
import Footer from '../components/layout/Footer'

const NAV_PROBE_Y = 68

function computeNavLightOnDark(): boolean {
  const intro = document.querySelector<HTMLElement>('[data-landing-video-intro]')
  const hero = document.querySelector<HTMLElement>('[data-landing-hero]')
  const probe = NAV_PROBE_Y
  if (intro) {
    const r = intro.getBoundingClientRect()
    if (r.top < probe && r.bottom > probe) return true
  }
  if (hero) {
    const r = hero.getBoundingClientRect()
    if (r.top < probe && r.bottom > probe) return true
  }
  return false
}

export default function LandingPage() {
  const [navLightOnDark, setNavLightOnDark] = useState(true)

  useEffect(() => {
    const tick = () => setNavLightOnDark(computeNavLightOnDark())
    tick()
    const raf = requestAnimationFrame(tick)
    window.addEventListener('scroll', tick, { passive: true })
    window.addEventListener('resize', tick, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', tick)
      window.removeEventListener('resize', tick)
    }
  }, [])

  return (
    <PageTransition>
      <div className="min-h-screen grain-overlay">
        <LandingHeader navLightOnDark={navLightOnDark} />
        <VideoShowcase lead />
        <HeroSection />
        <TrustStrip />
        <HowItWorks />
        <PricingSection />
        <FaqSection />
        <Footer />
      </div>
    </PageTransition>
  )
}
