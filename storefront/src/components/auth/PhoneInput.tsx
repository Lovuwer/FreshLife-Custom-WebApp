'use client';
import { useState, KeyboardEvent } from 'react';
import styles from './PhoneInput.module.css';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
  error?: string;
}

export function PhoneInput({ value, onChange, onSubmit, isLoading, error }: PhoneInputProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onSubmit();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 10);
    onChange(v);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.inputRow}>
        <span className={styles.countryCode}>+91</span>
        <input
          type="tel"
          inputMode="numeric"
          maxLength={10}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Enter 10-digit number"
          disabled={isLoading}
          className={styles.input}
          aria-label="Phone number"
        />
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
