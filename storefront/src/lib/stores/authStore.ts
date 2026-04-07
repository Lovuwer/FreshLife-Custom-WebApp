import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Customer } from '@/lib/types/auth';

interface AuthState {
  token: string | null;
  customer: Customer | null;
  isAuthenticated: boolean;
  otpSent: boolean;
  otpPhone: string | null;
  otpExpiresAt: number | null;

  setOTPSent: (phone: string, expiresIn: number) => void;
  login: (token: string, customer: Customer) => void;
  logout: () => void;
  updateCustomer: (customer: Partial<Customer>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      customer: null,
      isAuthenticated: false,
      otpSent: false,
      otpPhone: null,
      otpExpiresAt: null,

      setOTPSent: (phone, expiresIn) =>
        set({
          otpSent: true,
          otpPhone: phone,
          otpExpiresAt: Date.now() + expiresIn * 1000,
        }),

      login: (token, customer) =>
        set({
          token,
          customer,
          isAuthenticated: true,
          otpSent: false,
          otpPhone: null,
          otpExpiresAt: null,
        }),

      logout: () =>
        set({
          token: null,
          customer: null,
          isAuthenticated: false,
          otpSent: false,
          otpPhone: null,
          otpExpiresAt: null,
        }),

      updateCustomer: (partial) => {
        const current = get().customer;
        if (!current) return;
        set({ customer: { ...current, ...partial } });
      },
    }),
    {
      name: 'freshlife-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        customer: state.customer,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
