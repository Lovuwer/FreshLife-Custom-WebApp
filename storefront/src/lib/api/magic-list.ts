import type { MagicListResult } from '@/lib/types/magic-list';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function analyzeText(text: string): Promise<MagicListResult> {
  const res = await fetch('/api/magic-list/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'text', content: text }),
  });
  return handleResponse<MagicListResult>(res);
}

export async function analyzeImage(imageBase64: string): Promise<MagicListResult> {
  const res = await fetch('/api/magic-list/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'image', content: imageBase64 }),
  });
  return handleResponse<MagicListResult>(res);
}
