'use client';

import { useQuery } from '@tanstack/react-query';
import { getBeachHouse, getBeachHouses } from '@/services/apiBeachHouse';

export function useBeachHouses() {
  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['beach_houses'],
    queryFn: getBeachHouses,
  });

  return { beachHouses: data, isLoading, error };
}

export function useBeachHouse(slug: string | undefined) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['beach_house', slug],
    queryFn: () => getBeachHouse(slug!),
    enabled: Boolean(slug),
  });

  return { beachHouse: data ?? null, isLoading, error };
}
