import { create } from 'zustand'
import type { AuthMode } from '../types'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface Toast {
  id: string
  message: string
  type: 'info' | 'success' | 'error'
}

interface UIState {
  isAuthModalOpen: boolean
  authMode: AuthMode
  authRedirectTo: string | null
  isLoggedIn: boolean
  userName: string | null
  userId: string | null
  user: User | null
  authLoading: boolean
  toasts: Toast[]

  openAuthModal: (mode?: AuthMode, redirectTo?: string | null) => void
  closeAuthModal: () => void
  setAuthMode: (mode: AuthMode) => void
  setUser: (user: User | null) => void
  logout: () => Promise<void>
  addToast: (message: string, type?: 'info' | 'success' | 'error') => void
  removeToast: (id: string) => void
}

let toastId = 0

export const useUIStore = create<UIState>((set) => ({
  isAuthModalOpen: false,
  authMode: 'login',
  authRedirectTo: null,
  isLoggedIn: false,
  userName: null,
  userId: null,
  user: null,
  authLoading: true,
  toasts: [],

  openAuthModal: (mode = 'login', redirectTo = null) =>
    set({ isAuthModalOpen: true, authMode: mode, authRedirectTo: redirectTo }),

  closeAuthModal: () =>
    set({ isAuthModalOpen: false, authRedirectTo: null }),

  setAuthMode: (mode) => set({ authMode: mode }),

  setUser: (user) => {
    if (user) {
      const name = user.user_metadata?.display_name
        || user.user_metadata?.full_name
        || user.email?.split('@')[0]
        || 'משתמש'
      set({
        isLoggedIn: true,
        userName: name,
        userId: user.id,
        user,
        isAuthModalOpen: false,
        authLoading: false,
      })
    } else {
      set({
        isLoggedIn: false,
        userName: null,
        userId: null,
        user: null,
        authLoading: false,
      })
    }
  },

  logout: async () => {
    await supabase.auth.signOut()
    set({ isLoggedIn: false, userName: null, userId: null, user: null })
  },

  addToast: (message, type = 'info') => {
    const id = `toast-${++toastId}`
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }))
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, 3000)
  },

  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))

supabase.auth.getSession().then(({ data: { session } }) => {
  useUIStore.getState().setUser(session?.user ?? null)
})

supabase.auth.onAuthStateChange((_event, session) => {
  useUIStore.getState().setUser(session?.user ?? null)
})
