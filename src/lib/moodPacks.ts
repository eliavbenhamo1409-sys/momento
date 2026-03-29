import type { TextureType, SlotImportance } from '../types'

// ─── Mood Visual Pack System ─────────────────────────────────────────
//
// Each pack defines a complete visual atmosphere that can be applied
// to a spread to create concept-driven design beyond flat colors.

export type MoodConceptId =
  | 'ocean'
  | 'coffee-candle'
  | 'soft-romantic'
  | 'modern-luxury'
  | 'golden-hour'
  | 'garden-fresh'
  | 'minimal-clean'

export interface BackgroundLayer {
  gradient: string
  opacity: number
  blendMode?: string
}

export interface MoodPack {
  id: MoodConceptId
  name: string
  nameHe: string

  backgroundColor: string
  backgroundLayers: BackgroundLayer[]

  svgOverlay: string | null
  svgOverlayOpacity: number

  palette: {
    primary: string
    secondary: string
    accent: string
    text: string
  }

  texture: TextureType
  textureOpacity: number

  photoShapes: Partial<Record<SlotImportance, string | null>>

  scriptColor: string
  scriptOpacity: number
  accentLineColor: string

  /** DALL-E prompt for generating a concept-driven background image */
  dallePrompt: string
  /** Whether this pack should generate AI backgrounds (false for minimal-clean) */
  generateBackground: boolean
}

// ─── SVG Overlays (inline data URLs) ─────────────────────────────────

const WAVE_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120' preserveAspectRatio='none'%3E%3Cpath d='M0,60 C200,100 400,20 600,60 C800,100 1000,20 1200,60 L1200,120 L0,120 Z' fill='%2399C4D1' opacity='0.18'/%3E%3Cpath d='M0,80 C300,40 500,100 800,60 C1000,30 1100,80 1200,70 L1200,120 L0,120 Z' fill='%23B5D8E0' opacity='0.12'/%3E%3C/svg%3E")`

const STEAM_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 300'%3E%3Cpath d='M100,280 C95,240 80,220 85,190 C90,160 110,150 105,120 C100,90 85,70 90,40' stroke='%23C4B09A' stroke-width='1.5' fill='none' opacity='0.15' stroke-linecap='round'/%3E%3Cpath d='M120,280 C115,235 130,215 125,185 C120,155 105,145 110,115 C115,85 130,65 125,35' stroke='%23C4B09A' stroke-width='1' fill='none' opacity='0.10' stroke-linecap='round'/%3E%3C/svg%3E")`

const PETAL_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Cellipse cx='50' cy='60' rx='12' ry='6' fill='%23E8B4B8' opacity='0.12' transform='rotate(-30 50 60)'/%3E%3Cellipse cx='320' cy='90' rx='10' ry='5' fill='%23D4A0A7' opacity='0.10' transform='rotate(20 320 90)'/%3E%3Cellipse cx='180' cy='340' rx='14' ry='6' fill='%23E8B4B8' opacity='0.08' transform='rotate(-15 180 340)'/%3E%3Cellipse cx='350' cy='280' rx='11' ry='5' fill='%23D4A0A7' opacity='0.11' transform='rotate(40 350 280)'/%3E%3Cellipse cx='80' cy='300' rx='9' ry='4' fill='%23E8B4B8' opacity='0.09' transform='rotate(-45 80 300)'/%3E%3C/svg%3E")`

const SUNFLARE_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Cdefs%3E%3CradialGradient id='g' cx='75%25' cy='15%25' r='60%25'%3E%3Cstop offset='0%25' stop-color='%23F5D68A' stop-opacity='0.25'/%3E%3Cstop offset='50%25' stop-color='%23F0C45C' stop-opacity='0.08'/%3E%3Cstop offset='100%25' stop-color='%23F0C45C' stop-opacity='0'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='400' height='400' fill='url(%23g)'/%3E%3C/svg%3E")`

const LEAF_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Cpath d='M30,350 Q45,320 35,290 Q50,310 60,280' stroke='%23A8B89C' stroke-width='1.2' fill='none' opacity='0.15'/%3E%3Cpath d='M360,30 Q345,60 355,90 Q340,70 330,100' stroke='%23A8B89C' stroke-width='1.2' fill='none' opacity='0.12'/%3E%3Cellipse cx='35' cy='310' rx='15' ry='8' fill='%23B5C4A8' opacity='0.08' transform='rotate(-50 35 310)'/%3E%3Cellipse cx='355' cy='70' rx='15' ry='8' fill='%23B5C4A8' opacity='0.08' transform='rotate(40 355 70)'/%3E%3C/svg%3E")`

// ─── Pack Definitions ────────────────────────────────────────────────

