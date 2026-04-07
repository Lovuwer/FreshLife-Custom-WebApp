import type { Address, Refund, SupportTicket } from '@/lib/types/account';
import type { Customer } from '@/lib/types/auth';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// Profile
export async function getProfile(): Promise<Customer> {
  const res = await fetch('/api/account/profile');
  return handleResponse<Customer>(res);
}

export async function updateProfile(data: Partial<Customer>): Promise<Customer> {
  const res = await fetch('/api/account/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<Customer>(res);
}

// Addresses
export async function getAddresses(): Promise<Address[]> {
  const res = await fetch('/api/account/addresses');
  return handleResponse<Address[]>(res);
}

export async function addAddress(address: Omit<Address, 'name'>): Promise<Address> {
  const res = await fetch('/api/account/addresses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(address),
  });
  return handleResponse<Address>(res);
}

export async function updateAddress(name: string, address: Partial<Address>): Promise<Address> {
  const res = await fetch('/api/account/addresses', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, ...address }),
  });
  return handleResponse<Address>(res);
}

export async function deleteAddress(name: string): Promise<void> {
  await fetch('/api/account/addresses', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
}

// Refunds
export async function getRefunds(): Promise<Refund[]> {
  const res = await fetch('/api/account/refunds');
  return handleResponse<Refund[]>(res);
}

// Support
export async function createSupportTicket(data: {
  subject: string;
  description: string;
  category: string;
}): Promise<SupportTicket> {
  const res = await fetch('/api/account/support', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<SupportTicket>(res);
}

export async function getSupportTickets(): Promise<SupportTicket[]> {
  const res = await fetch('/api/account/support');
  return handleResponse<SupportTicket[]>(res);
}
