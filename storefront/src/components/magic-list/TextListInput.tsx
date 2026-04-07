'use client';
import { useState } from 'react';
import styles from './TextListInput.module.css';

interface TextListInputProps {
  onAnalyze: (text: string) => void;
  isLoading: boolean;
}

export function TextListInput({ onAnalyze, isLoading }: TextListInputProps) {
  const [value, setValue] = useState('');

  return (
    <div className={styles.wrapper}>
      <textarea
        className={styles.textarea}
        placeholder={'Type your grocery list here...\n\nTomatoes 2kg\nMilk 1L\nRice 5kg'}
        value={value}
        onChange={e => setValue(e.target.value)}
        rows={8}
        disabled={isLoading}
        aria-label="Grocery list input"
        id="magic-list-text-input"
      />
      <button
        className={`btn-primary ${styles.analyzeBtn}`}
        onClick={() => onAnalyze(value)}
        disabled={isLoading || value.trim().length < 3}
      >
        {isLoading ? 'Analyzing...' : '✨ Analyze My List'}
      </button>
    </div>
  );
}
