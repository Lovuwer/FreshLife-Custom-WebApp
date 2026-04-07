'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import styles from './SupportForm.module.css';

interface SupportFormProps {
  onSubmit: (data: { subject: string; description: string; category: string }) => void;
  isLoading?: boolean;
}

const CATEGORIES = ['Order Issue', 'Payment Issue', 'Delivery Issue', 'Product Quality', 'Refund', 'Other'];

export function SupportForm({ onSubmit, isLoading }: SupportFormProps) {
  const [form, setForm] = useState({ subject: '', description: '', category: CATEGORIES[0] });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.description.trim()) return;
    onSubmit(form);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <select
        className={styles.select}
        value={form.category}
        onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
      >
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <input
        className={styles.input}
        placeholder="Subject"
        value={form.subject}
        onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
        required
      />

      <textarea
        className={styles.textarea}
        placeholder="Describe your issue in detail..."
        value={form.description}
        onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
        rows={5}
        required
      />

      <Button variant="primary" type="submit" fullWidth loading={isLoading}>
        Submit Ticket
      </Button>
    </form>
  );
}
