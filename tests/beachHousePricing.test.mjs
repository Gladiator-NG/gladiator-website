import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BEACH_HOUSE_WINDOWS,
  beachHousePriceBreakdown,
  fixedBeachHousePrice,
} from '../src/utils/beachHousePricing.ts';

test('uses one fixed day rate regardless of hours', () => {
  assert.equal(
    fixedBeachHousePrice('day_use', { dayRate: 250_000, overnightRate: 400_000 }),
    250_000,
  );
  assert.deepEqual(BEACH_HOUSE_WINDOWS.day_use, {
    start: '12:00',
    end: '20:00',
  });
});

test('charges overnight blocks plus every occupied intervening day', () => {
  assert.equal(
    fixedBeachHousePrice(
      'overnight',
      { dayRate: 250_000, overnightRate: 400_000 },
      3,
    ),
    1_700_000,
  );
  assert.deepEqual(
    beachHousePriceBreakdown(
      'overnight',
      { dayRate: 250_000, overnightRate: 400_000 },
      3,
    ),
    { dayBlocks: 2, overnightBlocks: 3, subtotal: 1_700_000 },
  );
  assert.deepEqual(BEACH_HOUSE_WINDOWS.overnight, {
    start: '20:00',
    end: '09:00',
  });
});

test('does not quote missing pricing or invalid nights', () => {
  assert.equal(
    fixedBeachHousePrice('day_use', { dayRate: null, overnightRate: 400_000 }),
    null,
  );
  assert.equal(
    fixedBeachHousePrice(
      'overnight',
      { dayRate: 250_000, overnightRate: 400_000 },
      0,
    ),
    null,
  );
  assert.equal(
    fixedBeachHousePrice(
      'overnight',
      { dayRate: null, overnightRate: 400_000 },
      2,
    ),
    null,
  );
});

test('a single overnight does not require or charge a day block', () => {
  assert.deepEqual(
    beachHousePriceBreakdown(
      'overnight',
      { dayRate: null, overnightRate: 400_000 },
      1,
    ),
    { dayBlocks: 0, overnightBlocks: 1, subtotal: 400_000 },
  );
});
