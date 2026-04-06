'use client';
import { useRef, KeyboardEvent, ClipboardEvent } from 'react';
import styles from './OTPInput.module.css';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  error?: string;
  isLoading?: boolean;
}

export function OTPInput({
  length = 6,
  value,
  onChange,
  onComplete,
  error,
  isLoading,
}: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.split('').concat(Array(length).fill('')).slice(0, length);

  const handleChange = (index: number, char: string) => {
    const digit = char.replace(/\D/g, '').slice(-1);
    const next = digits.map((d, i) => (i === index ? digit : d));
    const newValue = next.join('');
    onChange(newValue);
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    if (newValue.length === length && !newValue.includes('')) {
      onComplete?.(newValue);
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
        const next = digits.map((d, i) => (i === index - 1 ? '' : d));
        onChange(next.join(''));
      } else {
        const next = digits.map((d, i) => (i === index ? '' : d));
        onChange(next.join(''));
      }
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pasted);
    const focusIndex = Math.min(pasted.length, length - 1);
    inputRefs.current[focusIndex]?.focus();
    if (pasted.length === length) onComplete?.(pasted);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.boxes}>
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            disabled={isLoading}
            className={`${styles.box} ${digit ? styles.filled : ''} ${error ? styles.hasError : ''}`}
            aria-label={`OTP digit ${i + 1}`}
          />
        ))}
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
