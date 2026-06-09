import getSupabaseClient from './supabase';

export type BookingType = 'boat_cruise' | 'beach_house' | 'boat_rental';
export type BeachHouseBookingMode = 'day_use' | 'overnight';
export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'expired'
  | 'completed';
export type PaymentStatus = 'pending' | 'paid' | 'failed';
export type RentalType = 'outbound' | 'return' | 'round_trip';

export interface Booking {
  id: string;
  booking_type: BookingType;
  reference_code: string;
  boat_id: string | null;
  beach_house_id: string | null;
  beach_house_booking_mode: BeachHouseBookingMode | null;
  parent_beach_house_booking_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  guest_count: number;
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  hours: number | null;
  late_checkout_hours: number | null;
  rental_type: RentalType | null;
  rental_route_id: string | null;
  pickup_location: string | null;
  dropoff_location: string | null;
  total_amount: number;
  currency: string;
  status: BookingStatus;
  payment_status: PaymentStatus;
  payment_reference: string | null;
  source: 'web';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateBookingInput {
  booking_type: BookingType;
  boat_id?: string | null;
  beach_house_id?: string | null;
  beach_house_booking_mode?: BeachHouseBookingMode | null;
  parent_beach_house_booking_id?: string | null;
  parent_beach_house_booking_reference?: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  guest_count?: number;
  start_date: string;
  end_date: string;
  start_time?: string | null;
  end_time?: string | null;
  hours?: number | null;
  late_checkout_hours?: number | null;
  rental_type?: RentalType | null;
  rental_route_id?: string | null;
  pickup_location?: string | null;
  dropoff_location?: string | null;
  total_amount: number;
  notes?: string | null;
}

export interface AvailabilityParams {
  resourceType: 'boat' | 'beach_house';
  resourceId: string;
  startDate: string;
  endDate: string;
  startTime?: string | null;
  endTime?: string | null;
}

export interface BookingConfirmation {
  id: string;
  reference_code: string;
  total_amount: number;
  status: 'pending';
}

export interface BookingLookupInput {
  referenceCode: string;
  customerContact: string;
}

export interface BookingLookupResult {
  reference_code: string;
  booking_type: BookingType;
  asset_label: string | null;
  status: BookingStatus;
  payment_status: PaymentStatus;
  guest_count: number;
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  total_amount: number;
  currency: string;
}

export async function createBooking(
  input: CreateBookingInput,
): Promise<BookingConfirmation> {
  const { data, error } = await getSupabaseClient()
    .rpc('submit_public_booking_request', {
      p_booking_type: input.booking_type,
      p_asset_id: input.boat_id ?? input.beach_house_id,
      p_booking_mode: input.beach_house_booking_mode ?? null,
      p_customer_name: input.customer_name,
      p_customer_email: input.customer_email,
      p_customer_phone: input.customer_phone ?? '',
      p_guest_count: input.guest_count ?? 1,
      p_start_date: input.start_date,
      p_end_date: input.end_date,
      p_start_time: input.start_time ?? null,
      p_end_time: input.end_time ?? null,
      p_hours: input.hours ?? null,
      p_rental_type: input.rental_type ?? null,
      p_rental_route_id: input.rental_route_id ?? null,
      p_parent_beach_house_booking_reference:
        input.parent_beach_house_booking_reference ?? null,
      p_notes: input.notes ?? null,
    })

  if (error) throw new Error(error.message);
  return data as BookingConfirmation;
}

export async function lookupBooking(
  input: BookingLookupInput,
): Promise<BookingLookupResult | null> {
  const { data, error } = await getSupabaseClient().rpc(
    'lookup_public_booking',
    {
      p_reference_code: input.referenceCode,
      p_customer_contact: input.customerContact,
    },
  );

  if (error) throw new Error(error.message);
  return data as BookingLookupResult | null;
}

export async function checkAvailability(
  params: AvailabilityParams,
): Promise<{ available: boolean }> {
  const { resourceType, resourceId, startDate, endDate, startTime, endTime } =
    params;

  const { data, error } = await getSupabaseClient()
    .rpc('check_public_availability', {
      p_resource_type: resourceType,
      p_resource_id: resourceId,
      p_start_date: startDate,
      p_end_date: endDate,
      p_start_time: startTime || null,
      p_end_time: endTime || null,
    });

  if (error) throw new Error(error.message);
  return { available: Boolean(data) };
}
