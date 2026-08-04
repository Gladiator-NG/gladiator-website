import { createHash } from 'node:crypto';
import type { CreateBookingInput } from './apiBooking';
import { getSupabaseServerClient } from './supabaseServer';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';
const DEFAULT_CURRENCY = 'NGN';

type PaystackInitializeResponse = {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
};

type PaystackVerifyResponse = {
  status: boolean;
  message: string;
  data?: {
    amount: number;
    currency: string;
    reference: string;
    status: string;
    metadata?:
      | string
      | {
          booking_input?: CreateBookingInput;
          quoted_amount?: number;
          quoted_currency?: string;
        };
  };
};

export type PaymentConfirmation = {
  ok: boolean;
  message: string;
  paymentReceived?: boolean;
  needsAttention?: boolean;
  booking?: {
    reference_code: string;
    status: string;
    payment_status: string;
    total_amount: number;
    currency: string;
  };
};

type BoatQuoteRecord = {
  id: string;
  is_active: boolean;
  is_available_for_rental: boolean | null;
  max_booking_hours: number | null;
  max_guests: number | null;
  min_booking_hours: number | null;
  pickup_location: string | null;
  price_per_hour: number | null;
};

type BeachHouseQuoteRecord = {
  id: string;
  check_in_time: string | null;
  check_out_time: string | null;
  day_use_max_hours: number | null;
  day_use_min_hours: number | null;
  day_use_price_per_hour: number | null;
  extra_guest_fee_per_head: number | null;
  max_guests: number | null;
  price_per_night: number | null;
};

type RouteQuoteRecord = {
  id: string;
  duration_hours: number | null;
  is_active: boolean;
  route_price: number | null;
};

type BookingQuote = {
  totalAmount: number;
  currency: string;
};

type PaymentAttempt = {
  authorization_url: string | null;
  booking_id: string | null;
  payment_reference: string;
  provider_status: string | null;
  status:
    | 'initialized'
    | 'abandoned'
    | 'paid'
    | 'confirmed'
    | 'requires_attention';
};

function getPaystackSecretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error('Missing PAYSTACK_SECRET_KEY.');
  return key;
}

function getSiteUrl() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
    'http://localhost:3000';

  if (
    siteUrl.startsWith('https://localhost') ||
    siteUrl.startsWith('https://127.0.0.1')
  ) {
    return siteUrl.replace(/^https:\/\//, 'http://');
  }

  return siteUrl;
}

function toSubunit(amount: number) {
  return Math.round(Number(amount) * 100);
}

function nightsBetween(startDate: string, endDate: string) {
  const duration =
    new Date(`${endDate}T00:00:00`).getTime() -
    new Date(`${startDate}T00:00:00`).getTime();

  return Math.max(0, Math.round(duration / (1000 * 60 * 60 * 24)));
}

function addHours(time: string, hours: number) {
  const [baseHours, baseMinutes] = time.split(':').map(Number);
  const totalMinutes = baseHours * 60 + baseMinutes + hours * 60;
  const nextHours = Math.floor(totalMinutes / 60) % 24;
  const nextMinutes = totalMinutes % 60;

  return `${String(nextHours).padStart(2, '0')}:${String(nextMinutes).padStart(2, '0')}`;
}

function paymentReference() {
  const suffix =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replaceAll('-', '').slice(0, 18)
      : Date.now().toString(36);

  return `GLD-PAY-${suffix}`;
}

function paymentVerificationUrl(reference: string) {
  return `${getSiteUrl()}/payment/verify?reference=${encodeURIComponent(reference)}`;
}

function paymentRequestKey(input: CreateBookingInput, quote: BookingQuote) {
  const normalized = {
    asset_id: input.boat_id ?? input.beach_house_id ?? null,
    beach_house_booking_mode: input.beach_house_booking_mode ?? null,
    booking_type: input.booking_type,
    currency: quote.currency,
    customer_email: input.customer_email.trim().toLowerCase(),
    customer_phone: input.customer_phone?.replace(/\s+/g, '') ?? '',
    end_date: input.end_date,
    end_time: input.end_time ?? null,
    guest_count: input.guest_count ?? 1,
    hours: input.hours ?? null,
    parent_beach_house_booking_reference:
      input.parent_beach_house_booking_reference?.trim().toUpperCase() ?? null,
    quoted_amount: quote.totalAmount,
    rental_route_id: input.rental_route_id ?? null,
    rental_type: input.rental_type ?? null,
    start_date: input.start_date,
    start_time: input.start_time ?? null,
  };

  return createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
}

