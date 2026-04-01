/** Map design-space % coords (0–100 page) to on-screen coords when inset by page margin m% on each side. */
export function applyPageMarginToPercentRect(
  x: number,
  y: number,
  width: number,
  height: number,
  marginPercent: number,
): { x: number; y: number; width: number; height: number } {
  const m = Math.max(0, Math.min(48, marginPercent))
  const s = (100 - 2 * m) / 100
  return {
    x: m + x * s,
    y: m + y * s,
    width: width * s,
    height: height * s,
  }
}
