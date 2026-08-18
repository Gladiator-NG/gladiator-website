import assert from 'node:assert/strict';
import test from 'node:test';
import { findBoatRoutePrice } from '../src/utils/transferPricing.ts';

const route = {
  boat_prices: [
    { boat_id: 'small', is_active: true, price: 75_000 },
    { boat_id: 'large', is_active: true, price: 180_000 },
    { boat_id: 'inactive', is_active: false, price: 50_000 },
  ],
};

test('returns the selected boat price for the same route', () => {
  assert.equal(findBoatRoutePrice(route, 'small'), 75_000);
  assert.equal(findBoatRoutePrice(route, 'large'), 180_000);
});

test('does not expose inactive or missing boat prices', () => {
  assert.equal(findBoatRoutePrice(route, 'inactive'), null);
  assert.equal(findBoatRoutePrice(route, 'missing'), null);
  assert.equal(findBoatRoutePrice(undefined, 'small'), null);
});
