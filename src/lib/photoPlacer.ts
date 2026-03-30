import type {
  SpreadPlan,
  PhotoScore,
  Photo,
  SlotAssignment,
  CropSuggestion,
  FinalSlotData,
  SlotDefinition,
  EditorSpread,
  SpreadDesign,
  PhotoElement,
  SpreadSequenceSlot,
  SlotImportance,
  PhotoOrientation,
  FaceRegion,
  LayoutTemplate,
} from '../types'
import {
  getTemplate,
  getFallbackTemplate,
  LAYOUT_TEMPLATES,
  isTemplateAllowedAtPosition,
} from './layoutGrammar'

// ─── Orientation matching score ─────────────────────────────────────

function orientationMatchScore(
  slotAccepts: SlotDefinition['accepts'],
  photoOrientation: PhotoScore['orientation'],
): number {
  if (slotAccepts.includes('any')) return 0.8
  if (slotAccepts.includes(photoOrientation)) return 1.0
  return 0.2
}

// ─── Quality-to-importance score ────────────────────────────────────

function importanceMatchScore(
  slotImportance: SlotDefinition['importance'],
  photoQuality: number,
): number {
  const thresholds = { hero: 7, primary: 5, secondary: 3, accent: 1 }
  const threshold = thresholds[slotImportance]
  if (photoQuality >= threshold) return 1.0
  if (photoQuality >= threshold - 2) return 0.6
  return 0.3
}

// ─── Face safety check ──────────────────────────────────────────────

function isFaceSafe(
  facesRegion: PhotoScore['facesRegion'],
  safeZone: SlotDefinition['safeZone'],
): boolean {
  if (facesRegion === 'none') return true

  const topSafe = safeZone.top <= 20
  const bottomSafe = safeZone.bottom <= 20
  const leftSafe = safeZone.left <= 20
  const rightSafe = safeZone.right <= 20

  switch (facesRegion) {
    case 'center':
    case 'spread':
      return true
    case 'top':
      return topSafe
    case 'bottom':
      return bottomSafe
    case 'left':
      return leftSafe
    case 'right':
      return rightSafe
    default:
      return true
  }
}

// ─── Crop suggestion computation ────────────────────────────────────

function computeCrop(
  photo: PhotoScore,
  slot: SlotDefinition,
): CropSuggestion | null {
  let focusX = 0.5
  let focusY = 0.5

  if (photo.hasFaces) {
    switch (photo.facesRegion) {
      case 'left': focusX = 0.30; break
      case 'right': focusX = 0.70; break
      case 'top': focusY = 0.20; break
      case 'bottom': focusY = 0.75; break
      case 'center': focusY = 0.25; break
      case 'spread': focusY = 0.35; break
    }
    return { focusX, focusY, scale: 1.0, reason: 'מיקוד על פנים' }
  }

  const slotAspect = slot.width / slot.height
  const photoAspect = photo.aspectRatio
  const orientationMatch = slot.accepts.includes(photo.orientation) || slot.accepts.includes('any')
  if (orientationMatch && Math.abs(slotAspect - photoAspect) < 0.3) {
    return null
  }

  return { focusX, focusY, scale: 1.0, reason: 'התאמת יחס גובה-רוחב' }
}

// ─── Slot-to-Photo Matching (Hungarian-lite) ────────────────────────

interface MatchCandidate {
  slotId: string
  photoId: string
  score: number
  needsCrop: boolean
  crop: CropSuggestion | null
}

