'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchSettings } from '@/services/apiSettings';

export function useSettings() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['app_settings'],
    queryFn: fetchSettings,
    staleTime: 5 * 60_000,
  });

  return {
    settings: data ?? null,
    isLoading,
    error,
  };
}
