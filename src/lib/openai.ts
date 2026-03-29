import OpenAI from 'openai'
import type { Photo, PhotoScore, SpreadPlan, SpreadPlanDesign, AlbumConfig, PhotoOrientation, DesignFamily, SpreadSequenceSlot, MoodConceptId } from '../types'
import { preparePhotoForVision, detectOrientation } from './photoUtils'
import { getTemplatesForFamily } from './layoutGrammar'
import { describeSequence } from './rhythmOrchestrator'
import { getDesignFamily } from './designFamilies'
import { ALL_MOOD_IDS } from './moodPacks'

// ─── Client ─────────────────────────────────────────────────────────

let _client: OpenAI | null = null

function getClient(): OpenAI {
  if (!_client) {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined
    if (!apiKey) throw new Error('VITE_OPENAI_API_KEY is not set')
    _client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })
  }
  return _client
}

// ─── Layer 1: Photo Scoring (Vision API) ────────────────────────────

const SCORING_SYSTEM_PROMPT = `You are a professional photo editor scoring images for a premium printed photo album.
For EACH image (numbered starting from 1), return a JSON object with these EXACT fields:

- sharpness: 1-10 (focus quality)
- exposure: 1-10 (1=very dark/blown, 10=perfect)
- composition: 1-10 (framing, rule of thirds, visual interest)
- overall_quality: 1-10 (weighted composite)
- scene: one of: outdoor, indoor, portrait, group, detail, landscape_scenic, food, architecture, action
- people_count: integer
- has_faces: boolean
- faces_region: one of: center, left, right, top, bottom, spread, none
- emotion: one of: joyful, romantic, serene, energetic, nostalgic, dramatic, tender, neutral
- color_dominant: one of: warm, cool, neutral, vibrant, muted
- is_highlight: boolean (is this a standout photo?)
- is_cover_candidate: boolean (suitable as album cover?)
- is_hero_candidate: boolean (works well as a large/full-page photo?)
- is_closeup: boolean
- is_group_shot: boolean (3+ people)
- description: one sentence in Hebrew describing the photo
- setting: a short English tag for the specific setting/location (e.g. "ski resort", "beach sunset", "restaurant dinner", "park picnic", "city street", "home living room", "wedding ceremony", "pool party"). Be specific — two photos at the same place should get the same tag.

Return ONLY a valid JSON object: { "photos": [ {...}, {...}, ... ] }
No markdown, no explanation, just JSON.`

interface VisionInput {
  type: 'input_image'
  image_url: string
  detail?: 'low' | 'high' | 'auto'
}

/**
 * Send a batch of photos to GPT-4.1-mini for structured scoring.
 * Returns one PhotoScore per photo in the batch.
 */
