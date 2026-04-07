'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { Address } from '@/lib/types/account';
import styles from './AddressForm.module.css';

interface AddressFormProps {
  initial?: Partial<Address>;
  onSubmit: (data: Omit<Address, 'name'>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function AddressForm({ initial, onSubmit, onCancel, isLoading }: AddressFormProps) {
  const [form, setForm] = useState({
    address_title: initial?.address_title || '',
    address_line1: initial?.address_line1 || '',
    address_line2: initial?.address_line2 || '',
    city: initial?.city || '',
    state: initial?.state || '',
    pincode: initial?.pincode || '',
    phone: initial?.phone || '',
    address_label: (initial?.address_label || 'Home') as Address['address_label'],
    delivery_instructions: initial?.delivery_instructions || '',
    is_primary_address: initial?.is_primary_address || false,
    latitude: initial?.latitude || null,
    longitude: initial?.longitude || null,
    google_place_id: initial?.google_place_id || null,
  });

  const update = (key: string, value: string | boolean | null) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.labelGroup}>
        {(['Home', 'Work', 'Other'] as const).map((label) => (
          <button
            key={label}
            type="button"
            className={`${styles.labelChip} ${form.address_label === label ? styles.labelActive : ''}`}
            onClick={() => update('address_label', label)}
          >
            {label === 'Home' ? '🏠' : label === 'Work' ? '🏢' : '📍'} {label}
          </button>
        ))}
      </div>

      <input
        className={styles.input}
        placeholder="Address Title (e.g. My Home)"
        value={form.address_title}
        onChange={(e) => update('address_title', e.target.value)}
        required
      />

      <input
        className={styles.input}
        placeholder="Address Line 1"
        value={form.address_line1}
        onChange={(e) => update('address_line1', e.target.value)}
        required
      />

      <input
        className={styles.input}
        placeholder="Address Line 2 (optional)"
        value={form.address_line2 || ''}
        onChange={(e) => update('address_line2', e.target.value)}
      />

      <div className={styles.row}>
        <input
          className={styles.input}
          placeholder="City"
          value={form.city}
          onChange={(e) => update('city', e.target.value)}
          required
        />
        <input
          className={styles.input}
          placeholder="State"
          value={form.state}
          onChange={(e) => update('state', e.target.value)}
          required
        />
      </div>

      <div className={styles.row}>
        <input
          className={styles.input}
          placeholder="Pincode"
          value={form.pincode}
          onChange={(e) => update('pincode', e.target.value)}
          pattern="[0-9]{6}"
          maxLength={6}
          required
        />
        <input
          className={styles.input}
          placeholder="Phone"
          value={form.phone || ''}
          onChange={(e) => update('phone', e.target.value)}
        />
      </div>

      <textarea
        className={styles.textarea}
        placeholder="Delivery Instructions (optional)"
        value={form.delivery_instructions || ''}
        onChange={(e) => update('delivery_instructions', e.target.value)}
        rows={2}
      />

      <label className={styles.checkbox}>
        <input
          type="checkbox"
          checked={form.is_primary_address}
          onChange={(e) => update('is_primary_address', e.target.checked)}
        />
        Set as primary address
      </label>

      <div className={styles.actions}>
        <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" type="submit" loading={isLoading}>
          {initial ? 'Update' : 'Add'} Address
        </Button>
      </div>
    </form>
  );
}