const ocean: MoodPack = {
  id: 'ocean',
  name: 'Ocean Breeze',
  nameHe: 'רוח ים',
  backgroundColor: '#EAF2F4',
  backgroundLayers: [
    { gradient: 'linear-gradient(180deg, #D4E8ED 0%, #EAF2F4 40%, #F5EDE4 100%)', opacity: 1 },
    { gradient: 'radial-gradient(ellipse at 30% 80%, #C1DBE3 0%, transparent 60%)', opacity: 0.35, blendMode: 'multiply' },
  ],
  svgOverlay: WAVE_SVG,
  svgOverlayOpacity: 1,
  palette: { primary: '#7AAFBF', secondary: '#D4C5A0', accent: '#5C9AAD', text: '#2A3A40' },
  texture: 'paper',
  textureOpacity: 0.02,
  photoShapes: {},
  scriptColor: '#8CBCC8',
  scriptOpacity: 0.2,
  accentLineColor: 'rgba(124,175,191,0.25)',
  generateBackground: true,
  dallePrompt: 'Soft abstract background texture. Pale coastal tones: washed sand, misty seafoam, faded sky blue. Gentle gradient from warm beige at the bottom to pale blue at the top, like a calm quiet horizon. Subtle paper grain. No objects, no people, no text, no shapes. Just color and light. Minimal, serene, airy.',
}

const coffeeCandle: MoodPack = {
  id: 'coffee-candle',
  name: 'Coffee & Candle',
  nameHe: 'קפה ונר',
  backgroundColor: '#F0E8DD',
  backgroundLayers: [
    { gradient: 'linear-gradient(165deg, #EDE3D5 0%, #F0E8DD 50%, #E8DDD0 100%)', opacity: 1 },
    { gradient: 'radial-gradient(ellipse at 70% 30%, #D4C1A8 0%, transparent 55%)', opacity: 0.25, blendMode: 'multiply' },
    { gradient: 'radial-gradient(circle at 25% 75%, #F5E6D0 0%, transparent 40%)', opacity: 0.3 },
  ],
  svgOverlay: STEAM_SVG,
  svgOverlayOpacity: 1,
  palette: { primary: '#B89E80', secondary: '#C8B196', accent: '#96785A', text: '#3A2E24' },
  texture: 'grain',
  textureOpacity: 0.025,
  photoShapes: {},
  scriptColor: '#C4A882',
  scriptOpacity: 0.22,
  accentLineColor: 'rgba(184,158,128,0.25)',
  generateBackground: true,
  dallePrompt: 'Soft abstract background texture. Warm tones: beige, caramel, soft amber, cream. Gentle warm radial glow from the center. Subtle linen or paper grain texture. Like warm morning light on a natural surface. No objects, no people, no text, no shapes, no cups, no candles. Just warm color and soft light. Intimate, quiet, cozy.',
}

const softRomantic: MoodPack = {
  id: 'soft-romantic',
  name: 'Soft Romantic',
  nameHe: 'רומנטי רך',
  backgroundColor: '#F4EAED',
  backgroundLayers: [
    { gradient: 'linear-gradient(135deg, #F2E4E8 0%, #F4EAED 35%, #EDE0E8 100%)', opacity: 1 },
    { gradient: 'radial-gradient(ellipse at 80% 20%, #E8C8D0 0%, transparent 50%)', opacity: 0.3, blendMode: 'multiply' },
    { gradient: 'radial-gradient(ellipse at 15% 85%, #DEC0D0 0%, transparent 45%)', opacity: 0.2 },
  ],
  svgOverlay: PETAL_SVG,
  svgOverlayOpacity: 1,
  palette: { primary: '#C89DA8', secondary: '#D4B0B8', accent: '#A07882', text: '#3A2A30' },
  texture: 'watercolor',
  textureOpacity: 0.04,
  photoShapes: {},
  scriptColor: '#D4A0AE',
  scriptOpacity: 0.22,
  accentLineColor: 'rgba(200,157,168,0.25)',
  generateBackground: true,
  dallePrompt: 'Soft abstract background texture. Gentle blush and lavender watercolor wash on cream. Very subtle gradient from warm rose at one corner to pale cream. Delicate, muted, barely-there color. No flowers, no hearts, no objects, no people, no text, no shapes. Just soft pastel color blending. Refined, quiet, elegant.',
}

const modernLuxury: MoodPack = {
  id: 'modern-luxury',
  name: 'Modern Luxury',
  nameHe: 'יוקרה מודרנית',
  backgroundColor: '#F2EDE6',
  backgroundLayers: [
    { gradient: 'linear-gradient(180deg, #EDE8E0 0%, #F2EDE6 50%, #EDE6DC 100%)', opacity: 1 },
    { gradient: 'linear-gradient(135deg, transparent 0%, rgba(180,168,148,0.08) 50%, transparent 100%)', opacity: 1 },
  ],
  svgOverlay: null,
  svgOverlayOpacity: 0,
  palette: { primary: '#9E9280', secondary: '#C4B8A4', accent: '#7A7060', text: '#2D2823' },
  texture: 'paper',
  textureOpacity: 0.018,
  photoShapes: {},
  scriptColor: '#B8AA94',
  scriptOpacity: 0.18,
  accentLineColor: 'rgba(158,146,128,0.22)',
  generateBackground: true,
  dallePrompt: 'Soft abstract background texture. Clean cream and off-white with very subtle gray shadow gradient. Faint marble or stone texture barely visible. Sophisticated, neutral, powerful emptiness. No objects, no people, no text, no shapes, no lines, no gold. Just refined neutral tones and quiet texture. Ultra-minimal luxury.',
}

