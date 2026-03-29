import type {
  EditorSpread,
  SpreadSequenceSlot,
  DesignFamily,
  LayoutTemplate,
  ResolvedSpreadStyle,
  ResolvedFrame,
  EnrichedSlotData,
  FinalSlotData,
  SlotImportance,
  SpreadRoleOverride,
} from '../types'
import { getVariant } from './templateVariants'
import { getTemplate } from './layoutGrammar'

/**
 * Takes a raw EditorSpread (from photoPlacer) and a sequence slot (from rhythmOrchestrator)
 * and "compiles" them into a fully resolved spread with all visual tokens pre-computed.
 *
 * Resolution cascade (CSS-specificity-like):
 *   Level 1: Family default (lowest)
 *   Level 2: Spread role override (cover/hero/breathing/closing)
 *   Level 3: Slot importance override (hero/primary/secondary/accent) — per slot only
 */
export function resolveSpreadVisuals(
  spread: EditorSpread,
  sequenceSlot: SpreadSequenceSlot,
  family: DesignFamily,
): EditorSpread {
  const variant = getVariant(family.id, spread.templateId)
  const roleOverride = family.spreadRoles[sequenceSlot.role]
  const template = getTemplate(spread.templateId)

  const resolvedStyle = resolveStyle(family, roleOverride)

  const rawSlots = (spread.slots ?? []) as FinalSlotData[]
  const enrichedSlots = enrichSlots(
    rawSlots,
    template,
    resolvedStyle.frame,
    family,
  )

  return {
    ...spread,
    familyId: family.id,
    role: sequenceSlot.role,
    variant: variant ?? null,
    resolvedStyle,
    slots: enrichedSlots,
  }
}

function resolveStyle(
  family: DesignFamily,
  roleOverride?: SpreadRoleOverride,
): ResolvedSpreadStyle {
  return {
    spacing: { ...family.spacing, ...roleOverride?.spacingOverride },
    background: { ...family.background, ...roleOverride?.backgroundOverride },
    frame: { ...family.photoFrame, ...roleOverride?.frameOverride },
    typography: { ...family.typography, ...roleOverride?.typographyOverride },
    decorative: { ...family.decorative, ...roleOverride?.decorativeOverride },
    palette: { ...family.palette },
  }
}

function enrichSlots(
  rawSlots: FinalSlotData[],
  template: LayoutTemplate | undefined,
  baseFrame: ResolvedFrame,
  family: DesignFamily,
): EnrichedSlotData[] {
  if (!template) {
    return rawSlots.map((s) => ({
      ...s,
      importance: 'secondary' as SlotImportance,
      frame: baseFrame,
    }))
  }

  return rawSlots.map((raw) => {
    const slotDef = template.slots.find((s) => s.id === raw.slotId)
    const importance: SlotImportance = slotDef?.importance ?? 'secondary'
    const importanceOverride = family.slotFrameOverrides[importance]
    const frame: ResolvedFrame = { ...baseFrame, ...importanceOverride }

    return {
      ...raw,
      importance,
      frame,
    }
  })
}

/**
 * Batch-resolve an entire album's spreads.
 */
export function resolveAlbumVisuals(
  spreads: EditorSpread[],
  sequencePlan: SpreadSequenceSlot[],
  family: DesignFamily,
): EditorSpread[] {
  return spreads.map((spread, i) => {
    const sequenceSlot = sequencePlan[i] ?? {
      index: i,
      role: 'standard' as const,
      isQuoteSpread: false,
      isBreathingSpread: false,
      densityHint: 'moderate' as const,
    }
    return resolveSpreadVisuals(spread, sequenceSlot, family)
  })
}
