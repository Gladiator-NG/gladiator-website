import getSupabaseClient from './supabase';

export interface BeachHouseImage {
  id: string;
  beach_house_id: string;
  image_url: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface BeachHouse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  location: string | null;
  address: string | null;
  max_guests: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  price_per_night: number | null;
  day_use_price_per_hour: number | null;
  day_use_min_hours: number | null;
  day_use_max_hours: number | null;
  check_in_time: string | null;
  check_out_time: string | null;
  late_checkout_price_per_hour: number | null;
  extra_guest_fee_per_head: number | null;
  amenities: string[];
  is_active: boolean;
  cover_image_id: string | null;
  rental_price: number | null;
  created_at: string;
  updated_at: string;
  images?: BeachHouseImage[];
}

const BEACH_HOUSE_SELECT =
  '*, images:beach_house_images!beach_house_images_beach_house_id_fkey(*)';

function orderImages(beachHouse: BeachHouse): BeachHouse {
  return {
    ...beachHouse,
    images: [...(beachHouse.images ?? [])].sort(
      (first, second) => first.position - second.position,
    ),
  };
}

export async function getBeachHouses(): Promise<BeachHouse[]> {
  const { data, error } = await getSupabaseClient()
    .from('beach_houses')
    .select(BEACH_HOUSE_SELECT)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as BeachHouse[]).map(orderImages);
}

export async function getBeachHouse(slug: string): Promise<BeachHouse> {
  const { data, error } = await getSupabaseClient()
    .from('beach_houses')
    .select(BEACH_HOUSE_SELECT)
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error) throw new Error(error.message);
  return orderImages(data as BeachHouse);
}
