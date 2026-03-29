import { useCallback, useRef } from 'react'
import { useAlbumStore } from '../store/albumStore'
import type { Photo } from '../types'

let photoCounter = 0

export function useFileUpload() {
  const {
    setPhotos,
    addPhotos,
    setUploadProgress,
    setIsUploading,
    setIsUploadComplete,
    photos: existingPhotos,
  } = useAlbumStore()
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
        const url = URL.createObjectURL(file)

        photos.push({
          id,
          file,
          thumbnailUrl: url,
          fullUrl: url,
          width: 1200,
          height: 800,
          selected: true,
        })

        setUploadProgress(Math.round(((i + 1) / total) * 100))
        await new Promise((r) => setTimeout(r, 30 + Math.random() * 40))
      }

      if (append) {
        addPhotos(photos)
      } else {
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
        setPhotos(photos)
      }
      setIsUploading(false)
      setIsUploadComplete(true)
    },
    [setPhotos, addPhotos, setUploadProgress, setIsUploading, setIsUploadComplete],
  )

  return { processFiles, simulateUpload, existingPhotos }
}
