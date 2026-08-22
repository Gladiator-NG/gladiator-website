export const BEACH_HOUSE_WINDOWS = {
  day_use: { start: '12:00', end: '20:00' },
  overnight: { start: '20:00', end: '09:00' },
} as const;

export interface BeachHousePriceBreakdown {
  dayBlocks: number;
  overnightBlocks: number;
  subtotal: number;
}

export function beachHousePriceBreakdown(
  mode: 'day_use' | 'overnight',
  rates: { dayRate: number | null; overnightRate: number | null },
  nights = 1,
): BeachHousePriceBreakdown | null {
  if (mode === 'day_use') {
    return rates.dayRate == null
      ? null
      : { dayBlocks: 1, overnightBlocks: 0, subtotal: rates.dayRate };
  }

  if (rates.overnightRate == null || nights < 1) return null;
  const dayBlocks = Math.max(0, nights - 1);
  if (dayBlocks > 0 && rates.dayRate == null) return null;

  return {
    dayBlocks,
    overnightBlocks: nights,
    subtotal:
      rates.overnightRate * nights + (rates.dayRate ?? 0) * dayBlocks,
  };
}

export function fixedBeachHousePrice(
  mode: 'day_use' | 'overnight',
  rates: { dayRate: number | null; overnightRate: number | null },
  nights = 1,
): number | null {
  return beachHousePriceBreakdown(mode, rates, nights)?.subtotal ?? null;
}
