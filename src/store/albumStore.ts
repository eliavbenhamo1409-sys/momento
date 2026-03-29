import { create } from 'zustand'
import type { Photo, AlbumConfig, PhotoScore, CuratedPhotoSet } from '../types'

export interface VibeReference {
  id: string
  dataUrl: string
  name: string
}

interface AlbumState {
  albumId: string | null
  photos: Photo[]
  uploadProgress: number
  isUploading: boolean
  isUploadComplete: boolean
  config: AlbumConfig
  albumTitle: string
  vibeReferences: VibeReference[]

  photoScores: PhotoScore[]
  curatedSet: CuratedPhotoSet | null

  setAlbumId: (id: string | null) => void
  setPhotos: (photos: Photo[]) => void
  addPhotos: (photos: Photo[]) => void
  setUploadProgress: (progress: number) => void
  setIsUploading: (val: boolean) => void
  setIsUploadComplete: (val: boolean) => void
  setConfigField: <K extends keyof AlbumConfig>(key: K, value: AlbumConfig[K]) => void
  setAlbumTitle: (title: string) => void
  setVibeReferences: (refs: VibeReference[]) => void
  addVibeReference: (ref: VibeReference) => void
  removeVibeReference: (id: string) => void
  setPhotoScores: (scores: PhotoScore[]) => void
  setCuratedSet: (set: CuratedPhotoSet) => void
  resetAlbum: () => void
}

const defaultConfig: AlbumConfig = {
  type: null,
  style: null,
  mood: null,
  people: [],
  automationLevel: 2,
  pages: 30,
  size: '30x30',
  coverType: 'hard',
  designFamily: null,
  vibeText: '',
  backgroundMode: 'white',
}

export const useAlbumStore = create<AlbumState>((set) => ({
  albumId: null,
  photos: [],
  uploadProgress: 0,
  isUploading: false,
  isUploadComplete: false,
  config: { ...defaultConfig },
  albumTitle: 'האלבום שלי',
  vibeReferences: [],

  photoScores: [],
  curatedSet: null,

  setAlbumId: (id) => set({ albumId: id }),
  setPhotos: (photos) => set({ photos }),
  addPhotos: (newPhotos) => set((s) => ({ photos: [...s.photos, ...newPhotos] })),
  setUploadProgress: (progress) => set({ uploadProgress: progress }),
  setIsUploading: (val) => set({ isUploading: val }),
  setIsUploadComplete: (val) => set({ isUploadComplete: val }),
  setConfigField: (key, value) =>
    set((s) => ({ config: { ...s.config, [key]: value } })),
  setAlbumTitle: (title) => set({ albumTitle: title }),
  setVibeReferences: (refs) => set({ vibeReferences: refs }),
  addVibeReference: (ref) => set((s) => ({ vibeReferences: [...s.vibeReferences, ref] })),
  removeVibeReference: (id) => set((s) => ({ vibeReferences: s.vibeReferences.filter((r) => r.id !== id) })),
  setPhotoScores: (scores) => set({ photoScores: scores }),
  setCuratedSet: (curatedSet) => set({ curatedSet }),
  resetAlbum: () =>
    set({
      albumId: null,
      photos: [],
      uploadProgress: 0,
      isUploading: false,
      isUploadComplete: false,
      config: { ...defaultConfig },
      albumTitle: 'האלבום שלי',
      vibeReferences: [],
      photoScores: [],
      curatedSet: null,
    }),
}))

if (import.meta.hot) {
  import.meta.hot.accept()
  import.meta.hot.dispose((data: Record<string, unknown>) => {
    data.albumState = useAlbumStore.getState()
  })
  if (import.meta.hot.data?.albumState) {
    useAlbumStore.setState(import.meta.hot.data.albumState as AlbumState)
  }
}
