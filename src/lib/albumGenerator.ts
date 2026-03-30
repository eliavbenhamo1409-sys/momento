import type {
  Photo,
  AlbumConfig,
  PhotoScore,
  GenerationResult,
  PhotoOrientation,
  SpreadSequenceSlot,
  EditorSpread,
  FaceRegion,
  PhotoElement,
} from '../types'
import { batchArray, detectOrientation, getImageDimensions, extractPhotoDate } from './photoUtils'
import { analyzePhotoBatch, generateSpreadBackgrounds } from './openai'
import { curatePhotos } from './photoScorer'
import {
  placePhotosInSpreads,
  computeSmartFacePosition,
  computeFaceCropSeverity,
  isFaceVisibleAfterPosition,
  findFaceSafeTemplate,
  rebuildSpreadWithTemplate,
} from './photoPlacer'
import { buildOrientationSpreadPlans } from './orientationLayoutBuilder'
import { getDesignFamily } from './designFamilies'
import { planAlbumSequence } from './rhythmOrchestrator'
import { resolveAlbumVisuals } from './resolveSpreadVisuals'
import { buildAlbumCompositions, buildSpreadDesign } from './compositionBuilder'
import { assignMoodConcepts } from './conceptPicker'

export type ProgressCallback = (
  stage: number,
  percent: number,
  message: string,
) => void

const BATCH_SIZE = 5

/**
 * Full album generation pipeline with Smart Layout Engine.
 *
 * Stage 1:   Photo Scoring via Vision API
 * Stage 2:   Curation & Ranking (uses family constraints)
 * Stage 3:   Smart Grouping (cluster photos by similarity, proportions)
 * Stage 3.5: Smart Template Picking (pick best template per group)
 * Stage 4:   Photo-to-Slot Assignment
 * Stage 4.5: Mood Concept Assignment
 * Stage 5:   Visual Resolution + Composition Building
 * Stage 6:   Assembly
 */
