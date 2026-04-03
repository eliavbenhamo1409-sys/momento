import { create } from 'zustand'
import type { EditorSpread, SidebarMode, SpreadDesign, PhotoElement, QuoteElement } from '../types'
import { EDITOR_SPREADS } from '../lib/constants'
import { getTemplate } from '../lib/layoutGrammar'

function buildEmptyPhotoElement(
  slotId: string,
  page: 'left' | 'right',
  x: number, y: number, w: number, h: number,
): PhotoElement {
  return {
    type: 'photo',
    slotId,
    photoId: '',
    photoUrl: null,
    page,
    x, y, width: w, height: h,
    rotation: 0,
    borderWidth: 0,
    borderColor: 'transparent',
    borderRadius: 8,
    shadow: '',
    padding: 0,
    zIndex: 2,
    objectPosition: '50% 50%',
    objectFit: 'cover',
    importance: 'secondary',
  }
}

function cloneInitialSpreads(): EditorSpread[] {
  return EDITOR_SPREADS.map((s) => ({
    id: s.id,
    templateId: s.templateId,
    leftPhotos: [...s.leftPhotos],
    rightPhotos: [...s.rightPhotos],
    quote: s.quote,
  }))
}

type SwapPhase = 'off' | 'pick-source' | 'pick-target'

interface EditorState {
  spreads: EditorSpread[]
  currentSpreadIndex: number
  selectedPhotoId: string | null
  selectedTextIndex: number | null
  sidebarMode: SidebarMode
  isPreviewOpen: boolean
  isOverviewOpen: boolean
  isSaving: boolean
  lastSaved: Date | null
  isGenerated: boolean

  swapPhase: SwapPhase
  swapSourceSlotId: string | null

  /** Cross-spread photo swap initiated from people panel */
  pendingPhotoSwap: { spreadId: string; slotId: string } | null

  /** Collective white frame (px) around each photo; null = use per-element / family defaults */
  globalPhotoFramePaddingPx: number | null
  globalPageMarginPercent: number | null
  /** Collective corner radius (px) for every photo frame; null = per-element / family */
  globalPhotoBorderRadiusPx: number | null
  setGlobalPhotoFramePadding: (paddingPx: number | null) => void
  setGlobalPageMargin: (margin: number | null) => void
  setGlobalPhotoBorderRadius: (radiusPx: number | null) => void

  setSpreads: (spreads: EditorSpread[]) => void
  setCurrentSpread: (index: number) => void
  selectPhoto: (id: string | null) => void
  selectText: (elementIndex: number | null) => void
  setSidebarMode: (mode: SidebarMode) => void
  togglePreview: () => void
  toggleOverview: () => void
  setSaving: (val: boolean) => void
  setLastSaved: (date: Date) => void
  deselectAll: () => void
  addSpread: () => void
  deleteSpread: (spreadId: string) => void
  resizePhotoSlot: (slotId: string, delta: { width?: number; height?: number }) => void
  setPhotoSlotRect: (slotId: string, rect: { x: number; y: number; width: number; height: number }) => void
  movePhotoSlot: (slotId: string, delta: { x?: number; y?: number }) => void
  updatePhotoSlotRadius: (slotId: string, radius: number) => void
  replacePhotoInSlot: (slotId: string, file: File) => void
  setPhotoSlotUrl: (slotId: string, url: string) => void
  updatePhotoObjectPosition: (slotId: string, objectPosition: string) => void
  updatePhotoScale: (slotId: string, scale: number) => void
  updatePhotoPadding: (slotId: string, padding: number) => void
  moveElementLayer: (elementIndex: number, direction: 'up' | 'down') => void
  removePhotoFromSlot: (slotId: string) => void
  changeSpreadTemplate: (templateId: string) => void
  addTextToSpread: (text: string, fontFamily: string) => void
  updateTextElement: (elementIndex: number, updates: Partial<QuoteElement>) => void
  removeTextElement: (elementIndex: number) => void
  setSpreadGeneratedBg: (bgUrl: string, target: 'spread' | 'left' | 'right', opacity?: number) => void
  removePhotoSlot: (elementIndex: number) => void
  assignSlotImageFromFile: (
    spreadId: string,
    side: 'left' | 'right',
    index: number,
    file: File,
  ) => void
  enterSwapMode: () => void
  cancelSwapMode: () => void
  setSwapSource: (slotId: string) => void
  executeSwap: (targetSlotId: string) => void
  swapPhotosAcrossSpreads: (srcSpreadId: string, srcSlotId: string, tgtSpreadId: string, tgtSlotId: string) => void
  movePhotoToEmptySlot: (srcSpreadId: string, srcSlotId: string, tgtSpreadId: string, tgtSlotId: string) => void
  setPendingPhotoSwap: (source: { spreadId: string; slotId: string } | null) => void
  replacePhotoInSlotBySpread: (spreadId: string, slotId: string, file: File) => void
  removePhotoFromSlotBySpread: (spreadId: string, slotId: string) => void
  setSpreadBgColor: (spreadId: string, color: string) => void
  setAllSpreadsBgColor: (color: string) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  spreads: cloneInitialSpreads(),
  currentSpreadIndex: 0,
  selectedPhotoId: null,
  selectedTextIndex: null,
  sidebarMode: 'page',
  isPreviewOpen: false,
  isOverviewOpen: false,
  isSaving: false,
  lastSaved: null,
  isGenerated: false,
  swapPhase: 'off' as SwapPhase,
  swapSourceSlotId: null,
  pendingPhotoSwap: null,