const goldenHour: MoodPack = {
  id: 'golden-hour',
  name: 'Golden Hour',
  nameHe: 'שעת הזהב',
  backgroundColor: '#F5EDE0',
  backgroundLayers: [
    { gradient: 'linear-gradient(170deg, #F0E4D0 0%, #F5EDE0 45%, #EDE0CC 100%)', opacity: 1 },
    { gradient: 'radial-gradient(ellipse at 75% 15%, #F0D498 0%, transparent 55%)', opacity: 0.3, blendMode: 'multiply' },
  ],
  svgOverlay: SUNFLARE_SVG,
  svgOverlayOpacity: 1,
  palette: { primary: '#C8A860', secondary: '#D4BE88', accent: '#A08840', text: '#3A3020' },
  texture: 'grain',
  textureOpacity: 0.02,
  photoShapes: {},
  scriptColor: '#D0B870',
  scriptOpacity: 0.2,
  accentLineColor: 'rgba(200,168,96,0.22)',
  generateBackground: true,
  dallePrompt: 'Soft abstract background texture. Warm golden amber light washing across cream. Gentle radial warmth from the upper right corner fading into soft beige. Honey and gold tones. Nostalgic, dreamy. No sun, no sunbeams, no objects, no people, no text, no shapes. Just warm golden light and color. Soft, quiet glow.',
}

const gardenFresh: MoodPack = {
  id: 'garden-fresh',
  name: 'Garden Fresh',
  nameHe: 'גן ירוק',
  backgroundColor: '#EDF0E8',
  backgroundLayers: [
    { gradient: 'linear-gradient(160deg, #E4EADE 0%, #EDF0E8 40%, #E8EDE0 100%)', opacity: 1 },
    { gradient: 'radial-gradient(ellipse at 20% 30%, #C8D4BC 0%, transparent 50%)', opacity: 0.25, blendMode: 'multiply' },
  ],
  svgOverlay: LEAF_SVG,
  svgOverlayOpacity: 1,
  palette: { primary: '#8AA07A', secondary: '#A8B89C', accent: '#6A8060', text: '#2A3428' },
  texture: 'linen',
  textureOpacity: 0.025,
  photoShapes: {},
  scriptColor: '#98B088',
  scriptOpacity: 0.2,
  accentLineColor: 'rgba(138,160,122,0.22)',
  generateBackground: true,
  dallePrompt: 'Soft abstract background texture. Muted sage green and warm cream gradient. Gentle natural tone like soft linen dyed with green tea. Subtle grain texture. No leaves, no plants, no branches, no objects, no people, no text, no shapes. Just soft green-cream color and light. Fresh, natural, airy.',
}

const minimalClean: MoodPack = {
  id: 'minimal-clean',
  name: 'Minimal Clean',
  nameHe: 'מינימלי נקי',
  backgroundColor: '#F5EDE4',
  backgroundLayers: [
    { gradient: 'linear-gradient(180deg, #F5EDE4 0%, #F0E8DF 100%)', opacity: 1 },
  ],
  svgOverlay: null,
  svgOverlayOpacity: 0,
  palette: { primary: '#9E9686', secondary: '#C4BCB0', accent: '#7A7568', text: '#2D2823' },
  texture: 'paper',
  textureOpacity: 0.015,
  photoShapes: {},
  scriptColor: '#C8C0B4',
  scriptOpacity: 0.18,
  accentLineColor: 'rgba(180,175,165,0.22)',
  generateBackground: true,
  dallePrompt: 'Soft abstract background texture. Pure warm cream white with the faintest warm undertone. Barely visible paper grain. The quietest, most minimal background imaginable. No objects, no people, no text, no shapes, no lines. Just soft warm white emptiness. Serene, pure, calm.',
}

// ─── Registry ────────────────────────────────────────────────────────

export const MOOD_PACKS: Record<MoodConceptId, MoodPack> = {
  'ocean': ocean,
  'coffee-candle': coffeeCandle,
  'soft-romantic': softRomantic,
  'modern-luxury': modernLuxury,
  'golden-hour': goldenHour,
  'garden-fresh': gardenFresh,
  'minimal-clean': minimalClean,
}

export function getMoodPack(id: MoodConceptId): MoodPack {
  return MOOD_PACKS[id] ?? minimalClean
}

export const ALL_MOOD_IDS: MoodConceptId[] = Object.keys(MOOD_PACKS) as MoodConceptId[]
