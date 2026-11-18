/** One browser location request under this plugin's fixed accuracy policy. */

import type { PositionFix } from './format.ts'

/** Outcome of one location request. */
export type LocationOutcome =
  | { readonly kind: 'fix'; readonly fix: PositionFix; readonly at: Date }
  | { readonly kind: 'failed'; readonly reason: string }

/**
 * How long one request may take.
 *
 * `timeout` defaults to `Infinity`, so a request that never settles would leave
 * the row silent forever.
 */
const TIMEOUT_MS = 10_000

/**
 * Translate one `GeolocationPositionError` into the sentence shown to the user.
 * @param error - the rejection value of `getCurrentPosition`.
 * @returns a user-facing reason.
 */
export function failureReason(error: unknown): string {
  const code: unknown = typeof error === 'object' && error !== null && 'code' in error
    ? (error as { readonly code: unknown }).code
    : undefined
  switch (code) {
    case 1:
      return '定位权限被拒绝，可在地址栏的站点设置里重新允许'
    case 2:
      return '设备暂时无法定位（定位服务不可用）'
    case 3:
      return '定位超时，请重试'
    default:
      return '浏览器返回了未知的定位失败'
  }
}

/**
 * Ask the browser for the most accurate fix it can produce.
 *
 * Accuracy is not a dial: `enableHighAccuracy` only permits the precise sources,
 * and the returned radius is whatever the device could achieve.
 * @returns the fix, or the user-facing reason it could not be produced.
 */
export async function requestLocation(): Promise<LocationOutcome> {
  if (!window.isSecureContext) {
    return { kind: 'failed', reason: '当前页面不是安全上下文（需 HTTPS 访问），浏览器不提供定位' }
  }
  if (!('geolocation' in navigator)) {
    return { kind: 'failed', reason: '当前浏览器没有提供定位能力' }
  }
  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: TIMEOUT_MS,
        maximumAge: 0,
      })
    })
    return {
      kind: 'fix',
      fix: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      },
      at: new Date(position.timestamp),
    }
  } catch (error) {
    return { kind: 'failed', reason: failureReason(error) }
  }
}