function matchPhotosToSlots(
  slots: SlotDefinition[],
  photos: PhotoScore[],
  photoUrlMap: Map<string, string>,
  globalUsed?: Set<string>,
): SlotAssignment[] {
  const sortedSlots = [...slots].sort((a, b) => {
    const order = { hero: 0, primary: 1, secondary: 2, accent: 3 }
    return order[a.importance] - order[b.importance]
  })

  const sortedPhotos = [...photos].sort((a, b) => b.overallQuality - a.overallQuality)
  const usedPhotos = new Set<string>()
  const assignments: SlotAssignment[] = []

  const heroPhotos = sortedPhotos.filter((p) => p.overallQuality >= 9)
  const heroSlots = sortedSlots.filter((s) => s.importance === 'hero' || s.importance === 'primary')

  for (let i = 0; i < Math.min(heroPhotos.length, heroSlots.length); i++) {
    const photo = heroPhotos[i]
    const slot = heroSlots[i]
    if (usedPhotos.has(photo.photoId) || globalUsed?.has(photo.photoId)) continue

    usedPhotos.add(photo.photoId)
    globalUsed?.add(photo.photoId)
    const crop = computeCrop(photo, slot)
    assignments.push({
      spreadIndex: 0,
      slotId: slot.id,
      photoId: photo.photoId,
      photoUrl: photoUrlMap.get(photo.photoId) ?? '',
      needsCrop: crop !== null,
      cropSuggestion: crop,
      fitMode: crop ? 'custom' : 'cover',
    })
  }

  const assignedSlotIds = new Set(assignments.map((a) => a.slotId))
  const remainingSlots = sortedSlots.filter((s) => !assignedSlotIds.has(s.id))

  for (const slot of remainingSlots) {
    let bestCandidate: MatchCandidate | null = null
    let bestScore = -Infinity

    for (const photo of sortedPhotos) {
      if (usedPhotos.has(photo.photoId) || globalUsed?.has(photo.photoId)) continue

      const oScore = orientationMatchScore(slot.accepts, photo.orientation)
      const iScore = importanceMatchScore(slot.importance, photo.overallQuality)
      const fSafe = isFaceSafe(photo.facesRegion, slot.safeZone)
      const fPenalty = fSafe ? 0 : -0.3

      const totalScore = oScore * 0.4 + iScore * 0.4 + (photo.overallQuality / 10) * 0.2 + fPenalty
      const crop = computeCrop(photo, slot)

      if (totalScore > bestScore) {
        bestScore = totalScore
        bestCandidate = {
          slotId: slot.id,
          photoId: photo.photoId,
          score: totalScore,
          needsCrop: crop !== null,
          crop,
        }
      }
    }

    if (bestCandidate) {
      usedPhotos.add(bestCandidate.photoId)
      globalUsed?.add(bestCandidate.photoId)
      assignments.push({
        spreadIndex: 0,
        slotId: bestCandidate.slotId,
        photoId: bestCandidate.photoId,
        photoUrl: photoUrlMap.get(bestCandidate.photoId) ?? '',
        needsCrop: bestCandidate.needsCrop,
        cropSuggestion: bestCandidate.crop,
        fitMode: bestCandidate.needsCrop ? 'custom' : 'cover',
      })
    }
  }

  return assignments
}

// ─── Convert Crop to CSS ────────────────────────────────────────────

function cropToSlotData(assignment: SlotAssignment): FinalSlotData {
  const crop = assignment.cropSuggestion

  return {
    slotId: assignment.slotId,
    photoUrl: assignment.photoUrl,
    objectFit: 'cover',
    objectPosition: crop
      ? `${Math.round(crop.focusX * 100)}% ${Math.round(crop.focusY * 100)}%`
      : '50% 50%',
    transform: '',
  }
}

// ─── Main Placement Pipeline ────────────────────────────────────────

/**
 * Given an array of SpreadPlans (from AI or fallback) and all photo data,
 * produce fully assembled EditorSpread[] ready for the editor.
 */
export function placePhotosInSpreads(
  plans: SpreadPlan[],
  allScores: Map<string, PhotoScore>,
  allPhotos: Map<string, Photo>,
  totalSpreads: number,
): EditorSpread[] {
  const photoUrlMap = new Map<string, string>()
  for (const [id, photo] of allPhotos) {
    photoUrlMap.set(id, photo.fullUrl)
  }

  const globalUsed = new Set<string>()

  return plans.map((plan, idx) => {
    const template = getTemplate(plan.templateId) ?? getFallbackTemplate(idx, totalSpreads)
    const planScores = plan.assignedPhotoIds
      .map((id) => allScores.get(id))
      .filter(Boolean) as PhotoScore[]

    const assignments = matchPhotosToSlots(template.slots, planScores, photoUrlMap, globalUsed)
    const slotDataArr = assignments.map(cropToSlotData)

    const leftSlots = template.slots.filter((s) => s.page === 'left')
    const rightSlots = template.slots.filter((s) => s.page === 'right')

    const leftPhotos: (string | null)[] = leftSlots.map((s) => {
      const a = assignments.find((a) => a.slotId === s.id)
      return a?.photoUrl ?? null
    })

    const rightPhotos: (string | null)[] = rightSlots.map((s) => {
      const a = assignments.find((a) => a.slotId === s.id)
      return a?.photoUrl ?? null
    })

    return {
      id: `spread-${idx}-${Date.now().toString(36)}`,
      templateId: template.id,
      leftPhotos,
      rightPhotos,
      quote: plan.quote,
      slots: slotDataArr,
      theme: plan.theme,
    }
  })
}

