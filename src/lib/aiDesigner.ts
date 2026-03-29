/**
 * AI Spread Designer
 *
 * Replaces template selection with full design skeleton generation.
 * The AI produces a complete AISpreadSpec per spread, including photo slot
 * positions, text blocks, decorations, and background layers — all within
 * the design family vocabulary and primitive constraints.
 */

import OpenAI from 'openai'
import type {
  AISpreadSpec,
  AlbumConfig,
  DesignFamily,
  PhotoScore,
  SpreadSequenceSlot,
} from '../types'
import { describePrimitivesForPrompt } from './spreadPrimitives'
import { describeSequence } from './rhythmOrchestrator'
import { getDesignFamily } from './designFamilies'

let _client: OpenAI | null = null

function getClient(): OpenAI {
  if (!_client) {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined
    if (!apiKey) throw new Error('VITE_OPENAI_API_KEY is not set')
    _client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })
  }
  return _client
}

function buildDesignerSystemPrompt(family: DesignFamily): string {
  return `You are a world-class album designer. You design premium photo album spreads that feel hand-crafted and art-directed — never generic or template-like.

You work within the "${family.name}" design family.
Personality: ${family.description}

DESIGN VOCABULARY (from this family):
- Palette: background=${family.palette.background}, surface=${family.palette.surface}, accent=${family.palette.accent}, text=${family.palette.text}, textMuted=${family.palette.textMuted}
- Typography: quoteFont="${family.typography.quoteFont}" weight=${family.typography.quoteWeight}, captionFont="${family.typography.captionFont}"
- Spacing: margins=${family.spacing.pageMarginPercent}%, gap=${family.spacing.photoGapPx}px, whiteSpace=${family.spacing.whiteSpaceRatio}, breathing=${family.spacing.breathingRoom}
- Frames: border=${family.photoFrame.borderWidth}px ${family.photoFrame.borderColor}, radius=${family.photoFrame.borderRadius}px, shadow="${family.photoFrame.shadow}", padding=${family.photoFrame.innerPadding}px
- Composition: symmetry=${family.composition.symmetry}, density=${family.composition.density}, maxPhotos=${family.composition.maxPhotosPerSpread}
- Layout rules: canOffset=${family.layoutBehavior.canOffsetPhotos}, canOverlap=${family.layoutBehavior.canOverlapPhotos}, canRotate=${family.layoutBehavior.canRotatePhotos}, canBreakGrid=${family.layoutBehavior.canBreakGrid}
- Decorative: philosophy=${family.decorative.philosophy}, quoteMarks=${family.decorative.quoteMarks}, dividers=${family.decorative.dividers}, cornerOrnaments=${family.decorative.cornerOrnaments}
- Background: color=${family.background.color}, allowBlur=${family.background.allowPhotoBlur}, blurOpacity=${family.background.photoBlurOpacity}, texture=${family.background.textureType}, textureOpacity=${family.background.textureOpacity}
- Constraints: maxPhotos=${family.constraints.maxPhotosHardLimit}, forbidDark=${family.constraints.forbidDarkBackgrounds}, symmetryOnCover=${family.constraints.requireSymmetryOnCover}

${describePrimitivesForPrompt()}

COORDINATE SYSTEM:
- The spread is divided into two pages: LEFT (x: 0-48%) and RIGHT (x: 52-100%).
- The GUTTER is at x: 48-52%. NEVER place important elements there.
- All x, y, w, h values are PERCENTAGES of the full spread (0-100).
- Page "left" means the element's x should be in 0-48%. Page "right" means 52-100%.

ROLE-BASED DESIGN RULES:
- "cover": 1 hero photo, centered or asymmetric, dramatic. May include album title text.
- "opening": 1-2 photos, elegant entrance. Light decorative elements.
- "hero": 1-2 photos, one dominant. Strong visual impact.
- "standard": 2-4 photos, balanced. Clean and readable.
- "grid": 3-6 photos, structured. Uniform sizing preferred.
- "breathing": 1 photo max, lots of whitespace. Minimal decoration. Pause in the album rhythm.
- "collage": 3-5 photos, varied sizes. Creative, editorial feel.
- "text": 1-2 photos with prominent quote. Text is the focus.
- "closing": 1 photo, emotional ending. Quote recommended.

DESIGN PRINCIPLES:
1. Every spread must feel unique — vary composition, photo sizes, and decoration placement.
2. Create visual hierarchy: one element should dominate each spread.
3. Use negative space intentionally — don't fill every corner.
4. Decorations (lines, washes, flourishes) should enhance, not compete with photos.
5. Text should be readable — ensure contrast and spacing.
6. Vary photo sizes within a spread for rhythm (don't make all photos the same size).
7. Quotes should be in Hebrew, emotional, and match the album mood.

OUTPUT FORMAT:
Return ONLY valid JSON — no markdown, no explanation:
{
  "spreads": [
    {
      "spreadIndex": 0,
      "concept": "quiet romantic opening",
      "mood": "serene",
      "background": {
        "baseColor": "#FAF7F2",
        "gradient": { "type": "radial", "colors": ["rgba(191,176,158,0.08)", "transparent"], "position": "30% 70%" } or null,
        "texture": "paper" or null,
        "textureOpacity": 0.04,
        "blurPhotoSlot": "slot-0" or null,
        "blurOpacity": 0.06
      },
      "photoSlots": [
        {
          "id": "slot-0",
          "page": "left",
          "x": 5, "y": 8, "w": 40, "h": 70,
          "rotation": 0,
          "radius": 4,
          "role": "hero",
          "frame": { "borderWidth": 0, "borderColor": "transparent", "shadow": "0 4px 24px rgba(0,0,0,0.08)", "padding": 0 },
          "zIndex": 2,
          "accepts": ["portrait", "any"]
        }
      ],
      "textBlocks": [
        {
          "type": "quote",
          "content": "הרגעים הכי יפים הם אלה שלא תכננו",
          "page": "right",
          "x": 60, "y": 40, "w": 30, "h": 15,
          "fontFamily": "Heebo",
          "fontSize": 18,
          "fontWeight": 300,
          "italic": false,
          "color": "#2D2823",
          "align": "center",
          "letterSpacing": "0.02em",
          "lineHeight": 1.8,
          "rotation": 0,
          "opacity": 1,
          "zIndex": 10
        }
      ],
      "decorations": [
        {
          "type": "line",
          "page": "right",
          "x": 65, "y": 38, "w": 20, "h": 0.3,
          "color": "rgba(191,176,158,0.3)",
          "opacity": 0.5,
          "rotation": 0,
          "zIndex": 1
        }
      ]
    }
  ]
}`
}