export async function analyzePhotoBatch(
  photos: Photo[],
  orientations: Map<string, { orientation: PhotoOrientation; aspectRatio: number }>,
): Promise<PhotoScore[]> {
  const client = getClient()

  const imageInputs: VisionInput[] = []
  for (const photo of photos) {
    const prepared = await preparePhotoForVision(photo)
    imageInputs.push({
      type: 'input_image',
      image_url: prepared.type === 'url' ? prepared.url : prepared.dataUrl,
      detail: 'low',
    })
  }

  const userContent: (
    | { type: 'input_text'; text: string }
    | VisionInput
  )[] = [
    {
      type: 'input_text',
      text: `Analyze these ${photos.length} photos (numbered 1 to ${photos.length}). Return structured scores as specified.`,
    },
    ...imageInputs,
  ]

  const response = await client.responses.create({
    model: 'gpt-4.1-mini',
    input: [
      { role: 'developer', content: SCORING_SYSTEM_PROMPT },
      { role: 'user', content: userContent as never },
    ],
    temperature: 0.2,
  })

  const text = response.output_text
  const parsed = JSON.parse(text) as {
    photos: Array<{
      sharpness: number
      exposure: number
      composition: number
      overall_quality: number
      scene: string
      people_count: number
      has_faces: boolean
      faces_region: string
      emotion: string
      color_dominant: string
      is_highlight: boolean
      is_cover_candidate: boolean
      is_hero_candidate: boolean
      is_closeup: boolean
      is_group_shot: boolean
      description: string
      setting?: string
    }>
  }

  return parsed.photos.map((raw, i) => {
    const photo = photos[i]
    const dims = orientations.get(photo.id) ?? {
      orientation: detectOrientation(photo.width, photo.height),
      aspectRatio: photo.width / photo.height,
    }

    return {
      photoId: photo.id,
      orientation: dims.orientation,
      aspectRatio: dims.aspectRatio,
      sharpness: clamp(raw.sharpness, 1, 10),
      exposure: clamp(raw.exposure, 1, 10),
      composition: clamp(raw.composition, 1, 10),
      overallQuality: clamp(raw.overall_quality, 1, 10),
      scene: raw.scene as PhotoScore['scene'],
      peopleCount: raw.people_count ?? 0,
      hasFaces: raw.has_faces ?? false,
      facesRegion: (raw.faces_region ?? 'none') as PhotoScore['facesRegion'],
      emotion: raw.emotion as PhotoScore['emotion'],
      colorDominant: raw.color_dominant as PhotoScore['colorDominant'],
      isHighlight: raw.is_highlight ?? false,
      isCoverCandidate: raw.is_cover_candidate ?? false,
      isHeroCandidate: raw.is_hero_candidate ?? false,
      isCloseup: raw.is_closeup ?? false,
      isGroupShot: raw.is_group_shot ?? false,
      description: raw.description ?? '',
      setting: raw.setting ?? undefined,
    }
  })
}

// ─── Layer 3: Template Selection (Text API) ─────────────────────────

function buildLayoutSystemPrompt(family: DesignFamily): string {
  return `You are a premium photo album designer working within the "${family.name}" design family.

Design family personality: ${family.description}
Symmetry: ${family.composition.symmetry} | Density: ${family.composition.density} | Pace: ${family.rhythm.pace}

You will receive:
1. A SEQUENCE PLAN — a pre-determined album skeleton you MUST follow. Each spread has a role, density hint, and max photo count.
2. A list of analyzed photos with IDs, scores, and metadata
3. A library of available layout templates (pre-filtered for this design family)
4. Album preferences (type, style, mood)

CRITICAL RULES:
- You MUST respect the sequence plan. Each spread's role and max photo count are mandatory.
- If a spread has templateConstraint, you MUST use that exact template.
- For spreads marked isQuoteSpread: true, you MUST include a Hebrew quote (emotional, poetic, matching album mood).
- For spreads marked isBreathingSpread: true, use 1 photo maximum — these are "breathing room" spreads.
- Don't repeat the same template within its cannotRepeatWithin distance.
- Don't use the same category more than 2 times in a row.
- Hero/primary slots should get the highest-quality photos.
- Group photos by theme or event when descriptions suggest it.
- Each photo can only appear in ONE spread.
- The number of photos assigned MUST be between the template's minPhotos and maxPhotos AND not exceed the sequence plan's maxPhotos.
- Quote language: Hebrew. Quotes should be 1-2 sentences, emotional, and relevant to the photos' mood.
- Max quote length: ${family.textBehavior.quoteMaxLength} characters.

For each spread, also provide "design_overrides" — your creative per-spread art direction within this family's vocabulary:
- background_color: optional override (stay within the family palette)
- background_blur_photo_id: which photo to blur behind the spread (or null)
- background_blur_opacity: 0.0 to 0.15
- slot_overrides: per-slot frame tweaks (object keyed by slot ID):
  - border_width, border_color, shadow, rotation, padding, scale
  - Use these sparingly for visual variety — e.g. a hero photo with no border, a secondary with polaroid-like padding
- quote_style: optional overrides for this spread's quote appearance:
  - font_size (px), italic (bool), weight (number), color, position ("center"|"corner"|"sidebar"|"floating")

For each spread, also suggest a "mood_concept" — a visual atmosphere that enhances the spread's emotional impact.
Choose from these concept IDs based on the photos' emotions, scenes, and the album's overall mood:
- "ocean": serene, coastal, open-air, landscape photos — teal/sand/sky palette
- "coffee-candle": warm, intimate, indoor, tender — brown/amber palette
- "soft-romantic": romantic, dreamy, tender, couple — blush/rose/lavender palette
- "modern-luxury": dramatic, editorial, studio, elegant — cream/charcoal/gold palette
- "golden-hour": warm, nostalgic, sunset, golden-light — amber/gold palette
- "garden-fresh": fresh, nature, outdoor family — sage/green palette
- "minimal-clean": neutral fallback, versatile — soft cream palette

Guidelines for mood_concept selection:
- Match the dominant emotion and scene of the assigned photos
- Vary concepts between adjacent spreads — don't repeat the same concept twice in a row
- Breathing/text spreads work well with "minimal-clean" or "ocean"
- Cover/opening spreads benefit from "modern-luxury" or "golden-hour"
- Hero spreads with scenic photos → "ocean" or "golden-hour"
- Romantic/tender portraits → "soft-romantic" or "coffee-candle"

Return ONLY valid JSON:
{
  "spreads": [
    {
      "spread_index": 0,
      "template_id": "cover-hero",
      "theme": "פתיחה",
      "assigned_photo_ids": ["photo-1"],
      "quote": "...Hebrew quote..." or null,
      "design_overrides": { ... } or null,
      "mood_concept": "modern-luxury"
    }
  ]
}
No markdown, no explanation, just JSON.`
}

