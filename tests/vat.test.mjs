import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateVatBreakdown, VAT_RATE } from '../src/utils/vat.ts';

test('adds 7.5% VAT to the booking subtotal', () => {
  assert.equal(VAT_RATE, 0.075);
  assert.deepEqual(calculateVatBreakdown(2_000_000), {
    subtotal: 2_000_000,
    vatAmount: 150_000,
    vatRate: 0.075,
    totalAmount: 2_150_000,
  });
});

test('rounds VAT and the payable total to currency precision', () => {
  assert.deepEqual(calculateVatBreakdown(100.05), {
    subtotal: 100.05,
    vatAmount: 7.5,
    vatRate: 0.075,
    totalAmount: 107.55,
  });
});
