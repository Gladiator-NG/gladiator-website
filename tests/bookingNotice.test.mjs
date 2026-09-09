import test from 'node:test';
import assert from 'node:assert/strict';
import { hasMinimumBookingNotice } from '../src/utils/bookingNotice.ts';

test('9am Lagos booking requires checkout by 7am Lagos', () => {
  assert.equal(hasMinimumBookingNotice('2026-09-10', '09:00', 2, Date.parse('2026-09-10T07:00:00+01:00')), true);
  assert.equal(hasMinimumBookingNotice('2026-09-10', '09:00', 2, Date.parse('2026-09-10T07:00:01+01:00')), false);
  assert.equal(hasMinimumBookingNotice('2026-09-10', '09:00', 2, Date.parse('2026-09-10T08:54:00+01:00')), false);
});
test('handles midnight, seconds, past and missing times', () => {
  const now = Date.parse('2026-09-09T23:00:00+01:00');
  assert.equal(hasMinimumBookingNotice('2026-09-10', '01:00:00', 2, now), true);
  assert.equal(hasMinimumBookingNotice('2026-09-10', '00:59', 2, now), false);
  assert.equal(hasMinimumBookingNotice('2026-09-09', '12:00', 2, now), false);
  assert.equal(hasMinimumBookingNotice('2026-09-10', null, 2, now), false);
});

test('beach houses require a full 24 hours notice', () => {
  const start = '2026-09-10';
  assert.equal(hasMinimumBookingNotice(start, '12:00', 24, Date.parse('2026-09-09T12:00:00+01:00')), true);
  assert.equal(hasMinimumBookingNotice(start, '12:00', 24, Date.parse('2026-09-09T12:00:01+01:00')), false);
});