/**
 * Deterministic fallback: distribute photos round-robin across spreads
 * using the fallback template sequence.
 */
export function buildFallbackSpreads(
  photos: Photo[],
  pageCount: number,
): EditorSpread[] {
  const spreadCount = Math.max(3, Math.floor(pageCount / 2))
  const plans: SpreadPlan[] = []

  let photoIdx = 0
  for (let i = 0; i < spreadCount; i++) {
    const template = getFallbackTemplate(i, spreadCount)
    const needed = Math.min(template.maxPhotos, photos.length - photoIdx)
    const ids = photos.slice(photoIdx, photoIdx + needed).map((p) => p.id)
    photoIdx += needed

    plans.push({
      spreadIndex: i,
      templateId: template.id,
      theme: i === 0 ? 'פתיחה' : i === spreadCount - 1 ? 'סיום' : '',
      assignedPhotoIds: ids,
      quote: null,
    })

    if (photoIdx >= photos.length) break
  }

  const scoreMap = new Map<string, PhotoScore>()
  for (const photo of photos) {
    scoreMap.set(photo.id, {
      photoId: photo.id,
      orientation: photo.width > photo.height ? 'landscape' : photo.height > photo.width ? 'portrait' : 'square',
      aspectRatio: photo.width / photo.height,
      sharpness: 5, exposure: 5, composition: 5, overallQuality: 5,
      scene: 'outdoor', peopleCount: 0, hasFaces: false, facesRegion: 'none',
      emotion: 'neutral', colorDominant: 'neutral',
      isHighlight: false, isCoverCandidate: false, isHeroCandidate: false,
      isCloseup: false, isGroupShot: false,
      description: '',
    })
  }

  const photoMap = new Map(photos.map((p) => [p.id, p]))
  return placePhotosInSpreads(plans, scoreMap, photoMap, spreadCount)
}

// ═══════════════════════════════════════════════════════════════════════
//  NEW: Place photos into AI-generated SpreadDesign skeletons
// ═══════════════════════════════════════════════════════════════════════

function orientationFromAspect(w: number, h: number): PhotoOrientation {
  const ratio = w / h
  if (ratio > 1.15) return 'landscape'
  if (ratio < 0.85) return 'portrait'
  return 'square'
}

/**
 * Compute the ideal objectPosition for a photo in a slot, considering
 * the actual aspect-ratio mismatch and where the face is.
 *
 * With object-fit: cover, either the horizontal or vertical axis is cropped.
 * The percentage in objectPosition controls how the overflow is distributed:
 * 0% = show start edge, 50% = center, 100% = show end edge.
 */
export function computeSmartFacePosition(
  photoAspect: number,
  slotW: number,
  slotH: number,
  facesRegion: PhotoScore['facesRegion'],
): string {
  const slotAspect = slotW / slotH
  const isVerticalCrop = photoAspect < slotAspect
  const isHorizontalCrop = photoAspect > slotAspect

  let xPct = 50
  let yPct = 50

  if (isVerticalCrop) {
    // Photo is more portrait than slot — top/bottom is cropped
    const photoVisibleHeight = slotAspect / photoAspect
    const overflowRatio = 1 - (1 / photoVisibleHeight)
    // More overflow = need more aggressive positioning
    const aggressiveness = Math.min(overflowRatio * 2, 1)

    switch (facesRegion) {
      case 'top': yPct = 10 + (1 - aggressiveness) * 10; break
      case 'center': yPct = 20 + (1 - aggressiveness) * 15; break
      case 'spread': yPct = 25 + (1 - aggressiveness) * 10; break
      case 'bottom': yPct = 80 - (1 - aggressiveness) * 10; break
      case 'left': xPct = 40; yPct = 30; break
      case 'right': xPct = 60; yPct = 30; break
      default: break
    }
  } else if (isHorizontalCrop) {
    // Photo is more landscape than slot — left/right is cropped
    switch (facesRegion) {
      case 'left': xPct = 25; break
      case 'right': xPct = 75; break
      case 'top': yPct = 20; break
      case 'center': yPct = 35; break
      case 'spread': yPct = 40; break
      case 'bottom': yPct = 75; break
      default: break
    }
  } else {
    // Minimal cropping — gentle adjustments
    switch (facesRegion) {
      case 'top': yPct = 30; break
      case 'center': yPct = 40; break
      case 'left': xPct = 35; break
      case 'right': xPct = 65; break
      case 'bottom': yPct = 65; break
      default: break
    }
  }

  return `${Math.round(xPct)}% ${Math.round(yPct)}%`
}