function parsePaystackMetadata(
  metadata: NonNullable<PaystackVerifyResponse['data']>['metadata'],
) {
  if (!metadata) return {};
  if (typeof metadata === 'object') return metadata;

  try {
    return JSON.parse(metadata) as {
      booking_input?: CreateBookingInput;
      quoted_amount?: number;
      quoted_currency?: string;
    };
  } catch {
    return {};
  }
}

function publicBookingRpcPayload(input: CreateBookingInput) {
  return {
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
    p_notes: input.notes ?? null,
    ...(input.parent_beach_house_booking_reference
      ? {
          p_parent_beach_house_booking_reference:
            input.parent_beach_house_booking_reference,
        }
      : {}),
  };
}

async function paystackFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getPaystackSecretKey()}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  const body = (await response.json().catch(() => null)) as T & {
    message?: string;
  };

  if (!response.ok) {
    throw new Error(body?.message ?? 'Paystack request failed.');
  }

  return body as T;
}

async function quoteBooking(input: CreateBookingInput): Promise<BookingQuote> {
  const supabase = getSupabaseServerClient();
  const guestCount = input.guest_count ?? 1;

  if (!input.customer_name?.trim() || !input.customer_email?.trim()) {
    throw new Error('Name and email are required.');
  }

  if (!input.customer_phone?.trim()) {
    throw new Error('Phone number is required.');
  }

  if (!input.start_date || !input.end_date) {
    throw new Error('Please choose valid booking dates.');
  }

  if (input.booking_type === 'boat_cruise') {
    const { data, error } = await supabase
      .from('boats')
      .select(
        'id, is_active, is_available_for_rental, max_booking_hours, max_guests, min_booking_hours, pickup_location, price_per_hour',
      )
      .eq('id', input.boat_id)
      .eq('is_active', true)
      .single();

    if (error || !data) throw new Error('That vessel is no longer available.');

    const boat = data as BoatQuoteRecord;
    const hours = Number(input.hours ?? 0);

    if (guestCount > (boat.max_guests ?? guestCount)) {
      throw new Error('The guest count exceeds this vessel capacity.');
    }

    if (
      !input.start_time ||
      !boat.price_per_hour ||
      hours < (boat.min_booking_hours ?? 1) ||
      (boat.max_booking_hours != null && hours > boat.max_booking_hours)
    ) {
      throw new Error('Please choose valid charter details.');
    }

    const endTime = addHours(input.start_time, hours);
    const { data: available, error: availabilityError } = await supabase.rpc(
      'check_public_availability',
      {
        p_resource_type: 'boat',
        p_resource_id: boat.id,
        p_start_date: input.start_date,
        p_end_date: input.start_date,
        p_start_time: input.start_time,
        p_end_time: endTime,
      },
    );

    if (availabilityError) throw new Error(availabilityError.message);
    if (!available) {
      throw new Error('That time is no longer available. Please select another option.');
    }

    return {
      currency: DEFAULT_CURRENCY,
      totalAmount: Number(boat.price_per_hour) * hours,
    };
  }

  if (input.booking_type === 'boat_rental') {
    const { data: boatData, error: boatError } = await supabase
      .from('boats')
      .select(
        'id, is_active, is_available_for_rental, max_booking_hours, max_guests, min_booking_hours, pickup_location, price_per_hour',
      )
      .eq('id', input.boat_id)
      .eq('is_active', true)
      .single();

    if (boatError || !boatData) {
      throw new Error('That vessel is no longer available.');
    }

    const boat = boatData as BoatQuoteRecord;

    if (boat.is_available_for_rental !== true) {
      throw new Error('That vessel is not available for transfers.');
    }

    const { data: routeData, error: routeError } = await supabase
      .from('transport_routes')
      .select('id, duration_hours, is_active, route_price')
      .eq('id', input.rental_route_id)
      .eq('is_active', true)
      .single();

    if (routeError || !routeData) {
      throw new Error('Please choose an available transfer route.');
    }

    if (!input.start_time || !input.rental_type) {
      throw new Error('Please choose valid transfer details.');
    }

    if (guestCount > (boat.max_guests ?? guestCount)) {
      throw new Error('The guest count exceeds this vessel capacity.');
    }

    const route = routeData as RouteQuoteRecord;
    const multiplier = input.rental_type === 'round_trip' ? 2 : 1;
    const hours = Number(route.duration_hours ?? 1) * multiplier;
    const endTime = input.end_time ?? addHours(input.start_time, hours);
    const { data: available, error: availabilityError } = await supabase.rpc(
      'check_public_availability',
      {
        p_resource_type: 'boat',
        p_resource_id: boat.id,
        p_start_date: input.start_date,
        p_end_date: input.end_date,
        p_start_time: input.start_time,
        p_end_time: endTime,
      },
    );

    if (availabilityError) throw new Error(availabilityError.message);
    if (!available) {
      throw new Error('That time is no longer available. Please select another option.');
    }

    return {
      currency: DEFAULT_CURRENCY,
      totalAmount: Number(route.route_price ?? 0) * multiplier,
    };
  }

  const { data, error } = await supabase
    .from('beach_houses')
    .select(
      'id, check_in_time, check_out_time, day_use_max_hours, day_use_min_hours, day_use_price_per_hour, extra_guest_fee_per_head, max_guests, price_per_night',
    )
    .eq('id', input.beach_house_id)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    throw new Error('That residence is no longer available.');
  }

  const house = data as BeachHouseQuoteRecord;
  const extraGuestCount = Math.max(0, guestCount - (house.max_guests ?? guestCount));
  const extraGuestCharge =
    extraGuestCount * Number(house.extra_guest_fee_per_head ?? 0);

  if (input.beach_house_booking_mode === 'day_use') {
    const hours = Number(input.hours ?? 0);

    if (
      !input.start_time ||
      !house.day_use_price_per_hour ||
      hours < (house.day_use_min_hours ?? 1) ||
      (house.day_use_max_hours != null && hours > house.day_use_max_hours)
    ) {
      throw new Error('Please choose valid day-use details.');
    }

    const endTime = addHours(input.start_time, hours);
    const { data: available, error: availabilityError } = await supabase.rpc(
      'check_public_availability',
      {
        p_resource_type: 'beach_house',
        p_resource_id: house.id,
        p_start_date: input.start_date,
        p_end_date: input.start_date,
        p_start_time: input.start_time,
        p_end_time: endTime,
      },
    );

    if (availabilityError) throw new Error(availabilityError.message);
    if (!available) {
      throw new Error('That time is no longer available. Please select another option.');
    }

    return {
      currency: DEFAULT_CURRENCY,
      totalAmount: Number(house.day_use_price_per_hour) * hours + extraGuestCharge,
    };
  }

  const nights = nightsBetween(input.start_date, input.end_date);

  if (!house.price_per_night || nights < 1) {
    throw new Error('An overnight stay needs valid dates and pricing.');
  }

  const { data: available, error: availabilityError } = await supabase.rpc(
    'check_public_availability',
    {
      p_resource_type: 'beach_house',
      p_resource_id: house.id,
      p_start_date: input.start_date,
      p_end_date: input.end_date,
      p_start_time: input.start_time ?? house.check_in_time,
      p_end_time: input.end_time ?? house.check_out_time,
    },
  );

  if (availabilityError) throw new Error(availabilityError.message);
  if (!available) {
    throw new Error('That time is no longer available. Please select another option.');
  }

  return {
    currency: DEFAULT_CURRENCY,
    totalAmount: Number(house.price_per_night) * nights + extraGuestCharge,
  };
}

