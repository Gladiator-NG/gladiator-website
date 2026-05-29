import getSupabaseClient from './supabase';

export interface AppSettings {
  boat_curfew_time: string | null;
  boat_curfew_enabled: boolean;
}

const DEFAULTS: AppSettings = {
  boat_curfew_time: null,
  boat_curfew_enabled: true,
};

export async function fetchSettings(): Promise<AppSettings> {
  const { data, error } = await getSupabaseClient()
    .from('app_settings')
    .select('key, value');

  if (error) return { ...DEFAULTS };

  const result = { ...DEFAULTS };

  for (const row of data ?? []) {
    if (row.key === 'boat_curfew_time') {
      result.boat_curfew_time = row.value || null;
    }

    if (row.key === 'boat_curfew_enabled') {
      result.boat_curfew_enabled = row.value === 'true';
    }
  }

  return result;
}
