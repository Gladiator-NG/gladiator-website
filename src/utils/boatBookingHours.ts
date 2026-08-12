interface BoatBookingWindow {
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  opensAt: string;
  closesAt: string;
}

function toMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function isWithinOnlineBoatBookingHours({
  startDate,
  endDate,
  startTime,
  endTime,
  opensAt,
  closesAt,
}: BoatBookingWindow) {
  if (!startTime || !endTime) return true;

  const opens = toMinutes(opensAt);
  const closes = toMinutes(closesAt);
  const starts = toMinutes(startTime);
  const ends = toMinutes(endTime);

  if (opens >= closes) return true;
  if (starts < opens || starts > closes || ends < opens || ends > closes) {
    return false;
  }

  return startDate !== endDate || ends >= starts;
}

export function formatBookingTime(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

