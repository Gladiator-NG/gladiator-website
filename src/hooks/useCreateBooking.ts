'use client';

import { useMutation } from '@tanstack/react-query';
import { createBooking } from '@/services/apiBooking';
import type {
  BookingConfirmation,
  CreateBookingInput,
} from '@/services/apiBooking';

export function useCreateBooking() {
  const { mutate: create, mutateAsync: createAsync, isPending, error } =
    useMutation<BookingConfirmation, Error, CreateBookingInput>({
      mutationFn: createBooking,
    });

  return { create, createAsync, isPending, error };
}
