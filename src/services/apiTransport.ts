import getSupabaseClient from './supabase';

export interface Location {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TransportRoute {
  id: string;
  from_location_id: string;
  to_location_id: string;
  route_price: number | null;
  duration_hours: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  from_location?: Pick<Location, 'id' | 'name'> | null;
  to_location?: Pick<Location, 'id' | 'name'> | null;
}

export async function getLocations(): Promise<Location[]> {
  const { data, error } = await getSupabaseClient()
    .from('locations')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Location[];
}

export async function getTransportRoutes(): Promise<TransportRoute[]> {
  const { data, error } = await getSupabaseClient()
    .from('transport_routes')
    .select(
      '*, from_location:locations!from_location_id(id, name), to_location:locations!to_location_id(id, name)',
    )
    .eq('is_active', true);

  if (error) throw new Error(error.message);
  return (data ?? []) as TransportRoute[];
}

export function findRoutePrice(
  routes: TransportRoute[],
  fromLocation: string,
  toLocation: string,
): number | null {
  const route = routes.find(
    (item) =>
      item.from_location?.name === fromLocation &&
      item.to_location?.name === toLocation,
  );

  return route?.route_price ?? null;
}
