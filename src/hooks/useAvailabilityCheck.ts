'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  checkAvailability,
  type AvailabilityParams,
} from '@/services/apiBooking';
import { fetchSettings } from '@/services/apiSettings';

export type AvailabilityState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'available' }
  | { status: 'unavailable' }
  | { status: 'error' }
  | { status: 'curfew'; curfewTime: string };

export function useAvailabilityCheck(
  params: AvailabilityParams | null,
): AvailabilityState {
  const enabled = Boolean(
    params &&
      params.resourceId &&
      params.startDate &&
      params.endDate &&
      params.startDate <= params.endDate,
  );

  const { data: settings } = useQuery({
    queryKey: ['app_settings'],
    queryFn: fetchSettings,
    staleTime: 5 * 60_000,
  });

  const curfewViolation = useMemo((): string | null => {
    if (!params || params.resourceType !== 'boat') return null;
    if (!settings?.boat_curfew_enabled || !settings.boat_curfew_time) {
      return null;
    }

    const bookingEndTime = params.endTime ?? params.startTime;
    if (!bookingEndTime) return null;

    const toMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const startMinutes = params.startTime ? toMinutes(params.startTime) : 0;
    const endMinutes = toMinutes(bookingEndTime);
    const effectiveEndMinutes =
      endMinutes < startMinutes ? endMinutes + 24 * 60 : endMinutes;

    return effectiveEndMinutes > toMinutes(settings.boat_curfew_time)
      ? settings.boat_curfew_time
      : null;
  }, [params, settings]);

  const { data, isFetching, isError } = useQuery({
    queryKey: ['availability', params],
    queryFn: () => checkAvailability(params!),
    enabled: enabled && !curfewViolation,
    staleTime: 60_000,
    gcTime: 2 * 60_000,
    retry: false,
  });

  if (!enabled) return { status: 'idle' };
  if (curfewViolation) return { status: 'curfew', curfewTime: curfewViolation };
  if (isFetching) return { status: 'checking' };
  if (isError) return { status: 'error' };
  if (!data) return { status: 'idle' };
  if (data.available) return { status: 'available' };

  return { status: 'unavailable' };
}