export async function initializeBookingPayment(input: CreateBookingInput) {
  const quote = await quoteBooking(input);
  const amount = toSubunit(quote.totalAmount);

  if (amount <= 0) {
    throw new Error('This booking does not have a valid payable amount.');
  }

  const supabase = getSupabaseServerClient();
  const requestKey = paymentRequestKey(input, quote);
  const { data: previousAttempt, error: previousAttemptError } = await supabase
    .from('payment_attempts')
    .select(
      'authorization_url, booking_id, payment_reference, provider_status, status',
    )
    .eq('request_key', requestKey)
    .neq('status', 'abandoned')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (previousAttemptError) throw new Error(previousAttemptError.message);

  if (previousAttempt) {
    const attempt = previousAttempt as PaymentAttempt;
    return {
      access_code: '',
      authorization_url:
        attempt.status === 'initialized' && attempt.authorization_url
          ? attempt.authorization_url
          : paymentVerificationUrl(attempt.payment_reference),
      reference: attempt.payment_reference,
    };
  }

  const reference = paymentReference();
  const result = await paystackFetch<PaystackInitializeResponse>(
    '/transaction/initialize',
    {
      body: JSON.stringify({
        amount,
        callback_url: `${getSiteUrl()}/payment/verify`,
        currency: quote.currency,
        email: input.customer_email,
        metadata: JSON.stringify({
          booking_input: {
            ...input,
            total_amount: quote.totalAmount,
          },
          quoted_amount: quote.totalAmount,
          quoted_currency: quote.currency,
        }),
        reference,
      }),
      method: 'POST',
    },
  );

  if (!result.status || !result.data?.authorization_url) {
    throw new Error(result.message || 'Could not initialize payment.');
  }

  const { error: attemptError } = await supabase.from('payment_attempts').insert({
    authorization_url: result.data.authorization_url,
    booking_payload: input,
    currency: quote.currency,
    payment_reference: reference,
    provider_status: 'initialized',
    quoted_amount: quote.totalAmount,
    request_key: requestKey,
    status: 'initialized',
  });

  if (attemptError) {
    const { data: concurrentAttempt } = await supabase
      .from('payment_attempts')
      .select(
        'authorization_url, booking_id, payment_reference, provider_status, status',
      )
      .eq('request_key', requestKey)
      .eq('status', 'initialized')
      .maybeSingle();

    if (concurrentAttempt) {
      const attempt = concurrentAttempt as PaymentAttempt;
      return {
        access_code: '',
        authorization_url:
          attempt.authorization_url ??
          paymentVerificationUrl(attempt.payment_reference),
        reference: attempt.payment_reference,
      };
    }

    throw new Error(attemptError.message);
  }

  return result.data;
}

