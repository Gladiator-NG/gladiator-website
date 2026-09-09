export const BOOKING_NOTICE_MESSAGE =
  'Bookings require at least 2 hours’ notice. Please choose a later start time (Lagos time).';
export const BEACH_HOUSE_NOTICE_MESSAGE =
  'Beach house bookings require at least 24 hours’ notice. For same-day bookings, please contact the Gladiator team on WhatsApp.';

export function hasMinimumBookingNotice(
  startDate: string,
  startTime: string | null | undefined,
  noticeHours = 2,
  now = Date.now(),
): boolean {
  if (!startTime) return false;
  const startsAt = Date.parse(`${startDate}T${startTime}+01:00`);
  return Number.isFinite(startsAt) && startsAt - now >= noticeHours * 60 * 60 * 1000;
}
