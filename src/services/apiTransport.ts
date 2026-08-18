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
  boat_prices?: BoatTransferPrice[];
}

export interface BoatTransferPrice {
  id: string;
  boat_id: string;
  route_id: string;
  price: number;
  is_active: boolean;
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
      '*, from_location:locations!from_location_id(id, name), to_location:locations!to_location_id(id, name), boat_prices:boat_transfer_prices!route_id(id, boat_id, route_id, price, is_active)',
    )
    .eq('is_active', true);

  if (error) throw new Error(error.message);
  return (data ?? []) as TransportRoute[];
}