export async function verifyAndConfirmPayment(
  reference: string,
): Promise<PaymentConfirmation> {
  const normalizedReference = reference.trim();
  if (!normalizedReference) {
    return { ok: false, message: 'Payment reference is missing.' };
  }

  const result = await paystackFetch<PaystackVerifyResponse>(
    `/transaction/verify/${encodeURIComponent(normalizedReference)}`,
    { method: 'GET' },
  );

  if (!result.status || !result.data) {
    return {
      ok: false,
      message: result.message || 'Payment verification failed.',
    };
  }

  const metadata = parsePaystackMetadata(result.data.metadata);
  const input = metadata.booking_input;
  const quotedAmount = Number(metadata.quoted_amount ?? 0);
  const quotedCurrency = metadata.quoted_currency ?? DEFAULT_CURRENCY;
  const paid = result.data.status === 'success';
  const amountMatches = result.data.amount === toSubunit(quotedAmount);
  const currencyMatches = result.data.currency === quotedCurrency;

  if (!paid || !input || !amountMatches || !currencyMatches) {
    const supabase = getSupabaseServerClient();
    const paymentWasCaptured = paid;
    const validationError =
      'Paystack reported success, but the stored checkout details did not pass validation.';

    if (paymentWasCaptured) {
      await supabase.from('payment_attempts').upsert(
        {
          booking_payload: input ?? {},
          currency: result.data.currency,
          error_message: validationError,
          payment_reference: normalizedReference,
          provider_status: result.data.status,
          quoted_amount:
            quotedAmount > 0 ? quotedAmount : result.data.amount / 100,
          request_key: input
            ? paymentRequestKey(input, {
                currency: quotedCurrency,
                totalAmount: quotedAmount,
              })
            : createHash('sha256')
                .update(normalizedReference)
                .digest('hex'),
          status: 'requires_attention',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'payment_reference' },
      );
    } else {
      await supabase
        .from('payment_attempts')
        .update({
          error_message: null,
          provider_status: result.data.status,
          status:
            result.data.status === 'abandoned' ? 'abandoned' : 'initialized',
          updated_at: new Date().toISOString(),
        })
        .eq('payment_reference', normalizedReference);
    }

    return {
      ok: false,
      message: paymentWasCaptured
        ? 'Payment was received, but the booking needs manual confirmation. Please do not pay again; our team will contact you.'
        : 'Payment was not successful for this booking.',
      needsAttention: paymentWasCaptured,
      paymentReceived: paymentWasCaptured,
    };
  }

  const supabase = getSupabaseServerClient();
  const requestKey = paymentRequestKey(input, {
    currency: quotedCurrency,
    totalAmount: quotedAmount,
  });
  const { error: paidAttemptError } = await supabase
    .from('payment_attempts')
    .upsert(
      {
        booking_payload: input,
        currency: quotedCurrency,
        error_message: null,
        payment_reference: normalizedReference,
        provider_status: result.data.status,
        quoted_amount: quotedAmount,
        request_key: requestKey,
        status: 'paid',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'payment_reference' },
    );

  if (paidAttemptError) {
    return {
      ok: false,
      message:
        'Payment was received, but confirmation is temporarily delayed. Please do not pay again; our team will contact you.',
      needsAttention: true,
      paymentReceived: true,
    };
  }

  const { data: existing, error: existingError } = await supabase
    .from('bookings')
    .select('id, reference_code, status, payment_status, total_amount, currency')
    .eq('payment_reference', normalizedReference)
    .maybeSingle();

  if (existingError) {
    return {
      ok: false,
      message:
        'Payment was received, but confirmation is temporarily delayed. Please do not pay again; our team will contact you.',
      needsAttention: true,
      paymentReceived: true,
    };
  }

  if (existing) {
    await supabase
      .from('payment_attempts')
      .update({
        booking_id: existing.id,
        error_message: null,
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('payment_reference', normalizedReference);

    return {
      ok: true,
      message: 'Payment verified and booking confirmed.',
      paymentReceived: true,
      booking: {
        reference_code: existing.reference_code,
        status: existing.status,
        payment_status: existing.payment_status,
        total_amount: Number(existing.total_amount),
        currency: existing.currency,
      },
    };
  }

  const { data: created, error: createError } = await supabase.rpc(
    'confirm_public_booking_payment',
    {
      ...publicBookingRpcPayload(input),
      p_currency: quotedCurrency,
      p_expected_total: quotedAmount,
      p_payment_reference: normalizedReference,
    },
  );

  if (createError || !created) {
    await supabase
      .from('payment_attempts')
      .update({
        error_message: createError?.message ?? 'Booking could not be created.',
        status: 'requires_attention',
        updated_at: new Date().toISOString(),
      })
      .eq('payment_reference', normalizedReference);

    return {
      ok: false,
      message:
        'Payment was received, but the booking needs manual confirmation. Please do not pay again; our team will contact you.',
      needsAttention: true,
      paymentReceived: true,
    };
  }

  const updated = created as {
    id: string;
    reference_code: string;
    status: string;
    payment_status: string;
    total_amount: number;
    currency: string;
  };
  await supabase
    .from('payment_attempts')
    .update({
      booking_id: updated.id,
      error_message: null,
      status: 'confirmed',
      updated_at: new Date().toISOString(),
    })
    .eq('payment_reference', normalizedReference);

  return {
    ok: true,
    message: 'Payment verified and booking confirmed.',
    paymentReceived: true,
    booking: {
      reference_code: updated.reference_code,
      status: updated.status,
      payment_status: updated.payment_status,
      total_amount: Number(updated.total_amount),
      currency: updated.currency,
    },
  };
}
