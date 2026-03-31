import { motion, LayoutGroup } from 'motion/react'
import type { CoverMaterial } from '../../types'

const MATERIALS: Record<CoverMaterial, {
  bg: string
  texture: string
  edgeLight: string
  spineTint: string
  label: string
}> = {
  linen: {
    bg: 'linear-gradient(145deg, #e8e0d4 0%, #d9d0c2 40%, #cec4b4 100%)',
    texture: `url("data:image/svg+xml,%3Csvg width='6' height='6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h1v1H0zm2 2h1v1H2zm4 0h1v1H4zm-2 2h1v1H2zm2 2h1v1H4zM0 4h1v1H0z' fill='%23000' fill-opacity='.03'/%3E%3C/svg%3E")`,
    edgeLight: 'rgba(255,255,255,0.35)',
    spineTint: 'rgba(0,0,0,0.06)',
    label: 'פשתן',
  },
  white: {
    bg: 'linear-gradient(145deg, #faf9f7 0%, #f3f1ed 40%, #edeae4 100%)',
    texture: `url("data:image/svg+xml,%3Csvg width='4' height='4' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h1v1H0zm2 2h1v1H2z' fill='%23000' fill-opacity='.015'/%3E%3C/svg%3E")`,
    edgeLight: 'rgba(255,255,255,0.6)',
    spineTint: 'rgba(0,0,0,0.04)',
    label: 'לבן',
  },
  'light-brown': {
    bg: 'linear-gradient(145deg, #d4c4a8 0%, #c8b697 40%, #bfad8d 100%)',
    texture: `url("data:image/svg+xml,%3Csvg width='8' height='8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h1v1H0zm4 2h1v1H4zm-2 4h1v1H2zm4 2h1v1H4z' fill='%23000' fill-opacity='.04'/%3E%3C/svg%3E")`,
    edgeLight: 'rgba(255,255,255,0.25)',
    spineTint: 'rgba(0,0,0,0.07)',
    label: 'חום בהיר',
  },
}

const DEFAULT_MATERIAL: CoverMaterial = 'linen'

export function BookCoverFrame({ material }: { material: CoverMaterial | undefined }) {
  const m = MATERIALS[material ?? DEFAULT_MATERIAL] ?? MATERIALS[DEFAULT_MATERIAL]

  return (
    <motion.div
      className="absolute pointer-events-none select-none"
      initial={false}
      animate={{ opacity: 1 }}
      style={{
        inset: '-10px -12px -10px -12px',
        zIndex: -1,
        borderRadius: 6,
        background: m.bg,
        backgroundImage: m.texture,
        boxShadow: [
          '0 2px 8px rgba(0,0,0,0.10)',
          '0 8px 24px rgba(0,0,0,0.08)',
          '0 20px 48px rgba(0,0,0,0.06)',
          `inset 0 1px 0 ${m.edgeLight}`,
          'inset 0 -1px 2px rgba(0,0,0,0.05)',
        ].join(', '),
      }}
    >
      {/* Top edge highlight */}
      <div
        className="absolute top-0 left-2 right-2 h-px"
        style={{ background: `linear-gradient(to right, transparent, ${m.edgeLight}, transparent)` }}
      />

      {/* Bottom edge shadow */}
      <div
        className="absolute bottom-0 left-2 right-2 h-px"
        style={{ background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.08), transparent)' }}
      />

      {/* Spine groove */}
      <div
        className="absolute top-2 bottom-2 left-1/2 -translate-x-1/2"
        style={{
          width: 10,
          background: `linear-gradient(to right, 
            transparent 0%, 
            ${m.spineTint} 20%, 
            rgba(0,0,0,0.03) 45%, 
            rgba(255,255,255,0.08) 50%, 
            rgba(0,0,0,0.03) 55%, 
            ${m.spineTint} 80%, 
            transparent 100%
          )`,
          borderRadius: 1,
        }}
      />

      {/* Left cover subtle edge (book board thickness illusion) */}
      <div
        className="absolute top-1 bottom-1 left-0 rounded-l-[5px]"
        style={{
          width: 3,
          background: `linear-gradient(to right, rgba(0,0,0,0.08), transparent)`,
        }}
      />

      {/* Right cover subtle edge */}
      <div
        className="absolute top-1 bottom-1 right-0 rounded-r-[5px]"
        style={{
          width: 3,
          background: `linear-gradient(to left, rgba(0,0,0,0.08), transparent)`,
        }}
      />
    </motion.div>
  )
}

export function CoverMaterialPicker({
  value,
  onChange,
}: {
  value: CoverMaterial | undefined
  onChange: (m: CoverMaterial) => void
}) {
  const materials: CoverMaterial[] = ['linen', 'white', 'light-brown']
  const safeValue = value && materials.includes(value) ? value : DEFAULT_MATERIAL

  return (
    <motion.div
      dir="rtl"
      role="radiogroup"
      aria-label="בחירת חומר כריכה"
      className="relative z-30 flex flex-col items-center gap-3 pointer-events-auto"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <span
        className="text-[11px] font-semibold tracking-wide text-deep-brown/45 uppercase"
        style={{ fontFamily: 'var(--font-family-headline)' }}
      >
        כריכה
      </span>

      <LayoutGroup>
      <div
        className="flex items-stretch gap-1 p-1 rounded-2xl border border-black/[0.06] shadow-[0_4px_24px_rgba(45,40,35,0.07),inset_0_1px_0_rgba(255,255,255,0.85)]"
        style={{
          background: 'linear-gradient(160deg, rgba(255,255,255,0.92) 0%, rgba(250,247,242,0.88) 100%)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}
      >
        {materials.map((mat) => {
          const info = MATERIALS[mat]
          const isActive = mat === safeValue
          return (
            <motion.button
              key={mat}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-label={info.label}
              onClick={(e) => {
                e.stopPropagation()
                onChange(mat)
              }}
              className={[
                'relative flex flex-col items-center justify-center gap-1.5 min-w-[4.5rem] sm:min-w-[5.25rem] py-2.5 px-2 rounded-xl transition-colors duration-200',
                isActive
                  ? 'bg-white/95 shadow-[0_2px_12px_rgba(90,80,70,0.08)] ring-1 ring-sage/35'
                  : 'bg-transparent hover:bg-white/50 text-deep-brown/55',
              ].join(' ')}
              whileHover={{ scale: isActive ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            >
              <span
                className="block size-9 sm:size-10 rounded-xl shrink-0 ring-1 ring-black/[0.06]"
                style={{
                  background: info.bg,
                  backgroundImage: info.texture,
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.45), 0 2px 6px rgba(0,0,0,0.06)',
                }}
              />
              <span
                className={`text-[11px] sm:text-xs font-semibold leading-tight text-center ${
                  isActive ? 'text-deep-brown' : 'text-deep-brown/50'
                }`}
                style={{ fontFamily: 'var(--font-family-body)' }}
              >
                {info.label}
              </span>
              {isActive && (
                <motion.span
                  layoutId="cover-material-pill"
                  className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-sage/80"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
            </motion.button>
          )
        })}
      </div>
      </LayoutGroup>
    </motion.div>
  )
}
