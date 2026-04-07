/**
 * Client-side delivery slot filtering utilities.
 *
 * Filters server-returned delivery slots:
 * 1. Hide unavailable or fully-booked slots
 * 2. Hide past time windows for today (compares slot endTime to current time)
 * 3. Returns only days that still have available slots
 *
 * @see backend_database_architecture.md §4.2 — Delivery Slot DocType
 */

export interface DeliverySlot {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  type: 'Express' | 'Scheduled' | 'Same Day';
  fee: number;
  available: boolean;
  remainingCapacity: number;
}

export interface SlotAvailability {
  date: string;
  slots: DeliverySlot[];
}

function formatDateYMD(date: Date): string {
  return date.toISOString().split('T')[0];
}

function parseTime(timeStr: string, baseDate: Date): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const d = new Date(baseDate);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

/**
 * Filters delivery slots based on current time:
 * 1. Availability — hide slots marked as unavailable
 * 2. Capacity — hide slots at max capacity (remainingCapacity === 0)
 * 3. Today's slots — hide past time windows for today (compares slot endTime to now)
 * 4. Returns only days that still have available slots
 */
export function filterAvailableSlots(
  serverSlots: SlotAvailability[],
  currentTime: Date = new Date()
): SlotAvailability[] {
  const todayStr = formatDateYMD(currentTime);

  return serverSlots
    .map(day => ({
      ...day,
      slots: day.slots.filter(slot => {
        if (!slot.available || slot.remainingCapacity === 0) return false;
        if (day.date === todayStr) {
          const slotEnd = parseTime(slot.endTime, currentTime);
          return slotEnd > currentTime;
        }
        return true;
      }),
    }))
    .filter(day => day.slots.length > 0);
}