export async function selectTemplatesForSpreads(
  scores: PhotoScore[],
  config: AlbumConfig,
  spreadCount: number,
  family?: DesignFamily,
  sequencePlan?: SpreadSequenceSlot[],
): Promise<SpreadPlan[]> {
  const client = getClient()

  const allowedTemplates = family
    ? getTemplatesForFamily(family).map(({ template: t, weight }) => ({
        id: t.id,
        name: t.name,
        category: t.category,
        minPhotos: t.minPhotos,
        maxPhotos: t.maxPhotos,
        acceptsQuote: t.acceptsQuote,
        cannotRepeatWithin: t.cannotRepeatWithin,
        bestForMood: t.bestForMood,
        bestForScene: t.bestForScene,
        weight,
      }))
    : getTemplatesForFamily(getDesignFamily(null)).map(({ template: t }) => ({
        id: t.id,
        name: t.name,
        category: t.category,
        minPhotos: t.minPhotos,
        maxPhotos: t.maxPhotos,
        acceptsQuote: t.acceptsQuote,
        cannotRepeatWithin: t.cannotRepeatWithin,
        bestForMood: t.bestForMood,
        bestForScene: t.bestForScene,
        weight: 1,
      }))

  const photoSummary = scores.map((s) => ({
    id: s.photoId,
    quality: s.overallQuality,
    scene: s.scene,
    emotion: s.emotion,
    people: s.peopleCount,
    orientation: s.orientation,
    isHighlight: s.isHighlight,
    isCoverCandidate: s.isCoverCandidate,
    isHeroCandidate: s.isHeroCandidate,
    description: s.description,
  }))

  const sequenceDescription = sequencePlan
    ? `\n\nSEQUENCE PLAN (you MUST follow this):\n${describeSequence(sequencePlan)}`
    : ''

  const userMessage = `Album configuration:
- Type: ${config.type ?? 'general'}
- Style: ${config.style ?? 'modern'}
- Mood: ${config.mood ?? 'neutral'}
- Design family: ${family?.name ?? 'default'}
- Total spreads needed: ${spreadCount}
${sequenceDescription}

Available templates (pre-filtered for this design family):
${JSON.stringify(allowedTemplates, null, 1)}

Available photos (${photoSummary.length} total):
${JSON.stringify(photoSummary, null, 1)}

Create a plan for exactly ${spreadCount} spreads, following the sequence plan precisely.`

  const systemPrompt = buildLayoutSystemPrompt(family ?? getDesignFamily(null))

  const response = await client.responses.create({
    model: 'gpt-4.1-mini',
    input: [
      { role: 'developer', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.4,
  })

  const text = response.output_text
  const parsed = JSON.parse(text) as {
    spreads: Array<{
      spread_index: number
      template_id: string
      theme: string
      assigned_photo_ids: string[]
      quote: string | null
      mood_concept?: string
      design_overrides?: {
        background_color?: string
        background_blur_photo_id?: string
        background_blur_opacity?: number
        margin_override?: number
        slot_overrides?: Record<string, {
          border_width?: number
          border_color?: string
          shadow?: string
          rotation?: number
          padding?: number
          scale?: number
        }>
        quote_style?: {
          font_size?: number
          italic?: boolean
          weight?: number
          color?: string
          position?: 'center' | 'corner' | 'sidebar' | 'floating'
        }
      } | null
    }>
  }

  return parsed.spreads.map((raw) => {
    const overrides = raw.design_overrides
    const designOverrides: SpreadPlanDesign | undefined = overrides
      ? {
          backgroundColor: overrides.background_color,
          backgroundBlurPhotoId: overrides.background_blur_photo_id,
          backgroundBlurOpacity: overrides.background_blur_opacity,
          marginOverride: overrides.margin_override,
          slotOverrides: overrides.slot_overrides
            ? Object.fromEntries(
                Object.entries(overrides.slot_overrides).map(([k, v]) => [k, {
                  borderWidth: v.border_width,
                  borderColor: v.border_color,
                  shadow: v.shadow,
                  rotation: v.rotation,
                  padding: v.padding,
                  scale: v.scale,
                }]),
              )
            : undefined,
          quoteStyle: overrides.quote_style
            ? {
                fontSize: overrides.quote_style.font_size,
                italic: overrides.quote_style.italic,
                weight: overrides.quote_style.weight,
                color: overrides.quote_style.color,
                position: overrides.quote_style.position,
              }
            : undefined,
        }
      : undefined

    const rawMoodConcept = raw.mood_concept as MoodConceptId | undefined
    const moodConcept = rawMoodConcept && ALL_MOOD_IDS.includes(rawMoodConcept)
      ? rawMoodConcept
      : undefined

    return {
      spreadIndex: raw.spread_index,
      templateId: raw.template_id,
      theme: raw.theme ?? '',
      assignedPhotoIds: raw.assigned_photo_ids ?? [],
      quote: raw.quote ?? null,
      designOverrides,
      moodConcept,
    }
  })
}

// ─── AI Background Generation (Gemini 3.1 Flash Image) ──────────────

import { GoogleGenAI } from '@google/genai'
import type { MoodPack } from './moodPacks'

let _geminiClient: GoogleGenAI | null = null

function getGeminiClient(): GoogleGenAI {
  if (!_geminiClient) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined
    if (!apiKey) throw new Error('VITE_GEMINI_API_KEY is not set')
    _geminiClient = new GoogleGenAI({ apiKey })
  }
  return _geminiClient
}

const PAGE_VARIATION_SEEDS = [
  'with a subtle warm light radiating softly from the upper left corner',
  'with a gentle cool shadow pooling in the lower right, fading to light',
  'with the lightest hint of a horizontal gradient, darker at the edges',
  'with a soft radial glow near the center, barely perceptible',
  'with a delicate vertical wash from slightly warmer at top to cooler below',
  'with a faint diagonal light streak from corner to corner',
  'with the softest texture variation, like light falling on crumpled silk',
  'with a gentle atmospheric haze concentrated in the lower third',
  'with barely-there color temperature shift — warmer on the left, cooler right',
  'with a quiet vignette, the edges slightly deeper than the center',
  'with a whisper of light coming from the right side, like a window nearby',
  'with a smooth tonal shift, one half slightly more saturated than the other',
  'with the gentlest marbled texture beneath, like veined stone',
  'with a soft bokeh-like blur of light patches scattered subtly',
  'with a quiet layered depth, as if painted in translucent watercolor washes',
]

/**
 * Extracts pure base64 data and mimeType from a data URL.
 */
function parseDataUrl(dataUrl: string): { mimeType: string; data: string } | null {
  const match = dataUrl.match(/^data:(image\/[a-z+]+);base64,(.+)$/i)
  if (!match) return null
  return { mimeType: match[1], data: match[2] }
}

/**
 * Builds a rich, artistic Gemini prompt from the user's vibe text.
 * When reference images are provided, the prompt tells the model to match their style.
 */
function buildVibePrompt(
  vibeText: string,
  pageIndex: number,
  totalPages: number,
  hasReferences: boolean,
): string {
  const variation = PAGE_VARIATION_SEEDS[pageIndex % PAGE_VARIATION_SEEDS.length]
  const position = pageIndex === 0
    ? 'This is the opening page — slightly more dramatic and inviting.'
    : pageIndex === totalPages - 1
      ? 'This is the closing page — reflective, calm, like a quiet ending.'
      : pageIndex % 5 === 0
        ? 'This is a breathing page — extra minimal, extra quiet.'
        : ''

  const referenceInstruction = hasReferences
    ? `IMPORTANT: I've attached reference images that show the EXACT style, texture, colors and mood I want.
Generate a background that matches the visual style of these references as closely as possible.
Use the same color palette, the same type of texture, the same level of detail and abstraction.
The references are the ground truth — follow them faithfully.`
    : ''

  const vibeInstruction = vibeText
    ? `The overall vibe requested by the client: "${vibeText}"`
    : ''

  return `Create a beautiful, artistic background image for a premium photo album page.

${vibeInstruction}
${referenceInstruction}

This is page ${pageIndex + 1} of ${totalPages}. ${position}

Artistic direction:
- This should be a rich, atmospheric, textured background — NOT a flat color.
- Fine art surface quality: visible brushstrokes, subtle color shifts, organic texture, depth.
- ${variation}
- Colors should be muted, refined, premium.
- Every page in this album should feel like it belongs to the same visual world.

CRITICAL: No objects, no people, no text, no frames, no shapes, no icons, no photos, no album layouts. 
This is ONLY a background texture/atmosphere. Pure color, light, and texture.
The photo album software will overlay photos on top of this — this is just the canvas behind them.`
}

/**
 * Builds the multimodal content array for Gemini, including reference images.
 */
function buildGeminiContents(
  prompt: string,
  referenceDataUrls: string[],
): Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> {
  const contents: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = []

  for (const dataUrl of referenceDataUrls) {
    const parsed = parseDataUrl(dataUrl)
    if (parsed) {
      contents.push({ inlineData: { mimeType: parsed.mimeType, data: parsed.data } })
    }
  }

  contents.push({ text: prompt })
  return contents
}

/**
 * Generates a single background image using Gemini 3.1 Flash Image.
 * When reference images are provided, they're sent as multimodal input
 * so Gemini can match their visual style.
 */
async function generateSingleBackground(
  prompt: string,
  referenceDataUrls: string[],
): Promise<string | null> {
  try {
    const ai = getGeminiClient()

    const hasRefs = referenceDataUrls.length > 0
    const contents = hasRefs
      ? buildGeminiContents(prompt, referenceDataUrls)
      : prompt

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents,
      config: {
        responseModalities: ['IMAGE'],
        imageConfig: {
          aspectRatio: '16:9',
          imageSize: '1K',
        },
      },
    })

    const parts = response.candidates?.[0]?.content?.parts
    if (parts) {
      for (const part of parts) {
        if (part.inlineData?.data) {
          const mimeType = part.inlineData.mimeType ?? 'image/png'
          return `data:${mimeType};base64,${part.inlineData.data}`
        }
      }
    }

    return null
  } catch (err) {
    console.error('Background generation failed:', err)
    return null
  }
}

