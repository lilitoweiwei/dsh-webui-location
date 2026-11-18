/** The composer line this plugin writes for one browser fix. */

/** One browser fix reduced to the fields the inserted text carries. */
export interface PositionFix {
  readonly latitude: number
  readonly longitude: number
  /** Radius of 68% confidence, in metres, as the browser reported it. */
  readonly accuracy: number
}

/** @returns the value padded to two digits. */
function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/**
 * Render the line written into the composer.
 *
 * Six decimals keep the browser's own resolution (about 0.1 m) instead of
 * rounding a fix away, and the accuracy radius travels with it so the reader can
 * tell a street-level fix from a city-level one.
 * @param fix - coordinates and their accuracy radius.
 * @param at - local reading time of the fix.
 * @returns one line: coordinates, accuracy, and when they were read.
 */
export function formatLocation(fix: PositionFix, at: Date): string {
  const coordinates = `${fix.latitude.toFixed(6)}, ${fix.longitude.toFixed(6)}`
  const accuracy = Math.max(1, Math.round(fix.accuracy))
  const time = `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())} ${pad(at.getHours())}:${pad(at.getMinutes())}`
  return `位置：${coordinates}（精度约 ±${accuracy} 米，${time} 获取）`
}
