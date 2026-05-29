'use client';

import { useQuery } from '@tanstack/react-query';
import { getBoat, getBoats, getRentalBoats } from '@/services/apiBoat';

export function useBoats() {
  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['boats'],
    queryFn: getBoats,
  });

  return { boats: data, isLoading, error };
}

export function useRentalBoats() {
  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['rental_boats'],
    queryFn: getRentalBoats,
  });

  return { boats: data, isLoading, error };
}

export function useBoat(slug: string | undefined) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['boat', slug],
    queryFn: () => getBoat(slug!),
    enabled: Boolean(slug),
  });

  return { boat: data ?? null, isLoading, error };
}