  globalPhotoFramePaddingPx: null,
  globalPageMarginPercent: null,
  globalPhotoBorderRadiusPx: null,
  setGlobalPhotoFramePadding: (paddingPx) => set({ globalPhotoFramePaddingPx: paddingPx }),
  setGlobalPageMargin: (margin) => set({ globalPageMarginPercent: margin }),
  setGlobalPhotoBorderRadius: (radiusPx) =>
    set({
      globalPhotoBorderRadiusPx:
        radiusPx == null ? null : Math.max(0, Math.min(50, radiusPx)),
    }),

  setSpreads: (spreads) =>
    set({
      spreads,
      currentSpreadIndex: 0,
      selectedPhotoId: null,
      sidebarMode: 'page',
      isGenerated: true,
    }),

  setCurrentSpread: (index) =>
    set((s) => ({
      currentSpreadIndex: Math.max(0, Math.min(index, s.spreads.length - 1)),
      selectedPhotoId: null,
      selectedTextIndex: null,
      sidebarMode: 'page',
    })),
  selectPhoto: (id) => set({ selectedPhotoId: id, selectedTextIndex: null, sidebarMode: id ? 'photo' : 'page' }),
  selectText: (elementIndex) => set({ selectedTextIndex: elementIndex, selectedPhotoId: null, sidebarMode: 'page' }),
  setSidebarMode: (mode) => set({ sidebarMode: mode }),
  togglePreview: () => set((s) => ({ isPreviewOpen: !s.isPreviewOpen, isOverviewOpen: false })),
  toggleOverview: () => set((s) => ({
    isOverviewOpen: !s.isOverviewOpen,
    isPreviewOpen: false,
    selectedPhotoId: null,
    selectedTextIndex: null,
    sidebarMode: 'page' as const,
    swapPhase: 'off' as SwapPhase,
    swapSourceSlotId: null,
  })),
  setSaving: (val) => set({ isSaving: val }),
  setLastSaved: (date) => set({ lastSaved: date, isSaving: false }),
  deselectAll: () => set({ selectedPhotoId: null, selectedTextIndex: null, sidebarMode: 'page', pendingPhotoSwap: null }),

