export const VAT_RATE = 0.075;

export interface VatBreakdown {
  subtotal: number;
  vatAmount: number;
  vatRate: number;
  totalAmount: number;
}

function roundCurrency(amount: number) {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export function calculateVatBreakdown(subtotal: number): VatBreakdown {
  const normalizedSubtotal = roundCurrency(Math.max(0, subtotal));
  const vatAmount = roundCurrency(normalizedSubtotal * VAT_RATE);

  return {
    subtotal: normalizedSubtotal,
    vatAmount,
    vatRate: VAT_RATE,
    totalAmount: roundCurrency(normalizedSubtotal + vatAmount),
  };
}