function slotAcceptsOrientation(
  accepts: ('portrait' | 'landscape' | 'any')[],
  orientation: PhotoOrientation,
): number {
  if (accepts.includes('any')) return 0.8
  if (accepts.includes(orientation as 'portrait' | 'landscape')) return 1.0
  return 0.3
}

function importanceToOrder(imp: SlotImportance): number {
  return { hero: 0, primary: 1, secondary: 2, accent: 3 }[imp]
}

/**
 * Given validated SpreadDesigns with empty photo slots and scored photos,
 * fills in the photo URLs using quality/orientation matching.
 * Returns EditorSpread[] ready for the editor.
 */
export function placePhotosInDesigns(
  designs: SpreadDesign[],
  allScores: PhotoScore[],
  allPhotos: Map<string, Photo>,
  sequencePlan?: SpreadSequenceSlot[],
): EditorSpread[] {
  const photoUrlMap = new Map<string, string>()
  for (const [id, photo] of allPhotos) {
    photoUrlMap.set(id, photo.fullUrl)
  }

  const sortedPhotos = [...allScores].sort((a, b) => b.overallQuality - a.overallQuality)
  const globalUsed = new Set<string>()

  return designs.map((design, idx) => {
    const photoSlots = design.elements
      .filter((el): el is PhotoElement => el.type === 'photo')
      .sort((a, b) => importanceToOrder(a.importance) - importanceToOrder(b.importance))

    const quoteElement = design.elements.find((el) => el.type === 'quote')
    const quote = quoteElement && 'text' in quoteElement ? (quoteElement as { text: string }).text : null

    const leftPhotos: (string | null)[] = []
    const rightPhotos: (string | null)[] = []

    for (const slot of photoSlots) {
      let bestPhotoId: string | null = null
      let bestScore = -Infinity

      const slotOrientation = orientationFromAspect(slot.width, slot.height)
      const slotAccepts: ('portrait' | 'landscape' | 'any')[] =
        slotOrientation === 'landscape' ? ['landscape', 'any'] :
        slotOrientation === 'portrait' ? ['portrait', 'any'] : ['any']

      for (const photo of sortedPhotos) {
        if (globalUsed.has(photo.photoId)) continue

        const oScore = slotAcceptsOrientation(slotAccepts, photo.orientation)
        const thresholds = { hero: 7, primary: 5, secondary: 3, accent: 1 }
        const threshold = thresholds[slot.importance] ?? 3
        const iScore = photo.overallQuality >= threshold ? 1.0 : photo.overallQuality >= threshold - 2 ? 0.6 : 0.3
        const totalScore = oScore * 0.4 + iScore * 0.4 + (photo.overallQuality / 10) * 0.2

        if (totalScore > bestScore) {
          bestScore = totalScore
          bestPhotoId = photo.photoId
        }
      }

      if (bestPhotoId) {
        globalUsed.add(bestPhotoId)
        const url = photoUrlMap.get(bestPhotoId) ?? null

        slot.photoId = bestPhotoId
        slot.photoUrl = url

        const photo = allScores.find((s) => s.photoId === bestPhotoId)
        if (photo?.hasFaces && photo.facesRegion !== 'none') {
          slot.objectPosition = computeSmartFacePosition(
            photo.aspectRatio,
            slot.width,
            slot.height,
            photo.facesRegion,
          )
        }

        if (slot.page === 'left' || slot.page === 'full') leftPhotos.push(url)
        else rightPhotos.push(url)
      }
    }

    const seqSlot = sequencePlan?.[idx]

    return {
      id: `spread-${idx}-${Date.now().toString(36)}`,
      templateId: 'ai-skeleton',
      familyId: undefined,
      role: seqSlot?.role,
      leftPhotos,
      rightPhotos,
      quote,
      design,
    } satisfies EditorSpread
  })
}

