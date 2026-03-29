import type { ScreenStep } from '../../types'

const steps: { key: ScreenStep; label: string }[] = [
  { key: 'upload', label: 'העלאה' },
  { key: 'configure', label: 'מפרט' },
  { key: 'setup', label: 'סגנון' },
  { key: 'editor', label: 'אלבום' },
]

interface Props {
  current: ScreenStep
}

export default function StepIndicator({ current }: Props) {
  const currentIdx = steps.findIndex(
    (s) => s.key === current || (current === 'generating' && s.key === 'editor'),
  )

  return (
    <div className="h-[48px] w-full flex items-center justify-center gap-8 bg-soft-cream border-b border-muted-border/10 shrink-0">
      {steps.map((step, i) => {
        const isActive = i === currentIdx
        const isComplete = i < currentIdx

        return (
          <div key={step.key} className="flex items-center gap-3">
            {i > 0 && (
              <div
                className={`w-12 h-px mx-1 ${
                  isComplete ? 'bg-sage' : 'bg-outline-variant/30'
                }`}
              />
            )}
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-primary text-white ring-4 ring-primary/10'
                    : isComplete
                      ? 'bg-sage text-white'
                      : 'bg-surface-container-highest text-on-surface-variant'
                }`}
              >
                {isComplete ? '✓' : i + 1}
              </div>
              <span
                className={`text-xs font-semibold ${
                  isActive
                    ? 'text-on-surface'
                    : isComplete
                      ? 'text-sage'
                      : 'text-on-surface-variant'
                }`}
              >
                {step.label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
