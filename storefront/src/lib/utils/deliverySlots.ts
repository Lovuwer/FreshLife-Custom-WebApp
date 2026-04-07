/**
 * Client-side delivery slot filtering utilities.
 *
 * Filters server-returned delivery slots:
 * 1. Express — available only if current time + prep window allows it
 * 2. Scheduled — hide past time windows for today
 * 3. Capacity — hide slots at max capacity (remainingCapacity === 0)
 * 4. Returns only days that still have available slots
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
 * 1. Express — available only if current time + 15 min prep window allows it
 * 2. Scheduled — hide past time windows for today
 * 3. Capacity — hide slots at max capacity (remainingCapacity === 0)
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
