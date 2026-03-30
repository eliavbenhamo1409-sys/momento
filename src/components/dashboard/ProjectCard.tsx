import { useState } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router'
import Icon from '../shared/Icon'

interface Props {
  project: {
    id: string
    title: string
    coverUrl: string | null
    size: string
    pages: number
    photosCount: number
    lastEdited: string
    status: string
  }
  index: number
  onDelete?: (id: string) => void
}

export default function ProjectCard({ project, index, onDelete }: Props) {
  const navigate = useNavigate()
  const [isDeleting, setIsDeleting] = useState(false)

  const daysAgo = getDaysAgo(project.lastEdited)
  const lastEditedLabel = daysAgo === 0 ? 'היום' : daysAgo === 1 ? 'אתמול' : `לפני ${daysAgo} ימים`

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!onDelete) return
    setIsDeleting(true)
    try {
      await onDelete(project.id)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.06 * index }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/editor/${project.id}`)}
      className="group cursor-pointer rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 2px 16px rgba(90,80,70,0.06), 0 1px 4px rgba(90,80,70,0.04)',
        border: '1px solid rgba(216,208,207,0.2)',
      }}
    >
      <div className="relative h-44 overflow-hidden">
        {project.coverUrl ? (
          <img
            src={project.coverUrl}
            alt={project.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-surface-container flex items-center justify-center">
            <Icon name="photo_album" size={40} className="text-warm-gray/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

        <div
          className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold"
          style={{
            background: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          <div className="w-1.5 h-1.5 rounded-full" style={{
            background: project.status === 'ordered' ? '#8E8973' : '#A5A08C',
          }} />
          <span className="text-deep-brown">{project.status === 'draft' ? 'טיוטה' : 'הוזמן'}</span>
        </div>

        {onDelete && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleDelete}
            disabled={isDeleting}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm hover:bg-error/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm disabled:opacity-50"
          >
            {isDeleting ? (
              <motion.span
                className="inline-block w-4 h-4 rounded-full border-2 border-error/30"
                style={{ borderTopColor: 'var(--color-error)' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
              />
            ) : (
              <Icon name="delete" size={16} className="text-error/60" />
            )}
          </motion.button>
        )}
      </div>

      <div className="p-5">
        <h3
          className="text-[15px] font-semibold text-deep-brown mb-2 truncate"
          style={{ fontFamily: 'var(--font-family-headline)' }}
        >
          {project.title}
        </h3>

        <div className="flex items-center gap-3 text-xs text-warm-gray mb-4">
          <span className="flex items-center gap-1">
            <Icon name="photo_library" size={13} />
            {project.photosCount} תמונות
          </span>
          <span className="w-px h-3 bg-muted-border/30" />
          <span>{project.size} · {project.pages} עמ׳</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-warm-gray/70">
            עדכון אחרון {lastEditedLabel}
          </span>
          <motion.span
            whileHover={{ x: -3 }}
            className="text-sage text-xs font-medium flex items-center gap-1"
          >
            המשך עריכה
            <Icon name="arrow_back" size={14} />
          </motion.span>
        </div>
      </div>
    </motion.div>
  )
}

function getDaysAgo(dateStr: string): number {
  const d = new Date(dateStr)
  const now = new Date()
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
}