// ═══════════════════════════════════════════════════════════════════════
//  Face Crop Severity & Template Swapping
// ═══════════════════════════════════════════════════════════════════════

/**
 * Compute how severely a face would be cropped when a photo is placed
 * in a slot with object-fit:cover.
 *
 * Returns 0 (no crop risk) → 1 (faces almost certainly cropped).
 * Values > 0.5 mean position adjustment alone is unlikely to help.
 */
export function computeFaceCropSeverity(
  photoAspect: number,
  slotW: number,
  slotH: number,
  facesRegion: FaceRegion,
): number {
  if (facesRegion === 'none') return 0

  const slotAspect = slotW / slotH
  const isVerticalCrop = photoAspect < slotAspect
  const isHorizontalCrop = photoAspect > slotAspect

  if (!isVerticalCrop && !isHorizontalCrop) return 0

  if (isVerticalCrop) {
    const visibleFraction = photoAspect / slotAspect
    const croppedFraction = 1 - visibleFraction

    switch (facesRegion) {
      case 'top':
      case 'bottom':
        return Math.min(croppedFraction * 2.5, 1)
      case 'center':
      case 'spread':
        return croppedFraction * 0.4
      case 'left':
      case 'right':
        return croppedFraction * 0.6
    }
  }

  if (isHorizontalCrop) {
    const visibleFraction = slotAspect / photoAspect
    const croppedFraction = 1 - visibleFraction

    switch (facesRegion) {
      case 'left':
      case 'right':
        return Math.min(croppedFraction * 2.5, 1)
      case 'center':
      case 'spread':
        return croppedFraction * 0.4
      case 'top':
      case 'bottom':
        return croppedFraction * 0.6
    }
  }

  return 0
}

/**
 * After applying a position fix, verify that the face region would actually
 * be visible. Uses the real geometry of overflow + position offset.
 *
 * Returns true if the face is likely visible, false if still cropped.
 */
export function isFaceVisibleAfterPosition(
  photoAspect: number,
  slotW: number,
  slotH: number,
  facesRegion: FaceRegion,
  objectPosition: string,
): boolean {
  if (facesRegion === 'none') return true

  const slotAspect = slotW / slotH
  const [xStr, yStr] = objectPosition.split(' ')
  const xPct = parseFloat(xStr) || 50
  const yPct = parseFloat(yStr) || 50

  const isVerticalCrop = photoAspect < slotAspect

  if (isVerticalCrop) {
    const visibleFraction = photoAspect / slotAspect
    if (visibleFraction >= 0.85) return true

    const viewportStart = (yPct / 100) * (1 - visibleFraction)
    const viewportEnd = viewportStart + visibleFraction

    const faceZones: Record<string, [number, number]> = {
      top: [0, 0.35],
      center: [0.25, 0.55],
      spread: [0.2, 0.6],
      bottom: [0.65, 1.0],
      left: [0.2, 0.5],
      right: [0.2, 0.5],
    }
    const [faceStart, faceEnd] = faceZones[facesRegion] ?? [0.3, 0.7]
    const overlap = Math.min(viewportEnd, faceEnd) - Math.max(viewportStart, faceStart)
    const faceSize = faceEnd - faceStart
    return overlap / faceSize >= 0.6
  }

  const isHorizontalCrop = photoAspect > slotAspect
  if (isHorizontalCrop) {
    const visibleFraction = slotAspect / photoAspect
    if (visibleFraction >= 0.85) return true

    const viewportStart = (xPct / 100) * (1 - visibleFraction)
    const viewportEnd = viewportStart + visibleFraction

    const faceZones: Record<string, [number, number]> = {
      left: [0, 0.35],
      center: [0.3, 0.7],
      spread: [0.2, 0.8],
      right: [0.65, 1.0],
      top: [0.3, 0.7],
      bottom: [0.3, 0.7],
    }
    const [faceStart, faceEnd] = faceZones[facesRegion] ?? [0.3, 0.7]
    const overlap = Math.min(viewportEnd, faceEnd) - Math.max(viewportStart, faceStart)
    const faceSize = faceEnd - faceStart
    return overlap / faceSize >= 0.6
  }

  return true
}

export interface FaceIssue {
  spreadIndex: number
  photoId: string
  slotId: string
  facesRegion: FaceRegion
  severity: number
  photoAspect: number
  slotW: number
  slotH: number
}

