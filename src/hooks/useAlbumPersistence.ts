import { useCallback, useRef, useEffect } from 'react'
import { useEditorStore } from '../store/editorStore'
import { useAlbumStore } from '../store/albumStore'
import { useUIStore } from '../store/uiStore'
import { saveAlbum, loadAlbum } from '../lib/albumService'

export function useAlbumSave() {
  const savingRef = useRef(false)

  const save = useCallback(async () => {
    const { userId } = useUIStore.getState()
    if (!userId || savingRef.current) return

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
      const hasBlobUrls = JSON.stringify(updatedSpreads).includes('blob:')
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
      setSaving(false)
    } finally {
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
  const lastSpreadsRef = useRef<string>('')

  useEffect(() => {
    const unsub = useEditorStore.subscribe((state) => {
      const { userId } = useUIStore.getState()
      const { albumId } = useAlbumStore.getState()
      if (!userId || !albumId) return
      if (!state.isGenerated) return

      const snapshot = JSON.stringify(state.spreads)
      if (snapshot === lastSpreadsRef.current) return
      lastSpreadsRef.current = snapshot

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
