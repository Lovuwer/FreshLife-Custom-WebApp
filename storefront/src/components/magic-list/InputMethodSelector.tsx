'use client';
import styles from './InputMethodSelector.module.css';

export type InputMethod = 'text' | 'camera' | 'upload';

interface InputMethodSelectorProps {
  selected: InputMethod;
  onChange: (method: InputMethod) => void;
}

const METHODS: { id: InputMethod; label: string; emoji: string }[] = [
  { id: 'text',   label: 'Write',  emoji: '✍️' },
  { id: 'camera', label: 'Photo',  emoji: '📷' },
  { id: 'upload', label: 'Upload', emoji: '📤' },
];

export function InputMethodSelector({ selected, onChange }: InputMethodSelectorProps) {
  return (
    <div className={styles.wrapper} role="tablist" aria-label="Input method">
      {METHODS.map(m => (
        <button
          key={m.id}
          role="tab"
          aria-selected={selected === m.id}
          className={`${styles.tab} ${selected === m.id ? styles.active : ''}`}
          onClick={() => onChange(m.id)}
        >
          <span className={styles.emoji}>{m.emoji}</span>
          <span className={styles.label}>{m.label}</span>
        </button>
      ))}
    </div>
  );
}
