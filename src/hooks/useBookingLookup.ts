'use client';

import { useMutation } from '@tanstack/react-query';
import { lookupBooking } from '@/services/apiBooking';
import type {
  BookingLookupInput,
  BookingLookupResult,
} from '@/services/apiBooking';

export function useBookingLookup() {
  const { mutateAsync: lookupAsync, data, isPending, error, reset } =
    useMutation<BookingLookupResult | null, Error, BookingLookupInput>({
      mutationFn: lookupBooking,
    });

  return { lookupAsync, booking: data ?? null, isPending, error, reset };
}
