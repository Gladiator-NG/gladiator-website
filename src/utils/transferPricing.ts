export interface BoatPriceOption {
  boat_id: string;
  is_active: boolean;
  price: number;
}

export interface PricedRoute {
  boat_prices?: BoatPriceOption[];
}

export function findBoatRoutePrice(
  route: PricedRoute | undefined,
  boatId: string,
): number | null {
  const price = route?.boat_prices?.find(
    (item) => item.boat_id === boatId && item.is_active,
  );
  return price?.price ?? null;
}