const GOLD_STANDARD_EXAMPLES = `
EXAMPLE SPREADS (for reference — do NOT copy verbatim, use as style guidance):

Example 1 — Hero spread (contemporary luxury):
{
  "spreadIndex": 2,
  "concept": "dramatic hero moment",
  "mood": "dramatic",
  "background": { "baseColor": "#F5F1EA", "texture": "paper", "textureOpacity": 0.03 },
  "photoSlots": [
    { "id": "s0", "page": "left", "x": 3, "y": 5, "w": 44, "h": 90, "rotation": 0, "radius": 2, "role": "hero", "frame": { "borderWidth": 0, "borderColor": "transparent", "shadow": "0 8px 40px rgba(0,0,0,0.12)", "padding": 0 }, "zIndex": 3, "accepts": ["portrait", "any"] },
    { "id": "s1", "page": "right", "x": 55, "y": 20, "w": 35, "h": 50, "rotation": 0, "radius": 4, "role": "support", "frame": { "borderWidth": 1, "borderColor": "rgba(191,176,158,0.15)", "shadow": "0 2px 12px rgba(0,0,0,0.06)", "padding": 0 }, "zIndex": 2, "accepts": ["landscape", "any"] }
  ],
  "textBlocks": [],
  "decorations": [
    { "type": "line", "page": "right", "x": 55, "y": 75, "w": 35, "h": 0.2, "color": "rgba(191,176,158,0.2)", "opacity": 0.4, "rotation": 0, "zIndex": 1 }
  ]
}

Example 2 — Breathing spread (japanese airy):
{
  "spreadIndex": 5,
  "concept": "quiet pause",
  "mood": "serene",
  "background": { "baseColor": "#FAFAF8", "gradient": { "type": "radial", "colors": ["rgba(168,176,160,0.06)", "transparent"], "position": "50% 50%" } },
  "photoSlots": [
    { "id": "s0", "page": "right", "x": 58, "y": 15, "w": 32, "h": 55, "rotation": 0, "radius": 0, "role": "hero", "frame": { "borderWidth": 0, "borderColor": "transparent", "shadow": "none", "padding": 0 }, "zIndex": 2, "accepts": ["any"] }
  ],
  "textBlocks": [],
  "decorations": []
}

Example 3 — Grid with quote (parisian editorial):
{
  "spreadIndex": 4,
  "concept": "editorial grid with quote",
  "mood": "romantic",
  "background": { "baseColor": "#FDF8F4" },
  "photoSlots": [
    { "id": "s0", "page": "left", "x": 5, "y": 5, "w": 20, "h": 42, "rotation": -1.5, "radius": 3, "role": "support", "frame": { "borderWidth": 1, "borderColor": "rgba(180,140,120,0.15)", "shadow": "0 2px 8px rgba(0,0,0,0.05)", "padding": 6 }, "zIndex": 2, "accepts": ["portrait"] },
    { "id": "s1", "page": "left", "x": 27, "y": 10, "w": 18, "h": 35, "rotation": 1, "radius": 3, "role": "accent", "frame": { "borderWidth": 1, "borderColor": "rgba(180,140,120,0.15)", "shadow": "0 2px 8px rgba(0,0,0,0.05)", "padding": 6 }, "zIndex": 2, "accepts": ["portrait", "any"] },
    { "id": "s2", "page": "right", "x": 54, "y": 8, "w": 40, "h": 55, "rotation": 0, "radius": 2, "role": "hero", "frame": { "borderWidth": 0, "borderColor": "transparent", "shadow": "0 6px 30px rgba(0,0,0,0.1)", "padding": 0 }, "zIndex": 3, "accepts": ["landscape", "any"] }
  ],
  "textBlocks": [
    { "type": "quote", "content": "אהבה היא לא מה שמוצאים, אלא מה שבונים יחד", "page": "left", "x": 8, "y": 65, "w": 35, "h": 20, "fontFamily": "Heebo", "fontSize": 16, "fontWeight": 300, "italic": true, "color": "#4A3728", "align": "start", "letterSpacing": "0.01em", "lineHeight": 1.9, "rotation": 0, "opacity": 0.9, "zIndex": 10 }
  ],
  "decorations": [
    { "type": "flourish", "page": "left", "x": 8, "y": 62, "w": 18, "h": 4, "color": "rgba(180,140,120,0.2)", "opacity": 0.3, "rotation": 0, "zIndex": 1 }
  ]
}`

