import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useUIStore } from '../store/uiStore'
import { checkIsAdmin } from './adminService'

export function useAdminGuard() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const userId = useUIStore((s) => s.userId)
  const isLoggedIn = useUIStore((s) => s.isLoggedIn)
  const authLoading = useUIStore((s) => s.authLoading)
  const openAuthModal = useUIStore((s) => s.openAuthModal)
  const navigate = useNavigate()

  useEffect(() => {
    if (authLoading) return

    if (!isLoggedIn || !userId) {
      openAuthModal('login', '/admin.eliav')
      return
    }

    let cancelled = false
    checkIsAdmin(userId).then((admin) => {
      if (cancelled) return
      if (!admin) {
        navigate('/', { replace: true })
        return
      }
      setIsAdmin(true)
    })

    return () => { cancelled = true }
  }, [userId, isLoggedIn, authLoading, navigate, openAuthModal])

  return { isAdmin, loading: isAdmin === null }
}
