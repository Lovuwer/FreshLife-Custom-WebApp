'use client';
import { useState, useCallback, useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/authStore';
import { sendOTP, verifyOTP, getSession, logout as apiLogout } from '@/lib/api/auth';

export function useAuth() {
  const store = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (store.isAuthenticated) {
      setIsLoading(false);
      return;
    }
    getSession()
      .then((data) => {
        if (store.token) {
          store.login(store.token, data.customer);
        }
      })
      .catch(() => {
        /* not authenticated */
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendOTP = useCallback(
    async (phone: string) => {
      const data = await sendOTP(phone);
      store.setOTPSent(phone, data.expires_in);
      return data;
    },
    [store]
  );

  const handleVerifyOTP = useCallback(
    async (phone: string, otp: string) => {
      const data = await verifyOTP(phone, otp);
      store.login(data.token, data.customer);
      return data;
    },
    [store]
  );

  const handleLogout = useCallback(async () => {
    await apiLogout();
    store.logout();
  }, [store]);

  return {
    customer: store.customer,
    isAuthenticated: store.isAuthenticated,
    isLoading,
    otpSent: store.otpSent,
    otpPhone: store.otpPhone,
    sendOTP: handleSendOTP,
    verifyOTP: handleVerifyOTP,
    logout: handleLogout,
  };
}
