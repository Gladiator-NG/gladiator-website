import getSupabaseClient from './supabase';

export interface AppSettings {
  boat_curfew_time: string | null;
  boat_curfew_enabled: boolean;
  boat_curfew_reopen_time: string;
  booking_whatsapp_number: string;
}

const DEFAULTS: AppSettings = {
  boat_curfew_time: null,
  boat_curfew_enabled: true,
  boat_curfew_reopen_time: '08:00',
  booking_whatsapp_number: '2348000000000',
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
    if (row.key === 'boat_curfew_reopen_time') {
      result.boat_curfew_reopen_time = row.value || DEFAULTS.boat_curfew_reopen_time;
    }
    if (row.key === 'booking_whatsapp_number') {
      result.booking_whatsapp_number =
        row.value || DEFAULTS.booking_whatsapp_number;
    }
  }

  return result;
}
