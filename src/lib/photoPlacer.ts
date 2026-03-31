import type {
  SpreadPlan,
  PhotoScore,
  Photo,
  SlotAssignment,
  CropSuggestion,
  FinalSlotData,
  SlotDefinition,
  EditorSpread,
  EmptyPageFill,
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
import { getSceneBackground, generateContextualQuote } from './conceptPicker'

// ─── Orientation matching score ─────────────────────────────────────

function orientationMatchScore(
  slotAccepts: SlotDefinition['accepts'],
  photoOrientation: PhotoScore['orientation'],
  slot?: SlotDefinition,
  recommendedDisplay?: PhotoOrientation,
): number {
  if (slotAccepts.includes('any')) return 0.8
  if (slotAccepts.includes(photoOrientation)) return 1.0
  const display = recommendedDisplay ?? photoOrientation
  if (slot) {
    const pref = slot.width / slot.height > 1.3 ? 'landscape' : slot.width / slot.height < 0.77 ? 'portrait' : 'square'
    if (pref === display) return 0.9
  }
  return 0.3
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

/**
 * Compute smart default vertical position when cropping.
 * When a photo is taller than the slot (vertical crop), we bias toward
 * the upper portion because faces/heads are almost always at the top.
 * This prevents the common "head cut off" problem.
 */
function computeSmartDefaultY(photoAspect: number, slotW: number, slotH: number): number {
  const slotAspect = slotW / slotH
  if (photoAspect >= slotAspect) return 0.5

  const visibleFraction = photoAspect / slotAspect
  if (visibleFraction >= 0.85) return 0.45
  if (visibleFraction >= 0.65) return 0.35
  return 0.25
}

function computeCrop(
  photo: PhotoScore,
  slot: SlotDefinition,
): CropSuggestion | null {
  const slotAspect = slot.width / slot.height
  const photoAspect = photo.aspectRatio
  const isVerticalCrop = photoAspect < slotAspect
  const hasPeople = photo.hasFaces || photo.peopleCount > 0

  let focusX = 0.5
  let focusY = computeSmartDefaultY(photoAspect, slot.width, slot.height)

  if (photo.hasFaces) {
    switch (photo.facesRegion) {
      case 'left': focusX = 0.30; break
      case 'right': focusX = 0.70; break
      case 'top': focusY = 0.10; break
      case 'bottom': focusY = 0.75; break
      case 'center': focusY = isVerticalCrop ? 0.15 : 0.35; break
      case 'spread': focusY = isVerticalCrop ? 0.20 : 0.35; break
    }
    return { focusX, focusY, scale: 1.0, reason: 'מיקוד על פנים' }
  }

  if (hasPeople) {
    if (isVerticalCrop) {
      focusY = Math.min(focusY, 0.25)
    } else {
      focusY = Math.min(focusY, 0.35)
    }
    return { focusX, focusY, scale: 1.0, reason: 'הטיה לראש — אנשים בתמונה' }
  }

  if (Math.abs(slotAspect - photoAspect) < 0.1) {
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

  for (const slot of heroSlots) {
    let bestPhoto: PhotoScore | null = null
    let bestScore = -Infinity

    for (const photo of heroPhotos) {
      if (usedPhotos.has(photo.photoId) || globalUsed?.has(photo.photoId)) continue

      const displayOrientation = photo.recommendedDisplay ?? photo.orientation
      const oScore = orientationMatchScore(slot.accepts, displayOrientation, slot, photo.recommendedDisplay)
      if (oScore < 0) continue
      const hasPeople = photo.hasFaces || photo.peopleCount > 0
      const faceRegion = photo.hasFaces ? photo.facesRegion : (photo.peopleCount > 0 ? 'center' as const : 'none' as const)
      const severity = hasPeople
        ? computeFaceCropSeverity(photo.aspectRatio, slot.width, slot.height, faceRegion)
        : 0
      if (severity > 0.4) continue

      const totalScore = oScore * 0.3 + (photo.overallQuality / 10) * 0.7 - severity * 0.5
      if (totalScore > bestScore) {
        bestScore = totalScore
        bestPhoto = photo
      }
    }

    if (!bestPhoto) continue
    usedPhotos.add(bestPhoto.photoId)
    globalUsed?.add(bestPhoto.photoId)
    const crop = computeCrop(bestPhoto, slot)
    assignments.push({
      spreadIndex: 0,
      slotId: slot.id,
      photoId: bestPhoto.photoId,
      photoUrl: photoUrlMap.get(bestPhoto.photoId) ?? '',
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

      const hasPeople = photo.hasFaces || photo.peopleCount > 0
      const faceRegion = photo.hasFaces ? photo.facesRegion : (photo.peopleCount > 0 ? 'center' as const : 'none' as const)
      const severity = hasPeople
        ? computeFaceCropSeverity(photo.aspectRatio, slot.width, slot.height, faceRegion)
        : 0
      if (severity > 0.4) continue

      const oScore = orientationMatchScore(slot.accepts, photo.recommendedDisplay ?? photo.orientation, slot, photo.recommendedDisplay)
      if (oScore < 0) continue
      const iScore = importanceMatchScore(slot.importance, photo.overallQuality)
      const fSafe = isFaceSafe(photo.facesRegion, slot.safeZone)
      const fPenalty = fSafe ? 0 : -0.3

      const totalScore = oScore * 0.4 + iScore * 0.4 + (photo.overallQuality / 10) * 0.2 + fPenalty - severity * 0.3
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

  // Relaxed sweep: fill any remaining empty slots ignoring severity/orientation vetos
  const finalAssignedSlots = new Set(assignments.map((a) => a.slotId))
  const unfilledSlots = sortedSlots.filter((s) => !finalAssignedSlots.has(s.id))
  const unusedPhotos = sortedPhotos.filter(
    (p) => !usedPhotos.has(p.photoId) && !globalUsed?.has(p.photoId),
  )

  for (const slot of unfilledSlots) {
    if (unusedPhotos.length === 0) break
    const photo = unusedPhotos.shift()!
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
      : '50% 35%',
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

    const leftPhotos: (string | null)[] = leftSlots
      .map((s) => {
        const a = assignments.find((a) => a.slotId === s.id)
        return a?.photoUrl ?? null
      })

    const rightPhotos: (string | null)[] = rightSlots
      .map((s) => {
        const a = assignments.find((a) => a.slotId === s.id)
        return a?.photoUrl ?? null
      })

    const hasLeft = leftPhotos.some(p => p !== null)
    const hasRight = rightPhotos.some(p => p !== null)

    if ((!hasLeft || !hasRight) && !template.spanning) {
      // 1-photo spread: duplicate onto both pages as a cinematic duo
      if (planScores.length === 1) {
        const singleUrl = photoUrlMap.get(planScores[0].photoId) ?? ''
        const crop = computeCrop(planScores[0], { id: 'forced', page: 'left', x: 0, y: 0, width: 100, height: 100, importance: 'hero', minQuality: 1, accepts: ['any'], safeZone: { top: 0, bottom: 0, left: 0, right: 0 } })
        const pos = crop ? `${Math.round(crop.focusX * 100)}% ${Math.round(crop.focusY * 100)}%` : '50% 35%'
        return {
          id: `spread-${idx}-${Date.now().toString(36)}`,
          templateId: 'editorial-cinematic',
          leftPhotos: [singleUrl],
          rightPhotos: [singleUrl],
          quote: plan.quote,
          slots: [
            { slotId: 'l-main', photoUrl: singleUrl, objectFit: 'cover', objectPosition: pos, transform: '' },
            { slotId: 'r-main', photoUrl: singleUrl, objectFit: 'cover', objectPosition: pos, transform: '' },
          ],
          theme: plan.theme,
        }
      }

      const fallback = getFallbackTemplate(idx, totalSpreads)
      if (fallback.id !== template.id) {
        const fbAssignments = matchPhotosToSlots(fallback.slots, planScores, photoUrlMap)
        const fbSlotData = fbAssignments.map(cropToSlotData)
        const fbLeft = fallback.slots.filter(s => s.page === 'left').map(s => {
          const a = fbAssignments.find(a => a.slotId === s.id)
          return a?.photoUrl ?? null
        })
        const fbRight = fallback.slots.filter(s => s.page === 'right').map(s => {
          const a = fbAssignments.find(a => a.slotId === s.id)
          return a?.photoUrl ?? null
        })
        if (fbLeft.some(p => p !== null) && fbRight.some(p => p !== null)) {
          return {
            id: `spread-${idx}-${Date.now().toString(36)}`,
            templateId: fallback.id,
            leftPhotos: fbLeft,
            rightPhotos: fbRight,
            quote: plan.quote,
            slots: fbSlotData,
            theme: plan.theme,
          }
        }
      }
    }

    // Last resort: if one page is still empty, force a simple 50/50 split
    const finalHasLeft = leftPhotos.some(p => p !== null)
    const finalHasRight = rightPhotos.some(p => p !== null)

    if ((!finalHasLeft || !finalHasRight) && !template.spanning && planScores.length >= 2) {
      const allUrls = planScores.map(s => photoUrlMap.get(s.photoId)).filter(Boolean) as string[]
      const mid = Math.ceil(allUrls.length / 2)
      const forcedLeft = allUrls.slice(0, mid)
      const forcedRight = allUrls.slice(mid)
      if (forcedLeft.length > 0 && forcedRight.length > 0) {
        return {
          id: `spread-${idx}-${Date.now().toString(36)}`,
          templateId: 'editorial-cinematic',
          leftPhotos: forcedLeft,
          rightPhotos: forcedRight,
          quote: plan.quote,
          slots: slotDataArr,
          theme: plan.theme,
        }
      }
    }

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

// ─── Empty / Sparse Page Validation ─────────────────────────────────

const SPARSE_COVERAGE_THRESHOLD = 30

function computePageCoverage(
  template: LayoutTemplate | undefined,
  side: 'left' | 'right',
  filledSlotIds: Set<string>,
): number {
  if (!template) return 100
  const pageSlots = template.slots.filter(s => s.page === side)
  if (pageSlots.length === 0) return 0
  const filledArea = pageSlots
    .filter(s => filledSlotIds.has(s.id))
    .reduce((sum, s) => sum + (s.width / 100) * (s.height / 100) * 100, 0)
  return filledArea
}

function getSpreadSceneInfo(
  spread: EditorSpread,
  allScores: Map<string, PhotoScore>,
  urlToIdMap?: Map<string, string>,
): { scene?: string; setting?: string } {
  const allUrls = [
    ...spread.leftPhotos.filter(Boolean),
    ...spread.rightPhotos.filter(Boolean),
  ] as string[]

  const spreadScores: PhotoScore[] = []
  for (const url of allUrls) {
    const photoId = urlToIdMap?.get(url)
    if (photoId) {
      const score = allScores.get(photoId)
      if (score) { spreadScores.push(score); continue }
    }
    for (const [id, score] of allScores) {
      if (url.includes(id) || id === url) { spreadScores.push(score); break }
    }
  }

  if (spreadScores.length === 0) return { setting: spread.theme }

  const sceneCounts: Record<string, number> = {}
  for (const s of spreadScores) sceneCounts[s.scene] = (sceneCounts[s.scene] || 0) + 1
  const scene = Object.entries(sceneCounts).sort(([, a], [, b]) => b - a)[0]?.[0]
  return { scene, setting: spread.theme }
}

function buildFillForSide(
  side: 'left' | 'right',
  scene?: string,
  setting?: string,
): EmptyPageFill {
  const quote = generateContextualQuote(scene, setting)
  const sceneBg = getSceneBackground(scene, setting)
  if (sceneBg) {
    return {
      type: 'ai-background',
      side,
      prompt: sceneBg.prompt,
      gradient: sceneBg.gradient,
      text: quote.text,
    }
  }
  return {
    type: 'quote',
    side,
    text: quote.text,
    gradient: 'linear-gradient(180deg, #FAF8F5 0%, #F0EDE8 100%)',
  }
}

/**
 * Post-placement pass: detect spreads with empty OR sparse sides
 * and tag them with a fill strategy (AI background, quote, or gradient).
 * "Sparse" = filled photo slots cover less than 30% of the page area.
 */
export function validateAndFillEmptyPages(
  spreads: EditorSpread[],
  allScores: Map<string, PhotoScore>,
  urlToIdMap?: Map<string, string>,
): void {
  for (const spread of spreads) {
    const template = getTemplate(spread.templateId)
    if (template?.spanning) continue

    const filledSlotIds = new Set(
      (spread.slots ?? [])
        .filter(s => s.photoUrl)
        .map(s => s.slotId),
    )

    const leftCoverage = computePageCoverage(template, 'left', filledSlotIds)
    const rightCoverage = computePageCoverage(template, 'right', filledSlotIds)

    const leftSparse = leftCoverage < SPARSE_COVERAGE_THRESHOLD
    const rightSparse = rightCoverage < SPARSE_COVERAGE_THRESHOLD

    if (!leftSparse && !rightSparse) continue
    if (leftSparse && rightSparse) continue

    const sparseSide: 'left' | 'right' = leftSparse ? 'left' : 'right'
    const { scene, setting } = getSpreadSceneInfo(spread, allScores, urlToIdMap)
    spread.emptyPageFill = buildFillForSide(sparseSide, scene, setting)
  }
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
      recommendedDisplay: 'square',
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
    const visibleFraction = photoAspect / slotAspect
    const croppedFraction = 1 - visibleFraction
    const severe = croppedFraction > 0.3

    switch (facesRegion) {
      case 'top': yPct = severe ? 5 : 10; break
      case 'center': yPct = severe ? 10 : 20; break
      case 'spread': yPct = severe ? 15 : 25; break
      case 'bottom': yPct = severe ? 85 : 75; break
      case 'left': xPct = 35; yPct = severe ? 15 : 25; break
      case 'right': xPct = 65; yPct = severe ? 15 : 25; break
      default: yPct = severe ? 25 : 35; break
    }
  } else if (isHorizontalCrop) {
    switch (facesRegion) {
      case 'left': xPct = 20; break
      case 'right': xPct = 80; break
      case 'top': yPct = 15; break
      case 'center': yPct = 30; break
      case 'spread': yPct = 35; break
      case 'bottom': yPct = 75; break
      default: break
    }
  } else {
    switch (facesRegion) {
      case 'top': yPct = 25; break
      case 'center': yPct = 35; break
      case 'left': xPct = 30; break
      case 'right': xPct = 70; break
      case 'bottom': yPct = 65; break
      default: break
    }
  }

  return `${Math.round(xPct)}% ${Math.round(yPct)}%`
}

function slotAcceptsOrientation(
  accepts: ('portrait' | 'landscape' | 'any')[],
  orientation: PhotoOrientation,
  slotW?: number,
  slotH?: number,
  recommendedDisplay?: PhotoOrientation,
): number {
  if (accepts.includes('any')) return 0.8
  if (accepts.includes(orientation as 'portrait' | 'landscape')) return 1.0
  const display = recommendedDisplay ?? orientation
  if (slotW && slotH) {
    const pref = slotW / slotH > 1.3 ? 'landscape' : slotW / slotH < 0.77 ? 'portrait' : 'square'
    if (pref === display) return 0.9
  }
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

        const hasPeople = photo.hasFaces || photo.peopleCount > 0
        const faceRegion = photo.hasFaces ? photo.facesRegion : (photo.peopleCount > 0 ? 'center' as const : 'none' as const)
        const severity = hasPeople
          ? computeFaceCropSeverity(photo.aspectRatio, slot.width, slot.height, faceRegion)
          : 0
        if (severity > 0.4) continue

        const oScore = slotAcceptsOrientation(slotAccepts, photo.recommendedDisplay ?? photo.orientation, slot.width, slot.height, photo.recommendedDisplay)
        if (oScore < 0) continue
        const thresholds = { hero: 7, primary: 5, secondary: 3, accent: 1 }
        const threshold = thresholds[slot.importance] ?? 3
        const iScore = photo.overallQuality >= threshold ? 1.0 : photo.overallQuality >= threshold - 2 ? 0.6 : 0.3
        const totalScore = oScore * 0.4 + iScore * 0.4 + (photo.overallQuality / 10) * 0.2 - severity * 0.3

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
        if (photo) {
          if (photo.hasFaces && photo.facesRegion !== 'none') {
            slot.objectPosition = computeSmartFacePosition(
              photo.aspectRatio,
              slot.width,
              slot.height,
              photo.facesRegion,
            )
          } else if (photo.peopleCount > 0) {
            const smartY = computeSmartDefaultY(photo.aspectRatio, slot.width, slot.height)
            slot.objectPosition = `50% ${Math.round(Math.min(smartY, 0.30) * 100)}%`
          } else {
            const smartY = computeSmartDefaultY(photo.aspectRatio, slot.width, slot.height)
            if (smartY < 0.48) {
              slot.objectPosition = `50% ${Math.round(smartY * 100)}%`
            } else {
              slot.objectPosition = '50% 35%'
            }
          }
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

    let squareSlotBonus = 0
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
        if (slotAspect >= 0.7 && slotAspect <= 1.4) squareSlotBonus += 0.05
      }
      faceFitScore += bestSlotScore
    }
    faceFitScore /= Math.max(facePhotos.length, 1)
    faceFitScore += Math.min(squareSlotBonus, 0.2)

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
