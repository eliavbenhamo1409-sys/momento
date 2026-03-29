import { useCallback, useRef, useEffect } from 'react'
import { useEditorStore } from '../store/editorStore'
import { useAlbumStore } from '../store/albumStore'
import { useUIStore } from '../store/uiStore'
import { saveAlbum, loadAlbum } from '../lib/albumService'
import type { EditorSpread, PhotoElement } from '../types'

function spreadsHaveBlobUrls(spreads: EditorSpread[]): boolean {
  for (const s of spreads) {
    if (s.leftPhotos?.some((u) => u?.startsWith('blob:'))) return true
    if (s.rightPhotos?.some((u) => u?.startsWith('blob:'))) return true
    if (s.design) {
      for (const el of s.design.elements) {
        if (el.type === 'photo' && (el as PhotoElement).photoUrl?.startsWith('blob:')) return true
      }
      const bg = s.design.background
      if (bg.blurPhotoUrl?.startsWith('blob:')) return true
      if (bg.generatedBgUrl?.startsWith('blob:')) return true
      if (bg.generatedBgLeftUrl?.startsWith('blob:')) return true
      if (bg.generatedBgRightUrl?.startsWith('blob:')) return true
    }
  }
  return false
}

export function useAlbumSave() {
  const savingRef = useRef(false)

  const save = useCallback(async () => {
    if (savingRef.current) return

    const { userId, openAuthModal, addToast } = useUIStore.getState()
    if (!userId) {
      addToast('יש להתחבר כדי לשמור את האלבום', 'info')
      openAuthModal()
      return
    }

    const { albumId, albumTitle, config } = useAlbumStore.getState()
    const { spreads, setSaving, setLastSaved } = useEditorStore.getState()

    savingRef.current = true
    setSaving(true)

    try {
      const id = await saveAlbum(albumId, userId, albumTitle, config, spreads)

      if (!albumId) {
        useAlbumStore.getState().setAlbumId(id)
      }

      const { spreads: updatedSpreads } = useEditorStore.getState()
      const hasBlobUrls = spreadsHaveBlobUrls(updatedSpreads)
      if (hasBlobUrls) {
        const freshAlbum = await loadAlbum(id)
        if (freshAlbum) {
          useEditorStore.getState().setSpreads(freshAlbum.spreads)
          useEditorStore.setState({ isGenerated: true })
        }
      }

      setLastSaved(new Date())
      useUIStore.getState().addToast('האלבום נשמר בהצלחה', 'success')
    } catch (err) {
      console.error('Save failed:', err)
      useUIStore.getState().addToast('שגיאה בשמירת האלבום', 'error')
    } finally {
      setSaving(false)
      savingRef.current = false
    }
  }, [])

  return save
}

export function useAlbumLoad() {
  const load = useCallback(async (albumId: string) => {
    try {
      const album = await loadAlbum(albumId)
      if (!album) {
        useUIStore.getState().addToast('האלבום לא נמצא', 'error')
        return false
      }

      useAlbumStore.setState({
        albumId: album.id,
        albumTitle: album.title,
        config: album.config,
      })

      useEditorStore.getState().setSpreads(album.spreads)
      useEditorStore.setState({ isGenerated: true })

      return true
    } catch (err) {
      console.error('Load failed:', err)
      useUIStore.getState().addToast('שגיאה בטעינת האלבום', 'error')
      return false
    }
  }, [])

  return load
}

export function useAutoSave(intervalMs = 30000) {
  const save = useAlbumSave()
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    const unsub = useEditorStore.subscribe((state, prevState) => {
      if (state.spreads === prevState.spreads) return

      const { userId } = useUIStore.getState()
      const { albumId } = useAlbumStore.getState()
      if (!userId || !albumId) return
      if (!state.isGenerated) return

      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        save()
      }, intervalMs)
    })

    return () => {
      unsub()
      clearTimeout(timerRef.current)
    }
  }, [save, intervalMs])
}