  addSpread: () =>
    set((s) => {
      const spreadId = `spread-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      const defaultDesign: SpreadDesign = {
        elements: [
          buildEmptyPhotoElement('left-empty-0', 'left', 4, 4, 92, 92),
          buildEmptyPhotoElement('right-empty-0', 'right', 4, 4, 44, 44),
          buildEmptyPhotoElement('right-empty-1', 'right', 52, 4, 44, 44),
          buildEmptyPhotoElement('right-empty-2', 'right', 4, 52, 92, 44),
        ],
        background: { color: '#FFFFFF' },
      }

      const newSpread: EditorSpread = {
        id: spreadId,
        templateId: 'balanced-4',
        leftPhotos: [null],
        rightPhotos: [null, null],
        quote: null,
        design: defaultDesign,
      }
      const spreads = [...s.spreads, newSpread]
      return {
        spreads,
        currentSpreadIndex: spreads.length - 1,
        selectedPhotoId: null,
        sidebarMode: 'page',
      }
    }),

  deleteSpread: (spreadId) =>
    set((s) => {
      if (s.spreads.length <= 1) return s
      const removed = s.spreads.find((sp) => sp.id === spreadId)
      if (removed?.design) {
        for (const el of removed.design.elements) {
          if (el.type === 'photo' && 'photoUrl' in el) {
            const url = (el as PhotoElement).photoUrl
            if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
          }
        }
      }
      const spreads = s.spreads.filter((sp) => sp.id !== spreadId)
      return {
        spreads,
        currentSpreadIndex: Math.min(s.currentSpreadIndex, spreads.length - 1),
        selectedPhotoId: null,
        sidebarMode: 'page',
      }
    }),

  resizePhotoSlot: (slotId, delta) =>
    set((s) => {
      const idx = s.currentSpreadIndex
      const spread = s.spreads[idx]
      if (!spread?.design) return s

      const elements = spread.design.elements.map((el) => {
        if (el.type !== 'photo' || el.slotId !== slotId) return el
        const photo = el as PhotoElement
        return {
          ...photo,
          width: Math.max(10, Math.min(95, photo.width + (delta.width ?? 0))),
          height: Math.max(10, Math.min(95, photo.height + (delta.height ?? 0))),
        }
      })

      const spreads = [...s.spreads]
      spreads[idx] = { ...spread, design: { ...spread.design, elements } }
      return { spreads }
    }),

  setPhotoSlotRect: (slotId, rect) =>
    set((s) => {
      const idx = s.currentSpreadIndex
      const spread = s.spreads[idx]
      if (!spread?.design) return s

      const elements = spread.design.elements.map((el) => {
        if (el.type !== 'photo' || el.slotId !== slotId) return el
        return {
          ...el,
          x: Math.max(0, Math.min(90, rect.x)),
          y: Math.max(0, Math.min(90, rect.y)),
          width: Math.max(5, Math.min(100, rect.width)),
          height: Math.max(5, Math.min(100, rect.height)),
        }
      })

      const spreads = [...s.spreads]
      spreads[idx] = { ...spread, design: { ...spread.design, elements } }
      return { spreads }
    }),

  movePhotoSlot: (slotId, delta) =>
    set((s) => {
      const idx = s.currentSpreadIndex
      const spread = s.spreads[idx]
      if (!spread?.design) return s

      const elements = spread.design.elements.map((el) => {
        if (el.type !== 'photo' || el.slotId !== slotId) return el
        const photo = el as PhotoElement
        return {
          ...photo,
          x: Math.max(0, Math.min(90, photo.x + (delta.x ?? 0))),
          y: Math.max(0, Math.min(90, photo.y + (delta.y ?? 0))),
        }
      })

      const spreads = [...s.spreads]
      spreads[idx] = { ...spread, design: { ...spread.design, elements } }
      return { spreads }
    }),

  updatePhotoSlotRadius: (slotId, radius) =>
    set((s) => {
      const idx = s.currentSpreadIndex
      const spread = s.spreads[idx]
      if (!spread?.design) return s

      const elements = spread.design.elements.map((el) => {
        if (el.type !== 'photo' || el.slotId !== slotId) return el
        return { ...el, borderRadius: Math.max(0, Math.min(50, radius)) }
      })

      const spreads = [...s.spreads]
      spreads[idx] = { ...spread, design: { ...spread.design, elements } }
      return { spreads }
    }),

  replacePhotoInSlot: (slotId, file) =>
    set((s) => {
      const idx = s.currentSpreadIndex
      const spread = s.spreads[idx]
      if (!spread?.design) return s

      const url = URL.createObjectURL(file)
      const elements = spread.design.elements.map((el) => {
        if (el.type !== 'photo' || el.slotId !== slotId) return el
        const photo = el as PhotoElement
        if (photo.photoUrl?.startsWith('blob:')) URL.revokeObjectURL(photo.photoUrl)
        return { ...photo, photoUrl: url, photoId: `user-${Date.now()}` }
      })

      const spreads = [...s.spreads]
      spreads[idx] = { ...spread, design: { ...spread.design, elements } }
      return { spreads }
    }),

  setPhotoSlotUrl: (slotId, url) =>
    set((s) => {
      const idx = s.currentSpreadIndex
      const spread = s.spreads[idx]
      if (!spread?.design) return s

      const elements = spread.design.elements.map((el) => {
        if (el.type !== 'photo' || el.slotId !== slotId) return el
        const photo = el as PhotoElement
        if (photo.photoUrl?.startsWith('blob:')) URL.revokeObjectURL(photo.photoUrl)
        return { ...photo, photoUrl: url, photoId: `ai-${Date.now()}` }
      })

      const spreads = [...s.spreads]
      spreads[idx] = { ...spread, design: { ...spread.design, elements } }
      return { spreads }
    }),

  updatePhotoObjectPosition: (slotId, objectPosition) =>
    set((s) => {
      const idx = s.currentSpreadIndex
      const spread = s.spreads[idx]
      if (!spread?.design) return s

      const elements = spread.design.elements.map((el) => {
        if (el.type !== 'photo' || el.slotId !== slotId) return el
        return { ...el, objectPosition }
      })

      const spreads = [...s.spreads]
      spreads[idx] = { ...spread, design: { ...spread.design, elements } }
      return { spreads }
    }),

  updatePhotoScale: (slotId, scale) =>
    set((s) => {
      const idx = s.currentSpreadIndex
      const spread = s.spreads[idx]
      if (!spread?.design) return s

      const elements = spread.design.elements.map((el) => {
        if (el.type !== 'photo' || el.slotId !== slotId) return el
        return { ...el, scale: Math.max(1, Math.min(3, scale)) } as PhotoElement
      })

      const spreads = [...s.spreads]
      spreads[idx] = { ...spread, design: { ...spread.design, elements } }
      return { spreads }
    }),

  updatePhotoPadding: (slotId, padding) =>
    set((s) => {
      const idx = s.currentSpreadIndex
      const spread = s.spreads[idx]
      if (!spread?.design) return s

      const elements = spread.design.elements.map((el) => {
        if (el.type !== 'photo' || el.slotId !== slotId) return el
        return { ...el, padding: Math.max(0, Math.min(20, padding)) } as PhotoElement
      })

      const spreads = [...s.spreads]
      spreads[idx] = { ...spread, design: { ...spread.design, elements } }
      return { spreads }
    }),

  moveElementLayer: (elementIndex, direction) =>
    set((s) => {
      const idx = s.currentSpreadIndex
      const spread = s.spreads[idx]
      if (!spread?.design) return s

      const elements = [...spread.design.elements]
      const swapIdx = direction === 'up' ? elementIndex + 1 : elementIndex - 1
      if (swapIdx < 0 || swapIdx >= elements.length) return s

      const elA = { ...elements[elementIndex] }
      const elB = { ...elements[swapIdx] }
      const tmpZ = (elA as PhotoElement).zIndex
      ;(elA as PhotoElement).zIndex = (elB as PhotoElement).zIndex
      ;(elB as PhotoElement).zIndex = tmpZ
      elements[elementIndex] = elB
      elements[swapIdx] = elA

      const spreads = [...s.spreads]
      spreads[idx] = { ...spread, design: { ...spread.design, elements } }
      return { spreads }
    }),

  removePhotoFromSlot: (slotId) =>
    set((s) => {
      const idx = s.currentSpreadIndex
      const spread = s.spreads[idx]
      if (!spread?.design) return s

      const elements = spread.design.elements.map((el) => {
        if (el.type !== 'photo' || el.slotId !== slotId) return el
        const photo = el as PhotoElement
        if (photo.photoUrl?.startsWith('blob:')) URL.revokeObjectURL(photo.photoUrl)
        return { ...photo, photoUrl: null, photoId: '' }
      })

      const spreads = [...s.spreads]
      spreads[idx] = { ...spread, design: { ...spread.design, elements } }
      return { spreads, selectedPhotoId: null, sidebarMode: 'page' as const }
    }),

  changeSpreadTemplate: (templateId) =>
    set((s) => {
      const idx = s.currentSpreadIndex
      const spread = s.spreads[idx]
      if (!spread?.design) return s

      const template = getTemplate(templateId)
      if (!template) return s

      // Gather existing photo URLs from the current design
      const existingPhotos = spread.design.elements
        .filter((el): el is PhotoElement => el.type === 'photo' && !!el.photoUrl)
        .map((el) => ({ url: el.photoUrl!, id: el.photoId, objectPosition: el.objectPosition }))

      // Build new elements from the template slots
      const newElements: PhotoElement[] = template.slots
        .filter((sl) => !sl.id.endsWith('-mirror'))
        .map((sl, i) => {
          const existing = existingPhotos[i]
          return {
            type: 'photo' as const,
            slotId: sl.id,
            photoId: existing?.id ?? '',
            photoUrl: existing?.url ?? null,
            page: sl.page,
            x: sl.x,
            y: sl.y,
            width: sl.width,
            height: sl.height,
            rotation: 0,
            borderWidth: 0,
            borderColor: 'transparent',
            borderRadius: 4,
            shadow: '',
            padding: 6,
            zIndex: 2,
            objectPosition: existing?.objectPosition ?? '50% 50%',
            objectFit: 'cover' as const,
            importance: sl.importance,
          }
        })

      const newDesign: SpreadDesign = {
        elements: newElements,
        background: spread.design.background,
      }

      const spreads = [...s.spreads]
      spreads[idx] = {
        ...spread,
        templateId,
        design: newDesign,
        leftPhotos: newElements.filter((e) => e.page === 'left').map((e) => e.photoUrl),
        rightPhotos: newElements.filter((e) => e.page === 'right').map((e) => e.photoUrl),
      }
      return { spreads, selectedPhotoId: null }
    }),

  addTextToSpread: (text, fontFamily) =>
    set((s) => {
      const idx = s.currentSpreadIndex
      const spread = s.spreads[idx]
      if (!spread?.design) return s

      const newQuote: QuoteElement = {
        type: 'quote',
        text,
        page: 'right',
        x: 10,
        y: 40,
        width: 80,
        height: 20,
        fontFamily,
        fontSize: 18,
        fontWeight: 400,
        italic: false,
        color: '#2D2823',
        align: 'center',
        lineHeight: 1.6,
        letterSpacing: '0.02em',
        zIndex: 10,
        quoteMarks: 'none',
      }

      const elements = [...spread.design.elements, newQuote]
      const spreads = [...s.spreads]
      spreads[idx] = { ...spread, design: { ...spread.design, elements } }
      return { spreads }
    }),

  updateTextElement: (elementIndex, updates) =>
    set((s) => {
      const idx = s.currentSpreadIndex
      const spread = s.spreads[idx]
      if (!spread?.design) return s

      const el = spread.design.elements[elementIndex]
      if (!el || el.type !== 'quote') return s

      const elements = [...spread.design.elements]
      elements[elementIndex] = { ...el, ...updates, type: 'quote' }

      const spreads = [...s.spreads]
      spreads[idx] = { ...spread, design: { ...spread.design, elements } }
      return { spreads }
    }),

  removeTextElement: (elementIndex) =>
    set((s) => {
      const idx = s.currentSpreadIndex
      const spread = s.spreads[idx]
      if (!spread?.design) return s

      const el = spread.design.elements[elementIndex]
      if (!el || el.type !== 'quote') return s

      const elements = spread.design.elements.filter((_, i) => i !== elementIndex)
      const spreads = [...s.spreads]
      spreads[idx] = { ...spread, design: { ...spread.design, elements } }
      return { spreads, selectedTextIndex: null }
    }),

  setSpreadGeneratedBg: (bgUrl, target, opacity = 1) =>
    set((s) => {
      const idx = s.currentSpreadIndex
      const spread = s.spreads[idx]
      if (!spread?.design) return s

      const bg = { ...spread.design.background }
      if (target === 'spread') {
        bg.generatedBgUrl = bgUrl
        bg.generatedBgOpacity = opacity
      } else if (target === 'left') {
        bg.generatedBgLeftUrl = bgUrl
        bg.generatedBgLeftOpacity = opacity
      } else {
        bg.generatedBgRightUrl = bgUrl
        bg.generatedBgRightOpacity = opacity
      }

      const spreads = [...s.spreads]
      spreads[idx] = { ...spread, design: { ...spread.design, background: bg } }
      return { spreads }
    }),

  removePhotoSlot: (elementIndex) =>
    set((s) => {
      const idx = s.currentSpreadIndex
      const spread = s.spreads[idx]
      if (!spread?.design) return s

      const el = spread.design.elements[elementIndex]
      if (!el || el.type !== 'photo') return s

      if (el.type === 'photo' && 'photoUrl' in el && (el as PhotoElement).photoUrl?.startsWith('blob:')) {
        URL.revokeObjectURL((el as PhotoElement).photoUrl!)
      }

      const elements = spread.design.elements.filter((_, i) => i !== elementIndex)
      const spreads = [...s.spreads]
      spreads[idx] = { ...spread, design: { ...spread.design, elements } }
      return { spreads, selectedPhotoId: null }
    }),

  assignSlotImageFromFile: (spreadId, side, index, file) =>
    set((s) => ({
      spreads: s.spreads.map((sp) => {
        if (sp.id !== spreadId) return sp

        const url = URL.createObjectURL(file)

        const key = side === 'left' ? 'leftPhotos' : 'rightPhotos'
        const next = [...sp[key]]
        const prev = next[index]
        if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev)
        next[index] = url

        let updatedDesign = sp.design
        if (updatedDesign) {
          const pageElements = updatedDesign.elements.filter(
            (el) => el.type === 'photo' && el.page === side,
          ) as PhotoElement[]
          if (index < pageElements.length) {
            const targetSlotId = pageElements[index].slotId
            updatedDesign = {
              ...updatedDesign,
              elements: updatedDesign.elements.map((el) =>
                el.type === 'photo' && el.slotId === targetSlotId
                  ? { ...el, photoUrl: url, photoId: `user-${Date.now()}` }
                  : el,
              ),
            }
          }
        }

        return { ...sp, [key]: next, design: updatedDesign }
      }),
    })),

  enterSwapMode: () =>
    set({ swapPhase: 'pick-source', swapSourceSlotId: null, selectedPhotoId: null }),

  cancelSwapMode: () =>
    set({ swapPhase: 'off', swapSourceSlotId: null }),

  setSwapSource: (slotId) =>
    set({ swapPhase: 'pick-target', swapSourceSlotId: slotId }),

  executeSwap: (targetSlotId) =>
    set((s) => {
      const srcSlotId = s.swapSourceSlotId
      if (!srcSlotId || srcSlotId === targetSlotId) {
        return { swapPhase: 'off' as SwapPhase, swapSourceSlotId: null }
      }

      const idx = s.currentSpreadIndex
      const spread = s.spreads[idx]
      if (!spread?.design) {
        return { swapPhase: 'off' as SwapPhase, swapSourceSlotId: null }
      }

      const srcEl = spread.design.elements.find(
        (el) => el.type === 'photo' && el.slotId === srcSlotId,
      ) as PhotoElement | undefined
      const tgtEl = spread.design.elements.find(
        (el) => el.type === 'photo' && el.slotId === targetSlotId,
      ) as PhotoElement | undefined

      if (!srcEl || !tgtEl) {
        return { swapPhase: 'off' as SwapPhase, swapSourceSlotId: null }
      }

      const elements = spread.design.elements.map((el) => {
        if (el.type !== 'photo') return el
        if (el.slotId === srcSlotId) {
          return {
            ...el,
            photoUrl: tgtEl.photoUrl,
            photoId: tgtEl.photoId,
            objectPosition: tgtEl.objectPosition,
            scale: tgtEl.scale,
          } as PhotoElement
        }
        if (el.slotId === targetSlotId) {
          return {
            ...el,
            photoUrl: srcEl.photoUrl,
            photoId: srcEl.photoId,
            objectPosition: srcEl.objectPosition,
            scale: srcEl.scale,
          } as PhotoElement
        }
        return el
      })

      const spreads = [...s.spreads]
      spreads[idx] = { ...spread, design: { ...spread.design, elements } }

      return {
        spreads,
        swapPhase: 'off' as SwapPhase,
        swapSourceSlotId: null,
        selectedPhotoId: null,
      }
    }),

  swapPhotosAcrossSpreads: (srcSpreadId, srcSlotId, tgtSpreadId, tgtSlotId) =>
    set((s) => {
      const srcIdx = s.spreads.findIndex((sp) => sp.id === srcSpreadId)
      const tgtIdx = s.spreads.findIndex((sp) => sp.id === tgtSpreadId)
      if (srcIdx === -1 || tgtIdx === -1) return s

      const srcSpread = s.spreads[srcIdx]
      const tgtSpread = s.spreads[tgtIdx]
      if (!srcSpread.design || !tgtSpread.design) return s

      const srcEl = srcSpread.design.elements.find(
        (el) => el.type === 'photo' && el.slotId === srcSlotId,
      ) as PhotoElement | undefined
      const tgtEl = tgtSpread.design.elements.find(
        (el) => el.type === 'photo' && el.slotId === tgtSlotId,
      ) as PhotoElement | undefined
      if (!srcEl || !tgtEl) return s

      const spreads = [...s.spreads]

      if (srcIdx === tgtIdx) {
        const elements = srcSpread.design.elements.map((el) => {
          if (el.type !== 'photo') return el
          if (el.slotId === srcSlotId)
            return { ...el, photoUrl: tgtEl.photoUrl, photoId: tgtEl.photoId, objectPosition: tgtEl.objectPosition, scale: tgtEl.scale } as PhotoElement
          if (el.slotId === tgtSlotId)
            return { ...el, photoUrl: srcEl.photoUrl, photoId: srcEl.photoId, objectPosition: srcEl.objectPosition, scale: srcEl.scale } as PhotoElement
          return el
        })
        spreads[srcIdx] = { ...srcSpread, design: { ...srcSpread.design, elements } }
      } else {
        const srcElements = srcSpread.design.elements.map((el) =>
          el.type === 'photo' && el.slotId === srcSlotId
            ? { ...el, photoUrl: tgtEl.photoUrl, photoId: tgtEl.photoId, objectPosition: tgtEl.objectPosition, scale: tgtEl.scale } as PhotoElement
            : el,
        )
        spreads[srcIdx] = { ...srcSpread, design: { ...srcSpread.design, elements: srcElements } }

        const tgtElements = tgtSpread.design.elements.map((el) =>
          el.type === 'photo' && el.slotId === tgtSlotId
            ? { ...el, photoUrl: srcEl.photoUrl, photoId: srcEl.photoId, objectPosition: srcEl.objectPosition, scale: srcEl.scale } as PhotoElement
            : el,
        )
        spreads[tgtIdx] = { ...tgtSpread, design: { ...tgtSpread.design, elements: tgtElements } }
      }

      return { spreads }
    }),

  movePhotoToEmptySlot: (srcSpreadId, srcSlotId, tgtSpreadId, tgtSlotId) =>
    set((s) => {
      const srcIdx = s.spreads.findIndex((sp) => sp.id === srcSpreadId)
      const tgtIdx = s.spreads.findIndex((sp) => sp.id === tgtSpreadId)
      if (srcIdx === -1 || tgtIdx === -1) return s

      const srcSpread = s.spreads[srcIdx]
      const tgtSpread = s.spreads[tgtIdx]
      if (!srcSpread.design || !tgtSpread.design) return s

      const srcEl = srcSpread.design.elements.find(
        (el) => el.type === 'photo' && el.slotId === srcSlotId,
      ) as PhotoElement | undefined
      if (!srcEl || !srcEl.photoUrl) return s

      const spreads = [...s.spreads]

      if (srcIdx === tgtIdx) {
        const elements = srcSpread.design.elements.map((el) => {
          if (el.type !== 'photo') return el
          if (el.slotId === srcSlotId)
            return { ...el, photoUrl: null, photoId: '' } as PhotoElement
          if (el.slotId === tgtSlotId)
            return { ...el, photoUrl: srcEl.photoUrl, photoId: srcEl.photoId, objectPosition: srcEl.objectPosition, scale: srcEl.scale } as PhotoElement
          return el
        })
        spreads[srcIdx] = { ...srcSpread, design: { ...srcSpread.design, elements } }
      } else {
        const srcElements = srcSpread.design.elements.map((el) =>
          el.type === 'photo' && el.slotId === srcSlotId
            ? { ...el, photoUrl: null, photoId: '' } as PhotoElement
            : el,
        )
        spreads[srcIdx] = { ...srcSpread, design: { ...srcSpread.design, elements: srcElements } }

        const tgtElements = tgtSpread.design.elements.map((el) =>
          el.type === 'photo' && el.slotId === tgtSlotId
            ? { ...el, photoUrl: srcEl.photoUrl, photoId: srcEl.photoId, objectPosition: srcEl.objectPosition, scale: srcEl.scale } as PhotoElement
            : el,
        )
        spreads[tgtIdx] = { ...tgtSpread, design: { ...tgtSpread.design, elements: tgtElements } }
      }

      return { spreads }
    }),

  setPendingPhotoSwap: (source) => set({ pendingPhotoSwap: source }),

  replacePhotoInSlotBySpread: (spreadId, slotId, file) =>
    set((s) => {
      const idx = s.spreads.findIndex((sp) => sp.id === spreadId)
      if (idx === -1) return s
      const spread = s.spreads[idx]
      if (!spread?.design) return s

      const url = URL.createObjectURL(file)
      const elements = spread.design.elements.map((el) => {
        if (el.type !== 'photo' || el.slotId !== slotId) return el
        const photo = el as PhotoElement
        if (photo.photoUrl?.startsWith('blob:')) URL.revokeObjectURL(photo.photoUrl)
        return { ...photo, photoUrl: url, photoId: `user-${Date.now()}` }
      })

      const spreads = [...s.spreads]
      spreads[idx] = { ...spread, design: { ...spread.design, elements } }
      return { spreads }
    }),

  removePhotoFromSlotBySpread: (spreadId, slotId) =>
    set((s) => {
      const idx = s.spreads.findIndex((sp) => sp.id === spreadId)
      if (idx === -1) return s
      const spread = s.spreads[idx]
      if (!spread?.design) return s

      const elements = spread.design.elements.map((el) => {
        if (el.type !== 'photo' || el.slotId !== slotId) return el
        const photo = el as PhotoElement
        if (photo.photoUrl?.startsWith('blob:')) URL.revokeObjectURL(photo.photoUrl)
        return { ...photo, photoUrl: null, photoId: '' }
      })

      const spreads = [...s.spreads]
      spreads[idx] = { ...spread, design: { ...spread.design, elements } }
      return { spreads }
    }),

  setSpreadBgColor: (spreadId, color) =>
    set((s) => {
      const idx = s.spreads.findIndex((sp) => sp.id === spreadId)
      if (idx === -1) return s
      const spread = s.spreads[idx]
      if (!spread?.design) return s

      const spreads = [...s.spreads]
      spreads[idx] = { ...spread, design: { ...spread.design, background: { ...spread.design.background, color } } }
      return { spreads }
    }),

  setAllSpreadsBgColor: (color) =>
    set((s) => ({
      spreads: s.spreads.map((sp) => {
        if (!sp.design) return sp
        return { ...sp, design: { ...sp.design, background: { ...sp.design.background, color } } }
      }),
    })),
}))

// Preserve state across Vite HMR so the user's work isn't lost when code changes
if (import.meta.hot) {
  import.meta.hot.accept()
  import.meta.hot.dispose((data: Record<string, unknown>) => {
    data.editorState = useEditorStore.getState()
  })
  if (import.meta.hot.data?.editorState) {
    useEditorStore.setState(import.meta.hot.data.editorState as EditorState)
  }
}
