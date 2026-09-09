export const BOOKING_NOTICE_MESSAGE =
  'Bookings require at least 2 hours’ notice. Please choose a later start time (Lagos time).';

export function hasMinimumBookingNotice(
  startDate: string,
  startTime: string | null | undefined,
  now = Date.now(),
): boolean {
  if (!startTime) return false;
  const startsAt = Date.parse(`${startDate}T${startTime}+01:00`);
  return Number.isFinite(startsAt) && startsAt - now >= 2 * 60 * 60 * 1000;
}