/**
 * Find a better template for a spread where face positioning failed.
 * Prioritizes templates whose slots match the face-bearing photos' orientations.
 */
export function findFaceSafeTemplate(
  facePhotos: { photoId: string; score: PhotoScore }[],
  allPhotoIds: string[],
  currentTemplateId: string,
  position: number,
  previousTemplateIds: string[],
  _totalSpreads: number,
): LayoutTemplate | null {
  const photoCount = allPhotoIds.length

  const candidates = LAYOUT_TEMPLATES
    .filter((t) => t.id !== currentTemplateId)
    .filter((t) => t.category !== 'cover' && t.category !== 'closing')
    .filter((t) => photoCount >= t.minPhotos && photoCount <= t.maxPhotos)
    .filter((t) => {
      const realSlots = t.slots.filter((s) => !s.id.endsWith('-mirror'))
      return realSlots.length >= photoCount
    })
    .filter((t) => isTemplateAllowedAtPosition(t.id, position, previousTemplateIds))

  if (candidates.length === 0) return null

  const scored = candidates.map((template) => {
    let faceFitScore = 0
    const slots = [...template.slots]
      .filter((s) => !s.id.endsWith('-mirror'))
      .sort((a, b) => {
        const order = { hero: 0, primary: 1, secondary: 2, accent: 3 }
        return order[a.importance] - order[b.importance]
      })

    for (const fp of facePhotos) {
      let bestSlotScore = 0
      for (const slot of slots) {
        const slotAspect = slot.width / slot.height
        const aspectDiff = Math.abs(slotAspect - fp.score.aspectRatio)
        const severity = computeFaceCropSeverity(
          fp.score.aspectRatio,
          slot.width,
          slot.height,
          fp.score.facesRegion,
        )
        const slotScore = (1 - severity) * 0.7 + (1 / (1 + aspectDiff)) * 0.3
        bestSlotScore = Math.max(bestSlotScore, slotScore)
      }
      faceFitScore += bestSlotScore
    }
    faceFitScore /= Math.max(facePhotos.length, 1)

    return { template, score: faceFitScore }
  })

  scored.sort((a, b) => b.score - a.score)

  if (scored[0] && scored[0].score > 0.5) {
    return scored[0].template
  }

  return null
}

/**
 * Re-place photos in a single spread with a new template.
 * Returns an updated EditorSpread.
 */
export function rebuildSpreadWithTemplate(
  spread: EditorSpread,
  newTemplate: LayoutTemplate,
  scores: Map<string, PhotoScore>,
  photos: Map<string, Photo>,
): EditorSpread {
  const photoUrlMap = new Map<string, string>()
  for (const [id, photo] of photos) {
    photoUrlMap.set(id, photo.fullUrl)
  }

  const existingPhotoIds: string[] = []
  if (spread.design) {
    for (const el of spread.design.elements) {
      if (el.type === 'photo') {
        const pe = el as PhotoElement
        const pid = pe.photoId?.replace('-mirror', '')
        if (pid && !existingPhotoIds.includes(pid)) {
          existingPhotoIds.push(pid)
        }
      }
    }
  }

  if (existingPhotoIds.length === 0) {
    const allSlotPhotos = (spread.slots ?? [])
      .map((s) => s.slotId)
      .filter(Boolean)
    existingPhotoIds.push(...allSlotPhotos)
  }

  const planScores = existingPhotoIds
    .map((id) => scores.get(id))
    .filter(Boolean) as PhotoScore[]

  const assignments = matchPhotosToSlots(newTemplate.slots, planScores, photoUrlMap)
  const slotDataArr = assignments.map(cropToSlotData)

  const leftSlots = newTemplate.slots.filter((s) => s.page === 'left')
  const rightSlots = newTemplate.slots.filter((s) => s.page === 'right')

  const leftPhotos: (string | null)[] = leftSlots.map((s) => {
    const a = assignments.find((a) => a.slotId === s.id)
    return a?.photoUrl ?? null
  })

  const rightPhotos: (string | null)[] = rightSlots.map((s) => {
    const a = assignments.find((a) => a.slotId === s.id)
    return a?.photoUrl ?? null
  })

  return {
    ...spread,
    templateId: newTemplate.id,
    leftPhotos,
    rightPhotos,
    slots: slotDataArr,
    design: undefined,
  }
}
