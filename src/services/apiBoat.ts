import getSupabaseClient from './supabase';

export interface BoatImage {
  id: string;
  boat_id: string;
  image_url: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Boat {
  id: string;
  name: string;
  slug: string;
  cover_image_id: string | null;
  description: string | null;
  location: string | null;
  pickup_location: string | null;
  max_guests: number | null;
  cabins: number | null;
  boat_type: string | null;
  price_per_hour: number | null;
  is_active: boolean;
  min_booking_hours: number | null;
  max_booking_hours: number | null;
  is_available_for_rental: boolean;
  created_at: string;
  updated_at: string;
  images?: BoatImage[];
}

const BOAT_SELECT = '*, images:boat_images!boat_images_boat_id_fkey(*)';

function orderImages(boat: Boat): Boat {
  return {
    ...boat,
    images: [...(boat.images ?? [])].sort(
      (first, second) => first.position - second.position,
    ),
  };
}

export async function getBoats(): Promise<Boat[]> {
  const { data, error } = await getSupabaseClient()
    .from('boats')
    .select(BOAT_SELECT)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as Boat[]).map(orderImages);
}

export async function getRentalBoats(): Promise<Boat[]> {
  const { data, error } = await getSupabaseClient()
    .from('boats')
    .select(BOAT_SELECT)
    .eq('is_active', true)
    .eq('is_available_for_rental', true)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as Boat[]).map(orderImages);
}

export async function getBoat(slug: string): Promise<Boat> {
  const { data, error } = await getSupabaseClient()
    .from('boats')
    .select(BOAT_SELECT)
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error) throw new Error(error.message);
  return orderImages(data as Boat);
}
