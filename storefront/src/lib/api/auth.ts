import type { OTPResponse, VerifyOTPResponse, SessionResponse } from '@/lib/types/auth';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function sendOTP(phone: string): Promise<OTPResponse> {
  const res = await fetch('/api/auth/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  return handleResponse<OTPResponse>(res);
}

export async function verifyOTP(phone: string, otp: string): Promise<VerifyOTPResponse> {
  const res = await fetch('/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, otp }),
  });
  return handleResponse<VerifyOTPResponse>(res);
}

export async function getSession(): Promise<SessionResponse> {
  const res = await fetch('/api/auth/session');
  return handleResponse<SessionResponse>(res);
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/session', { method: 'DELETE' });
}