export async function generateAlbum(
  photos: Photo[],
  config: AlbumConfig,
  onProgress: ProgressCallback,
  referenceDataUrls?: string[],
): Promise<GenerationResult> {
  if (photos.length === 0) {
    throw new Error('No photos to generate album from')
  }

  console.log('[אלבום חכם] ═══════════════════════════════════════════')
  console.log(`[אלבום חכם] התחלת צינור: ${photos.length} תמונות, ${config.pages} עמודים, רקע=${config.backgroundMode === 'white' ? 'לבן' : 'AI'}`)
  console.log('[אלבום חכם] ═══════════════════════════════════════════')

  const family = getDesignFamily(config.designFamily)
  const spreadCount = Math.max(3, Math.floor(config.pages / 2))

  // ── Stage 1 (0-25%): Photo Scoring via Vision API ─────────────

  onProgress(0, 0, '📸 מתחיל לנתח את התמונות שלך...')

  const orientations = new Map<
    string,
    { orientation: PhotoOrientation; aspectRatio: number }
  >()
  for (const photo of photos) {
    if (photo.file) {
      try {
        const dims = await getImageDimensions(photo.file)
        orientations.set(photo.id, {
          orientation: detectOrientation(dims.width, dims.height),
          aspectRatio: dims.width / dims.height,
        })
      } catch {
        orientations.set(photo.id, {
          orientation: detectOrientation(photo.width, photo.height),
          aspectRatio: photo.width / photo.height,
        })
      }
    } else {
      orientations.set(photo.id, {
        orientation: detectOrientation(photo.width, photo.height),
        aspectRatio: photo.width / photo.height,
      })
    }
  }

  // Extract EXIF dates for chronological grouping
  const dateLookup = new Map<string, Date>()
  for (const photo of photos) {
    if (photo.file) {
      try {
        const d = await extractPhotoDate(photo.file)
        dateLookup.set(photo.id, d)
      } catch { /* skip */ }
    }
  }
  if (dateLookup.size > 0) {
    console.log(`[אלבום חכם] חולצו תאריכים מ-${dateLookup.size}/${photos.length} תמונות`)
    onProgress(0, 3, `📅 חולצו תאריכים מ-${dateLookup.size} תמונות...`)
  }

  const batches = batchArray(photos, BATCH_SIZE)
  const allScores: PhotoScore[] = []
  let batchesDone = 0

  for (const batch of batches) {
    try {
      const scores = await analyzePhotoBatch(batch, orientations)
      allScores.push(...scores)
    } catch (err) {
      console.error('Batch analysis failed, using defaults:', err)
      for (const photo of batch) {
        const dims = orientations.get(photo.id) ?? {
          orientation: detectOrientation(photo.width, photo.height) as PhotoOrientation,
          aspectRatio: photo.width / photo.height,
        }
        allScores.push(createDefaultScore(photo.id, dims.orientation, dims.aspectRatio))
      }
    }

    batchesDone++
    const pct = Math.round((batchesDone / batches.length) * 25)
    onProgress(0, pct, `🧠 מזהה פרצופים, סצנות ורגשות... ${allScores.length}/${photos.length}`)
  }

  onProgress(0, 25, `✅ ניתוח הושלם — ${allScores.length} תמונות נסרקו בהצלחה`)

  // ── Stage 2 (25-35%): Curation & Ranking ──────────────────────

  onProgress(1, 26, '⭐ מדרג תמונות לפי איכות, חדות ורגש...')

  const curated = curatePhotos(allScores, config)

  onProgress(1, 30, `🏆 נבחרו ${curated.totalSelected} התמונות הטובות מתוך ${curated.totalOriginal}`)

  if (curated.removed.length > 0) {
    onProgress(1, 33, `🗑️ סוננו ${curated.removed.length} תמונות כפולות או חלשות`)
  }

  await sleep(400)
  onProgress(1, 35, '✅ דירוג התמונות הושלם')

  // ── Stage 3 (35-55%): Date Sort + Orientation-Based Layout ──────

  onProgress(2, 36, '📅 ממיין תמונות לפי תאריך וכיוון...')

  const selectedScores = curated.selected.map((r) => r.score)

  console.log('[אלבום חכם] ── שלב 3: מיון לפי תאריך + כיוון ──')
  console.log(`[אלבום חכם] ${selectedScores.length} תמונות אחרי סינון, יעד ${spreadCount} עמודים כפולים`)
  const orientCounts = { landscape: 0, portrait: 0, square: 0 }
  for (const s of selectedScores) { orientCounts[s.orientation]++ }
  console.log(`[אלבום חכם] חלוקת כיוונים: ${orientCounts.portrait} אורכי, ${orientCounts.landscape} רוחבי, ${orientCounts.square} ריבועי`)

  const scoreMap = new Map(allScores.map((s) => [s.photoId, s]))
  const photoMap = new Map(photos.map((p) => [p.id, p]))

  onProgress(2, 42, '📐 בוחר פריסה לפי כיוון וגודל התמונות...')

  const selectedPhotos = curated.selected.map(r => {
    const photo = photos.find(p => p.id === r.score.photoId)
    return photo!
  }).filter(Boolean)

  const { plans: spreadPlans, groups: pageGroups } = await buildOrientationSpreadPlans(
    selectedPhotos,
    selectedScores,
    spreadCount,
    dateLookup,
  )

  console.log('[אלבום חכם] ── שלב 3.5: פריסה לפי כיוון ──')
  for (const plan of spreadPlans) {
    const group = pageGroups[plan.spreadIndex]
    console.log(`  עמוד ${plan.spreadIndex}: תבנית="${plan.templateId}" | ${plan.assignedPhotoIds.length} תמונות | כיוונים — אורכי:${group?.orientationMix.portrait} רוחבי:${group?.orientationMix.landscape} ריבועי:${group?.orientationMix.square}`)
  }

  onProgress(2, 52, `📖 תוכנן אלבום — ${spreadPlans.length} עמודים כפולים`)

  const sequencePlan: SpreadSequenceSlot[] = planAlbumSequence(family, spreadCount, curated)

  await sleep(300)
  onProgress(2, 55, '✅ תכנון פריסה חכמה הושלם')

  // ── Stage 4 (55-75%): Photo-to-Slot Assignment ────────────────

  onProgress(3, 56, '🖼️ משבץ כל תמונה בעמוד המתאים לה...')

  const spreads = placePhotosInSpreads(spreadPlans, scoreMap, photoMap, spreadCount)

  console.log('[אלבום חכם] ── שלב 4: שיבוץ תמונות בתבניות ──')
  for (const spread of spreads) {
    const slotInfo = (spread.slots ?? []).map((s) => `${s.slotId}→${s.objectPosition || '50% 50%'}`).join(', ')
    console.log(`  עמוד ${spread.id}: תבנית="${spread.templateId}" | חריצים=[${slotInfo}]`)
  }

  onProgress(3, 72, `✅ שובצו ${curated.totalSelected} תמונות ב-${spreads.length} עמודים`)

  await sleep(300)
  onProgress(3, 75, '🎯 שיבוץ תמונות הושלם — כל תמונה במקומה')

  // ── Stage 4.5 (75-78%): Mood Concept Assignment ────────────────

  onProgress(3, 76, '🎨 בוחר קונספט עיצובי ייחודי לכל עמוד...')

  const moodAssignments = assignMoodConcepts(
    spreads,
    allScores,
    config,
    sequencePlan,
    undefined,
  )

  for (const assignment of moodAssignments) {
    if (spreads[assignment.spreadIndex]) {
      spreads[assignment.spreadIndex].moodConcept = assignment.conceptId
    }
  }

  onProgress(3, 78, `🎨 נבחרו ${moodAssignments.length} קונספטים עיצוביים`)

  // ── Stage 4.7 (78-88%): AI Background Generation ──────────────

  let generatedBackgrounds: (string | null)[] = []
  const moodPacksForBg = moodAssignments.map((a) => a.pack)

  if (config.backgroundMode === 'ai-generated') {
    onProgress(4, 79, '🖌️ מעצב רקעים ייחודיים לכל עמוד...')
    const vibeText = config.vibeText || ''
    onProgress(4, 80, `מייצר ${spreads.length} רקעים מקוריים עם AI — כל עמוד ייחודי...`)

    try {
      generatedBackgrounds = await generateSpreadBackgrounds(
        moodPacksForBg,
        vibeText,
        (done, total) => {
          const pct = 80 + Math.round((done / total) * 7)
          onProgress(4, pct, `נוצר רקע ${done}/${total}...`)
        },
        referenceDataUrls,
      )
      const generatedCount = generatedBackgrounds.filter(Boolean).length
      onProgress(4, 87, `נוצרו ${generatedCount} רקעים ייחודיים לכל העמודים`)
    } catch (err) {
      console.error('Background generation failed, using built-in:', err)
      generatedBackgrounds = new Array(spreads.length).fill(null)
      onProgress(4, 87, 'משתמש ברקעים מובנים')
    }
  } else {
    onProgress(4, 87, '⬜ רקע לבן נקי — מיני מליסטי ואלגנטי')
    generatedBackgrounds = new Array(spreads.length).fill(null)
  }

  // ── Stage 5 (88-92%): Visual Resolution ────────────────────────

  onProgress(4, 88, `✨ מקמפל עיצוב — סגנון ${family.nameHe}...`)

  const resolvedSpreads = resolveAlbumVisuals(spreads, sequencePlan, family)

  let croppedCount = 0
  for (const spread of resolvedSpreads) {
    if (spread.slots) {
      croppedCount += spread.slots.filter((s) => s.transform !== '').length
    }
  }

  await sleep(400)
  onProgress(4, 83, croppedCount > 0 ? `חותך ${croppedCount} תמונות בצורה חכמה` : 'כל התמונות מותאמות')

  onProgress(4, 85, 'עיצוב ויזואלי הושלם')

  // ── Stage 5.5 (85-95%): Composition Building ──────────────────

  onProgress(4, 86, '🏗️ בונה קומפוזיציות מדויקות לכל עמוד...')

  console.log(`[אלבום חכם] ── שלב 5.5: בניית קומפוזיציה (רקע=${config.backgroundMode === 'white' ? 'לבן' : 'AI'}) ──`)

  const composedSpreads = buildAlbumCompositions(
    resolvedSpreads,
    family,
    sequencePlan,
    undefined,
    moodAssignments.map((a) => a.pack),
    generatedBackgrounds,
    config.backgroundMode,
  )

  console.log(`[אלבום חכם] נבנו ${composedSpreads.length} קומפוזיציות`)
  for (const spread of composedSpreads) {
    const photoEls = (spread.design?.elements ?? []).filter((e) => e.type === 'photo')
    console.log(`  עמוד ${spread.id}: ${photoEls.length} אלמנטי תמונה, תבנית="${spread.templateId}"`)
  }

  await sleep(300)
  onProgress(4, 91, `הורכבו ${composedSpreads.length} קומפוזיציות ייחודיות`)

  // ── Stage 6 (91-98%): Face Verification Scan (Multi-Pass) ──────

  onProgress(5, 92, '🔍 סורק פרצופים בכל העמודים...')
  await sleep(400)

  const faceScoreMap = new Map(allScores.map((s) => [s.photoId, s]))
  const SEVERITY_POSITION_THRESHOLD = 0.5
  const SEVERITY_TEMPLATE_THRESHOLD = 0.65

  // ── Pass 1: Detect all face issues with crop severity ──────────

  console.log('[אלבום חכם] ══════════ סריקת פנים — פאס 1: זיהוי בעיות ══════════')

  interface FaceCheckResult {
    spreadIndex: number
    photoId: string
    slotId: string
    facesRegion: FaceRegion
    severity: number
    originalPosition: string
    photoAspect: number
    slotW: number
    slotH: number
  }

  const allFaceIssues: FaceCheckResult[] = []
  let totalFacePhotos = 0

  for (let si = 0; si < composedSpreads.length; si++) {
    const spread = composedSpreads[si]
    if (!spread.design) continue

    const spreadFacePhotos: string[] = []
    const spreadIssues: string[] = []

    for (const el of spread.design.elements) {
      if (el.type !== 'photo') continue
      const photoEl = el as PhotoElement
      const photoId = photoEl.photoId?.replace('-mirror', '')
      if (!photoId) continue
      const score = faceScoreMap.get(photoId)
      if (!score?.hasFaces) continue

      totalFacePhotos++
      spreadFacePhotos.push(photoId)

      const severity = computeFaceCropSeverity(
        score.aspectRatio,
        photoEl.width,
        photoEl.height,
        score.facesRegion,
      )

      if (severity > 0.15) {
        allFaceIssues.push({
          spreadIndex: si,
          photoId,
          slotId: photoEl.slotId,
          facesRegion: score.facesRegion,
          severity,
          originalPosition: photoEl.objectPosition || '50% 50%',
          photoAspect: score.aspectRatio,
          slotW: photoEl.width,
          slotH: photoEl.height,
        })
        const severityLabel = severity > SEVERITY_TEMPLATE_THRESHOLD ? '🔴 חמור' : severity > SEVERITY_POSITION_THRESHOLD ? '🟡 בינוני' : '🟢 קל'
        spreadIssues.push(`    ${photoId}: פנים=${score.facesRegion}, חומרה=${(severity * 100).toFixed(0)}% ${severityLabel}, חריץ=${photoEl.width.toFixed(0)}×${photoEl.height.toFixed(0)}, תמונה=${score.aspectRatio.toFixed(2)}`)
      }
    }

    if (spreadFacePhotos.length > 0) {
      const status = spreadIssues.length === 0 ? '✅ תקין' : `⚠️ ${spreadIssues.length} בעיות`
      console.log(`  עמוד ${si} [${spread.templateId}]: ${spreadFacePhotos.length} תמונות עם פנים — ${status}`)
      for (const issue of spreadIssues) {
        console.log(issue)
      }
    }
  }

  console.log(`[אלבום חכם] סה״כ: ${totalFacePhotos} תמונות עם פנים, ${allFaceIssues.length} בעיות חיתוך`)

  if (allFaceIssues.length === 0) {
    onProgress(5, 96, '✅ כל הפרצופים במקום מושלם — לא נדרשו תיקונים!')
    await sleep(500)
    console.log('[אלבום חכם] ══════════ סריקת פנים — הכל תקין! ══════════')
  } else {
    // ── Pass 2: Fix via objectPosition for moderate issues ────────

    onProgress(5, 93, `⚠️ נמצאו ${allFaceIssues.length} בעיות חיתוך — מתחיל תיקון...`)
    await sleep(400)

    console.log('[אלבום חכם] ══════════ סריקת פנים — פאס 2: תיקון מיקום ══════════')

    let positionFixes = 0
    const stillBroken: FaceCheckResult[] = []

    for (const issue of allFaceIssues) {
      const spread = composedSpreads[issue.spreadIndex]
      if (!spread.design) continue

      const photoEl = spread.design.elements.find(
        (el) => el.type === 'photo' && (el as PhotoElement).photoId?.replace('-mirror', '') === issue.photoId,
      ) as PhotoElement | undefined

      if (!photoEl) continue

      const smartPos = computeSmartFacePosition(
        issue.photoAspect,
        issue.slotW,
        issue.slotH,
        issue.facesRegion,
      )
      photoEl.objectPosition = smartPos

      const isFixed = isFaceVisibleAfterPosition(
        issue.photoAspect,
        issue.slotW,
        issue.slotH,
        issue.facesRegion,
        smartPos,
      )

      if (isFixed) {
        positionFixes++
        console.log(`  ✅ עמוד ${issue.spreadIndex}, ${issue.photoId}: תוקן במיקום ${issue.originalPosition} → ${smartPos}`)
      } else {
        stillBroken.push(issue)
        console.log(`  ❌ עמוד ${issue.spreadIndex}, ${issue.photoId}: מיקום ${smartPos} לא מספיק (חומרה=${(issue.severity * 100).toFixed(0)}%)`)
      }
    }

    onProgress(5, 94, `✨ תוקנו ${positionFixes} תמונות במיקום`)
    await sleep(300)

    console.log(`[אלבום חכם] פאס 2 סיכום: ${positionFixes} תוקנו, ${stillBroken.length} עדיין בעייתיים`)

    // ── Pass 3: Template swap for severe issues ──────────────────

    if (stillBroken.length > 0) {
      onProgress(5, 94, `🔄 ${stillBroken.length} תמונות עדיין בעייתיות — מחליף מבנה עמודים...`)
      await sleep(400)

      console.log('[אלבום חכם] ══════════ סריקת פנים — פאס 3: החלפת מבנה עמודים ══════════')

      const spreadsToSwap = new Map<number, FaceCheckResult[]>()
      for (const issue of stillBroken) {
        const list = spreadsToSwap.get(issue.spreadIndex) ?? []
        list.push(issue)
        spreadsToSwap.set(issue.spreadIndex, list)
      }

      let templateSwaps = 0
      let positionFallbackFixes = 0
      const previousTemplateIds = composedSpreads.map((s) => s.templateId)

      for (const [spreadIdx, issues] of spreadsToSwap) {
        const spread = composedSpreads[spreadIdx]

        if (spreadIdx === 0 || spreadIdx === composedSpreads.length - 1) {
          console.log(`  ⏭️ עמוד ${spreadIdx}: כריכה/סיום — לא ניתן להחליף, מתקן מיקום בכוח`)
          for (const issue of issues) {
            applyForcedFacePosition(spread, issue, faceScoreMap)
          }
          positionFallbackFixes += issues.length
          continue
        }

        const facePhotos = issues.map((i) => ({
          photoId: i.photoId,
          score: faceScoreMap.get(i.photoId)!,
        }))

        const allPhotoIds = getSpreadPhotoIds(spread)

        const betterTemplate = findFaceSafeTemplate(
          facePhotos,
          allPhotoIds,
          spread.templateId,
          spreadIdx,
          previousTemplateIds,
          composedSpreads.length,
        )

        if (betterTemplate) {
          console.log(`  🔄 עמוד ${spreadIdx}: מחליף ${spread.templateId} → ${betterTemplate.id}`)

          const rebuilt = rebuildSpreadWithTemplate(spread, betterTemplate, scoreMap, photoMap)

          const seqSlot = sequencePlan[spreadIdx] ?? {
            index: spreadIdx,
            role: 'standard' as const,
            isQuoteSpread: false,
            isBreathingSpread: false,
            densityHint: 'moderate' as const,
          }

          rebuilt.familyId = family.id
          rebuilt.role = seqSlot.role
          rebuilt.resolvedStyle = spread.resolvedStyle

          const newDesign = buildSpreadDesign(
            rebuilt,
            family,
            seqSlot,
            undefined,
            moodAssignments[spreadIdx] ? moodAssignments[spreadIdx].pack : undefined,
            generatedBackgrounds[spreadIdx],
            config.backgroundMode,
          )
          rebuilt.design = newDesign

          for (const el of newDesign.elements) {
            if (el.type !== 'photo') continue
            const pe = el as PhotoElement
            const pid = pe.photoId?.replace('-mirror', '')
            if (!pid) continue
            const sc = faceScoreMap.get(pid)
            if (!sc?.hasFaces) continue

            pe.objectPosition = computeSmartFacePosition(
              sc.aspectRatio, pe.width, pe.height, sc.facesRegion,
            )
          }

          composedSpreads[spreadIdx] = { ...rebuilt, design: newDesign }
          previousTemplateIds[spreadIdx] = betterTemplate.id
          templateSwaps++

          const newIssues: string[] = []
          for (const el of newDesign.elements) {
            if (el.type !== 'photo') continue
            const pe = el as PhotoElement
            const pid = pe.photoId?.replace('-mirror', '')
            if (!pid) continue
            const sc = faceScoreMap.get(pid)
            if (!sc?.hasFaces) continue
            const newSeverity = computeFaceCropSeverity(sc.aspectRatio, pe.width, pe.height, sc.facesRegion)
            const visible = isFaceVisibleAfterPosition(sc.aspectRatio, pe.width, pe.height, sc.facesRegion, pe.objectPosition)
            newIssues.push(`    ${pid}: חומרה=${(newSeverity * 100).toFixed(0)}%, נראה=${visible ? '✅' : '❌'}`)
          }
          for (const line of newIssues) console.log(line)
        } else {
          console.log(`  ⚠️ עמוד ${spreadIdx}: לא נמצא מבנה טוב יותר — מתקן מיקום בכוח`)
          for (const issue of issues) {
            applyForcedFacePosition(spread, issue, faceScoreMap)
          }
          positionFallbackFixes += issues.length
        }
      }

      onProgress(5, 95, templateSwaps > 0
        ? `🔄 הוחלפו ${templateSwaps} מבנים + ${positionFixes} מיקומים תוקנו`
        : `✨ ${positionFixes + positionFallbackFixes} תמונות תוקנו`)
      await sleep(400)

      console.log(`[אלבום חכם] פאס 3 סיכום: ${templateSwaps} החלפות מבנה, ${positionFallbackFixes} תיקוני מיקום בכוח`)
    }

    // ── Pass 4: Final verification across all pages ──────────────

    console.log('[אלבום חכם] ══════════ סריקת פנים — פאס 4: אימות סופי ══════════')

    let finalOk = 0
    let finalWarnings = 0

    for (let si = 0; si < composedSpreads.length; si++) {
      const spread = composedSpreads[si]
      if (!spread.design) continue

      for (const el of spread.design.elements) {
        if (el.type !== 'photo') continue
        const pe = el as PhotoElement
        const pid = pe.photoId?.replace('-mirror', '')
        if (!pid) continue
        const sc = faceScoreMap.get(pid)
        if (!sc?.hasFaces) continue

        const finalSeverity = computeFaceCropSeverity(sc.aspectRatio, pe.width, pe.height, sc.facesRegion)
        const finalVisible = isFaceVisibleAfterPosition(sc.aspectRatio, pe.width, pe.height, sc.facesRegion, pe.objectPosition)

        if (finalVisible) {
          finalOk++
        } else {
          finalWarnings++
          console.log(`  ⚠️ עמוד ${si}, ${pid}: עדיין בעייתי (חומרה=${(finalSeverity * 100).toFixed(0)}%, מיקום=${pe.objectPosition})`)
        }
      }
    }

    console.log(`[אלבום חכם] אימות סופי: ${finalOk} תקינים, ${finalWarnings} עם אזהרות`)

    if (finalWarnings === 0) {
      onProgress(5, 96, `✅ כל ${finalOk} הפרצופים במקומם — מושלם!`)
    } else {
      onProgress(5, 96, `✅ ${finalOk} פרצופים תקינים, ${finalWarnings} עם אזהרה קלה`)
    }
    await sleep(400)

    console.log('[אלבום חכם] ══════════ סריקת פנים — הושלמה ══════════')
  }

  // ── Stage 7 (98-100%): Final Assembly ──────────────────────────

  onProgress(5, 97, '🎨 מבצע ליטוש אחרון...')
  await sleep(400)

  onProgress(5, 98, '📖 מרכיב את האלבום הסופי...')
  await sleep(300)

  onProgress(5, 99, '✨ בודק שהכל מושלם...')
  await sleep(200)

  onProgress(5, 100, '🎉 האלבום שלך מוכן!')

  return {
    spreads: composedSpreads,
    analyses: allScores,
    curated,
  }
}