/**
 * Generates a UNIQUE background for EVERY page in the album.
 * All backgrounds share the same vibe + reference images.
 * Reference images are sent to Gemini as multimodal input so it can
 * faithfully reproduce the visual style the user wants.
 */
export async function generateSpreadBackgrounds(
  _packs: (MoodPack | undefined)[],
  vibeText?: string,
  onPageDone?: (done: number, total: number) => void,
  referenceDataUrls?: string[],
): Promise<(string | null)[]> {
  const totalPages = _packs.length
  const results: (string | null)[] = new Array(totalPages).fill(null)

  const effectiveVibe = vibeText?.trim()
    || 'Soft, warm, elegant, premium — cream and beige tones with subtle texture'

  const refs = referenceDataUrls ?? []
  const hasRefs = refs.length > 0

  const BATCH_SIZE = 2
  let completedCount = 0

  for (let b = 0; b < totalPages; b += BATCH_SIZE) {
    const batchEnd = Math.min(b + BATCH_SIZE, totalPages)
    const batchPromises: Promise<string | null>[] = []

    for (let i = b; i < batchEnd; i++) {
      const prompt = buildVibePrompt(effectiveVibe, i, totalPages, hasRefs)
      batchPromises.push(generateSingleBackground(prompt, refs))
    }

    const batchResults = await Promise.all(batchPromises)

    for (let j = 0; j < batchResults.length; j++) {
      results[b + j] = batchResults[j]
      completedCount++
      onPageDone?.(completedCount, totalPages)
    }
  }

  return results
}

