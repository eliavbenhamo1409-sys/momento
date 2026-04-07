import Icon from './Icon'

interface ChipProps {
  label: string
  selected: boolean
  onClick: () => void
  icon?: string
  showCheck?: boolean
}

export default function Chip({ label, selected, onClick, icon, showCheck }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className={`btn-press px-6 py-2.5 rounded-full font-medium transition-colors text-sm flex items-center gap-2 ${
        selected
          ? 'bg-sage text-white shadow-lg shadow-sage/20'
          : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-variant'
      }`}
    >
      {showCheck && selected && <Icon name="check" filled size={16} />}
      {icon && !showCheck && <Icon name={icon} size={18} />}
      {label}
    </button>
  )
}
