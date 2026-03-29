import type { ReactNode } from 'react'
import ProductHeader from './ProductHeader'
import StepIndicator from './StepIndicator'
import type { ScreenStep } from '../../types'

interface Props {
  children: ReactNode
  currentStep?: ScreenStep
  showSteps?: boolean
  showBack?: boolean
  backTo?: string
  backLabel?: string
  className?: string
}

export default function ProductLayout({
  children,
  currentStep,
  showSteps = true,
  showBack,
  backTo,
  backLabel,
  className = '',
}: Props) {
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-soft-cream">
      <ProductHeader showBack={showBack} backTo={backTo} backLabel={backLabel} />
      {showSteps && currentStep && <StepIndicator current={currentStep} />}
      <main className={`flex-1 overflow-hidden ${className}`}>
        {children}
      </main>
    </div>
  )
}