// ─── Custom Background from User Prompt ──────────────────────────────

export async function generateCustomBackground(
  userPrompt: string,
  aspectRatio: '16:9' | '1:1' = '16:9',
  pagePhotoDataUrls: string[] = [],
): Promise<string | null> {
  try {
    const ai = getGeminiClient()

    const hasPhotos = pagePhotoDataUrls.length > 0
    const photoContext = hasPhotos
      ? `\n\nIMPORTANT — REFERENCE PHOTOS FROM THE PAGE:
I've attached ${pagePhotoDataUrls.length} photo(s) that are already placed on this album page.
You MUST analyze these photos and match your generated background to:
- The dominant COLOR PALETTE of the photos (warm/cool tones, saturation levels)
- The LIGHTING CONDITIONS visible in the photos (golden hour, daylight, indoor, overcast, etc.)
- The overall MOOD and ATMOSPHERE of the photos
- The SEASON and ENVIRONMENT if discernible (snowy, tropical, urban, etc.)

The background should feel like it naturally belongs behind these specific photos — as if they were taken in the same world.
Use complementary colors that enhance the photos without clashing.`
      : ''

    const prompt = `Create a beautiful, artistic background image for a premium printed photo album page.

The user requested: "${userPrompt}"
${photoContext}

Create EXACTLY what the user described, but as a rich, artistic, high-quality background suitable for a premium photo album.
The image should be vivid, detailed, and atmospheric — suitable for placing photos on top of it.

CRITICAL: Create the scene/image the user described. Make it look premium and artistic.
If the user described a scene (like a beach, forest, sunset), create that scene beautifully.
If the user described abstract art or textures, create that.
The result should be high quality, visually stunning, and work well as a background for an album page with photos overlaid on top.

Do NOT include any text, frames, photo placeholders, or UI elements.`

    const contents = hasPhotos
      ? buildGeminiContents(prompt, pagePhotoDataUrls)
      : prompt

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents,
      config: {
        responseModalities: ['IMAGE'],
        imageConfig: {
          aspectRatio,
          imageSize: '1K',
        },
      },
    })

    const parts = response.candidates?.[0]?.content?.parts
    if (parts) {
      for (const part of parts) {
        if (part.inlineData?.data) {
          const mimeType = part.inlineData.mimeType ?? 'image/png'
          return `data:${mimeType};base64,${part.inlineData.data}`
        }
      }
    }

    return null
  } catch (err) {
    console.error('Custom background generation failed:', err)
    return null
  }
}

export async function imageUrlToDataUrl(url: string): Promise<string | null> {
  try {
    if (url.startsWith('data:')) return url
    const resp = await fetch(url)
    const blob = await resp.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

// ─── Helpers ────────────────────────────────────────────────────────

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}
