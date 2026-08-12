'use client';

import { useQuery } from '@tanstack/react-query';
import { getExperienceLocations } from '@/services/apiExperienceLocation';

export function useExperienceLocations() {
  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['experience_locations'],
    queryFn: getExperienceLocations,
  });

  return { experienceLocations: data, isLoading, error };
}

