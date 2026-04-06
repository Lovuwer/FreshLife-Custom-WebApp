'use client';
import { useState } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Button } from '@/components/ui/Button';
import styles from './page.module.css';

type InputMode = 'text' | 'photo' | 'upload';

export default function MagicListPage() {
  const [mode, setMode] = useState<InputMode>('text');
  const [text, setText] = useState('');

  return (
    <AuthGuard>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>✨ Magic List</h1>
          <p className={styles.subtitle}>
            Type or photograph your grocery list — AI matches it to our inventory
          </p>
        </div>

        <div className={styles.modeTabs}>
          {(['text', 'photo', 'upload'] as InputMode[]).map((m) => (
            <button
              key={m}
              className={`${styles.modeTab} ${mode === m ? styles.modeTabActive : ''}`}
              onClick={() => setMode(m)}
            >
              {m === 'text' ? '✍️ Write' : m === 'photo' ? '📷 Photo' : '📤 Upload'}
            </button>
          ))}
        </div>

        {mode === 'text' && (
          <div className={styles.inputSection}>
            <textarea
              className={styles.textarea}
              placeholder={'Type your grocery list here...\n\nTomatoes 2kg\nMilk 1L\nRice basmati 5kg\nOnions'}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
            />
            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled
            >
              ✨ Analyze My List (Coming Soon)
            </Button>
          </div>
        )}

        {mode === 'photo' && (
          <div className={styles.placeholder}>
            <span className={styles.placeholderIcon}>📷</span>
            <p className={styles.placeholderText}>Camera capture coming in Phase 5</p>
          </div>
        )}

        {mode === 'upload' && (
          <div className={styles.placeholder}>
            <span className={styles.placeholderIcon}>📤</span>
            <p className={styles.placeholderText}>File upload coming in Phase 5</p>
          </div>
        )}

        <div className={styles.howItWorks}>
          <h2 className={styles.howTitle}>How it works</h2>
          <div className={styles.steps}>
            {['Write or photograph your grocery list', 'AI extracts and matches items', 'Review matches and add all to cart'].map((step, i) => (
              <div key={i} className={styles.step}>
                <span className={styles.stepNum}>{i + 1}</span>
                <span className={styles.stepText}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