/**
 * Calls the AI to generate full design skeletons for all spreads.
 */
export async function generateSpreadSkeletons(
  scores: PhotoScore[],
  config: AlbumConfig,
  spreadCount: number,
  family?: DesignFamily,
  sequencePlan?: SpreadSequenceSlot[],
): Promise<AISpreadSpec[]> {
  const client = getClient()
  const resolvedFamily = family ?? getDesignFamily(null)

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
    ? `\n\nSEQUENCE PLAN (you MUST follow this — it defines each spread's role and constraints):\n${describeSequence(sequencePlan)}`
    : ''

  const userMessage = `Design a complete album with ${spreadCount} spreads.

Album configuration:
- Type: ${config.type ?? 'general'}
- Style: ${config.style ?? 'modern'}
- Mood: ${config.mood ?? 'neutral'}
- Design family: ${resolvedFamily.name}
${sequenceDescription}

Available photos (${photoSummary.length} total):
${JSON.stringify(photoSummary, null, 1)}

${GOLD_STANDARD_EXAMPLES}

IMPORTANT RULES:
- Generate exactly ${spreadCount} spreads.
- For each spread, decide photo slot positions, sizes, text, and decorations.
- Photo slots are EMPTY — you decide WHERE photos go, not WHICH photos. Use sequential IDs like "slot-0", "slot-1", etc.
- The number of photo slots per spread MUST respect the sequence plan's maxPhotos for that spread.
- For spreads with isQuoteSpread=true, include at least one text block of type "quote" with a Hebrew quote.
- For breathing spreads, use maximum 1 photo slot and minimal decoration.
- Each spread should feel unique — vary layouts, photo sizes, and composition.
- Stay within the design family's color palette and styling vocabulary.
- All coordinates are percentages (0-100) of the full spread.
- LEFT page: x values 0-48%. RIGHT page: x values 52-100%.
- Respect gutter zone: no important content at x 48-52%.

Return valid JSON only.`

  const response = await client.responses.create({
    model: 'gpt-4.1-mini',
    input: [
      { role: 'developer', content: buildDesignerSystemPrompt(resolvedFamily) },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.6,
  })

  const text = response.output_text
  const parsed = JSON.parse(text) as { spreads: AISpreadSpec[] }

  return parsed.spreads.map((spec, i) => ({
    ...spec,
    spreadIndex: spec.spreadIndex ?? i,
  }))
}
