'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  checkAvailability,
  type AvailabilityParams,
} from '@/services/apiBooking';
import { fetchSettings } from '@/services/apiSettings';
import { isWithinOnlineBoatBookingHours } from '@/utils/boatBookingHours';

export type AvailabilityState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'available' }
  | { status: 'unavailable' }
  | { status: 'error' }
  | {
      status: 'curfew';
      curfewTime: string;
      reopenTime: string;
      whatsappNumber: string;
    };

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

  const curfewViolation = useMemo(() => {
    if (!params || params.resourceType !== 'boat') return null;
    if (!settings?.boat_curfew_enabled || !settings.boat_curfew_time) {
      return null;
    }

    const withinHours = isWithinOnlineBoatBookingHours({
      startDate: params.startDate,
      endDate: params.endDate,
      startTime: params.startTime ?? null,
      endTime: params.endTime ?? params.startTime ?? null,
      opensAt: settings.boat_curfew_reopen_time,
      closesAt: settings.boat_curfew_time,
    });

    return withinHours
      ? null
      : {
          curfewTime: settings.boat_curfew_time,
          reopenTime: settings.boat_curfew_reopen_time,
          whatsappNumber: settings.booking_whatsapp_number,
        };
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
  if (curfewViolation) return { status: 'curfew', ...curfewViolation };
  if (isFetching) return { status: 'checking' };
  if (isError) return { status: 'error' };
  if (!data) return { status: 'idle' };
  if (data.available) return { status: 'available' };

  return { status: 'unavailable' };
}
