/** Tests for the two pure functions the plugin formats text with. */

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { formatLocation } from '../src/client/format.ts'
import { failureReason } from '../src/client/location.ts'

test('formatLocation keeps the full precision and reports the radius', () => {
  const line = formatLocation(
    { latitude: 31.230416, longitude: 121.473701, accuracy: 12.4 },
    new Date(2026, 10, 18, 10, 31),
  )
  assert.equal(line, '位置：31.230416, 121.473701（精度约 ±12 米，2026-11-18 10:31 获取）')
})

test('formatLocation pads a single-digit month, day, hour, and minute', () => {
  const line = formatLocation({ latitude: 0, longitude: -0.5, accuracy: 1 }, new Date(2026, 0, 2, 3, 4))
  assert.equal(line, '位置：0.000000, -0.500000（精度约 ±1 米，2026-01-02 03:04 获取）')
})

test('formatLocation never reports a zero radius', () => {
  const line = formatLocation({ latitude: 1, longitude: 2, accuracy: 0.2 }, new Date(2026, 5, 1, 12, 0))
  assert.match(line, /±1 米/)
})

test('failureReason names each geolocation error code', () => {
  assert.match(failureReason({ code: 1 }), /权限被拒绝/)
  assert.match(failureReason({ code: 2 }), /无法定位/)
  assert.match(failureReason({ code: 3 }), /超时/)
})

test('failureReason still answers for an unknown rejection', () => {
  assert.match(failureReason(new Error('boom')), /未知的定位失败/)
  assert.match(failureReason(undefined), /未知的定位失败/)
})
