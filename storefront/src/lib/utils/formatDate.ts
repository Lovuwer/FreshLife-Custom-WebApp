export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr));
}

export function formatTime(timeStr: string): string {
  const parts = timeStr.split(':');
  const hours = parts[0] ?? '0';
  const minutes = parts[1] ?? '00';
  const h = parseInt(hours, 10);
  if (isNaN(h)) return timeStr;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${displayH}:${minutes} ${suffix}`;
}

export function formatSlotRange(start: string, end: string): string {
  return `${formatTime(start)} - ${formatTime(end)}`;
}
