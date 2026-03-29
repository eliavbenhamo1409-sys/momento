import PageTransition from '../components/shared/PageTransition'
import LandingHeader from '../components/layout/LandingHeader'
import HeroSection from '../components/landing/HeroSection'
import TrustStrip from '../components/landing/TrustStrip'
import HowItWorks from '../components/landing/HowItWorks'
import ExampleAlbums from '../components/landing/ExampleAlbums'
import PricingSection from '../components/landing/PricingSection'
import FaqSection from '../components/landing/FaqSection'
import Footer from '../components/layout/Footer'

export default function LandingPage() {
  return (
    <PageTransition>
      <div className="min-h-screen">
        <LandingHeader />
        <HeroSection />
        <TrustStrip />
        <HowItWorks />
        <ExampleAlbums />
        <PricingSection />
        <FaqSection />
        <Footer />
      </div>
    </PageTransition>
  )
}
