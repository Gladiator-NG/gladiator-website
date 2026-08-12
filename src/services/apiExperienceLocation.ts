import getSupabaseClient from './supabase';

export interface ExperienceLocation {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
}

export async function getExperienceLocations(): Promise<ExperienceLocation[]> {
  const { data, error } = await getSupabaseClient()
    .from('experience_locations')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as ExperienceLocation[];
}