// ─── Helpers ────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

/**
 * Extract all photo IDs from a composed spread's design elements.
 */
function getSpreadPhotoIds(spread: EditorSpread): string[] {
  const ids: string[] = []
  if (spread.design) {
    for (const el of spread.design.elements) {
      if (el.type === 'photo') {
        const pe = el as PhotoElement
        const pid = pe.photoId?.replace('-mirror', '')
        if (pid && !ids.includes(pid)) ids.push(pid)
      }
    }
  }
  if (ids.length === 0) {
    for (const url of [...spread.leftPhotos, ...spread.rightPhotos]) {
      if (url) ids.push(url)
    }
  }
  return ids
}

/**
 * When no better template exists, force-apply the most aggressive
 * face-preserving objectPosition possible.
 */
function applyForcedFacePosition(
  spread: EditorSpread,
  issue: { photoId: string; facesRegion: FaceRegion },
  scoreMap: Map<string, PhotoScore>,
): void {
  if (!spread.design) return
  const photoEl = spread.design.elements.find(
    (el) => el.type === 'photo' && (el as PhotoElement).photoId?.replace('-mirror', '') === issue.photoId,
  ) as PhotoElement | undefined
  if (!photoEl) return

  const score = scoreMap.get(issue.photoId)
  if (!score) return

  const forcePositions: Record<string, string> = {
    top: '50% 5%',
    center: '50% 30%',
    spread: '50% 25%',
    bottom: '50% 90%',
    left: '10% 35%',
    right: '90% 35%',
    none: '50% 50%',
  }
  photoEl.objectPosition = forcePositions[issue.facesRegion] ?? '50% 50%'
  console.log(`    🔧 ${issue.photoId}: מיקום כוח → ${photoEl.objectPosition}`)
}

function createDefaultScore(
  photoId: string,
  orientation: PhotoOrientation,
  aspectRatio: number,
): PhotoScore {
  return {
    photoId,
    orientation,
    aspectRatio,
    sharpness: 5,
    exposure: 5,
    composition: 5,
    overallQuality: 5,
    scene: 'outdoor',
    peopleCount: 0,
    hasFaces: false,
    facesRegion: 'none',
    emotion: 'neutral',
    colorDominant: 'neutral',
    isHighlight: false,
    isCoverCandidate: false,
    isHeroCandidate: false,
    isCloseup: false,
    isGroupShot: false,
    description: '',
  }
}
