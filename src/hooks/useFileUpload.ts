import { useCallback, useRef } from 'react'
import { useAlbumStore } from '../store/albumStore'
import { useShallow } from 'zustand/react/shallow'
import { createThumbnailUrl } from '../lib/photoUtils'
import type { Photo } from '../types'

let photoCounter = 0

export function useFileUpload() {
  const {
    setPhotos,
    addPhotos,
    setUploadProgress,
    setIsUploading,
    setIsUploadComplete,
  } = useAlbumStore(useShallow((s) => ({
    setPhotos: s.setPhotos,
    addPhotos: s.addPhotos,
    setUploadProgress: s.setUploadProgress,
    setIsUploading: s.setIsUploading,
    setIsUploadComplete: s.setIsUploadComplete,
  })))
  const abortRef = useRef(false)

  const processFiles = useCallback(
    async (files: FileList | File[], append = false) => {
      const imageFiles = Array.from(files).filter((f) =>
        f.type.startsWith('image/'),
      )
      if (imageFiles.length === 0) return false

      setIsUploading(true)
      setUploadProgress(0)
      abortRef.current = false

      const photos: Photo[] = []
      const total = imageFiles.length

      for (let i = 0; i < total; i++) {
        if (abortRef.current) break

        const file = imageFiles[i]
        const id = `photo-${++photoCounter}`
        const fullUrl = URL.createObjectURL(file)

        let thumbnailUrl = fullUrl
        let width = 1200
        let height = 800
        try {
          const thumb = await createThumbnailUrl(file)
          thumbnailUrl = thumb.thumbnailUrl
          width = thumb.width
          height = thumb.height
        } catch {
          // fallback to full-res blob
        }

        photos.push({
          id,
          file,
          thumbnailUrl,
          fullUrl,
          width,
          height,
          selected: true,
        })

        setUploadProgress(Math.round(((i + 1) / total) * 100))
        await new Promise((r) => setTimeout(r, 30 + Math.random() * 40))
      }

      if (append) {
        addPhotos(photos)
      } else {
        const prev = useAlbumStore.getState().photos
        for (const p of prev) {
          if (p.fullUrl?.startsWith('blob:')) URL.revokeObjectURL(p.fullUrl)
          if (p.thumbnailUrl?.startsWith('blob:') && p.thumbnailUrl !== p.fullUrl) URL.revokeObjectURL(p.thumbnailUrl)
        }
        setPhotos(photos)
      }
      setIsUploading(false)
      setIsUploadComplete(true)
      return true
    },
    [setPhotos, addPhotos, setUploadProgress, setIsUploading, setIsUploadComplete],
  )

  const simulateUpload = useCallback(
    async (count: number = 78, append = false) => {
      setIsUploading(true)
      setUploadProgress(0)

      const photos: Photo[] = Array.from({ length: count }, () => ({
        id: `photo-${++photoCounter}`,
        thumbnailUrl: `https://picsum.photos/seed/up${photoCounter}/200/200`,
        fullUrl: `https://picsum.photos/seed/up${photoCounter}/1200/800`,
        width: 1200,
        height: 800,
        selected: true,
      }))

      for (let i = 0; i <= 100; i += 2) {
        setUploadProgress(i)
        await new Promise((r) => setTimeout(r, 40))
      }

      if (append) {
        addPhotos(photos)
      } else {
        const prev = useAlbumStore.getState().photos
        for (const p of prev) {
          if (p.fullUrl?.startsWith('blob:')) URL.revokeObjectURL(p.fullUrl)
          if (p.thumbnailUrl?.startsWith('blob:') && p.thumbnailUrl !== p.fullUrl) URL.revokeObjectURL(p.thumbnailUrl)
        }
        setPhotos(photos)
      }
      setIsUploading(false)
      setIsUploadComplete(true)
    },
    [setPhotos, addPhotos, setUploadProgress, setIsUploading, setIsUploadComplete],
  )

  return { processFiles, simulateUpload }
}
