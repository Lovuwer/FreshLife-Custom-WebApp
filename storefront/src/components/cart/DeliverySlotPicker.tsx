'use client';
import { useState } from 'react';
import type { DeliverySlotsResponse, DeliverySlot } from '@/lib/types/delivery';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatSlotRange } from '@/lib/utils/formatDate';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import styles from './DeliverySlotPicker.module.css';

interface DeliverySlotPickerProps {
  data: DeliverySlotsResponse | null;
  selectedSlot: string | null;
  onSelect: (slotName: string) => void;
  isLoading: boolean;
}

export function DeliverySlotPicker({ data, selectedSlot, onSelect, isLoading }: DeliverySlotPickerProps) {
  const dates = data ? Object.keys(data.slots).sort() : [];
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const currentDate = activeDate ?? dates[0] ?? null;

  if (isLoading) {
    return (
      <div className={styles.section}>
        <p className={styles.heading}>Choose Delivery Time</p>
        <Skeleton variant="rect" height={40} />
        <div className={styles.slotsGrid}>
          {[1,2,3,4].map((i) => <Skeleton key={i} variant="rect" height={64} />)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const slots: DeliverySlot[] = currentDate ? (data.slots[currentDate] ?? []) : [];

  const formatDate = (d: string) => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    if (d === today) return 'Today';
    if (d === tomorrow) return 'Tomorrow';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <div className={styles.section}>
      <p className={styles.heading}>Choose Delivery Time</p>
      {data.express_available && (
        <div
          className={`${styles.expressSlot} ${selectedSlot === 'express' ? styles.slotSelected : ''}`}
          onClick={() => onSelect('express')}
        >
          <span className={styles.expressLabel}>⚡ Express ({data.express_eta_minutes} min)</span>
          <span className={styles.slotFee}>{formatCurrency(data.express_fee)}</span>
        </div>
      )}
      <div className={styles.dateTabs}>
        {dates.map((d) => (
          <button
            key={d}
            className={`${styles.dateTab} ${currentDate === d ? styles.dateTabActive : ''}`}
            onClick={() => setActiveDate(d)}
          >
            {formatDate(d)}
          </button>
        ))}
      </div>
      <div className={styles.slotsGrid}>
        {slots.map((slot) => (
          <div
            key={slot.name}
            className={`${styles.slot} ${selectedSlot === slot.name ? styles.slotSelected : ''} ${!slot.available ? styles.slotUnavailable : ''}`}
            onClick={() => slot.available && onSelect(slot.name)}
          >
            <span className={styles.slotTime}>{formatSlotRange(slot.start_time, slot.end_time)}</span>
            <span className={styles.slotFee}>{slot.delivery_fee === 0 ? 'FREE' : formatCurrency(slot.delivery_fee)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
