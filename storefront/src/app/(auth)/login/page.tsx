'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { PhoneInput } from '@/components/auth/PhoneInput';
import { OTPInput } from '@/components/auth/OTPInput';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/hooks/useAuth';
import styles from './page.module.css';

export default function LoginPage() {
  const router = useRouter();
  const { sendOTP, verifyOTP, otpSent, otpPhone } = useAuth();

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);

  const startResendTimer = () => {
    setResendCountdown(30);
    const interval = setInterval(() => {
      setResendCountdown((c) => {
        if (c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const handleSendOTP = async () => {
    if (phone.length !== 10) { setError('Enter a valid 10-digit number'); return; }
    setError('');
    setIsLoading(true);
    try {
      await sendOTP(phone);
      startResendTimer();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (otpValue?: string) => {
    const otpToVerify = otpValue || otp;
    if (otpToVerify.length !== 6) { setError('Enter the 6-digit OTP'); return; }
    setError('');
    setIsLoading(true);
    try {
      await verifyOTP(otpPhone || phone, otpToVerify);
      router.push('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Incorrect OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCountdown > 0) return;
    setOtp('');
    setError('');
    setIsLoading(true);
    try {
      await sendOTP(otpPhone || phone);
      startResendTimer();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.brand}>
        <span className={styles.brandName}>FreshLife</span>
        <span className={styles.brandTagline}>Fresh groceries, delivered fast</span>
      </div>

      <AnimatePresence mode="wait">
        {!otpSent ? (
          <motion.div
            key="phone"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className={styles.step}
          >
            <h1 className={styles.title}>Enter your phone number</h1>
            <p className={styles.subtitle}>We&apos;ll send you a 6-digit OTP to verify</p>
            <PhoneInput
              value={phone}
              onChange={setPhone}
              onSubmit={handleSendOTP}
              isLoading={isLoading}
              error={error}
            />
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleSendOTP}
              loading={isLoading}
              disabled={phone.length !== 10}
            >
              Send OTP
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="otp"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className={styles.step}
          >
            <h1 className={styles.title}>Enter OTP</h1>
            <p className={styles.subtitle}>
              Sent to <strong>+91 {otpPhone || phone}</strong>
            </p>
            <OTPInput
              value={otp}
              onChange={setOtp}
              onComplete={(val) => handleVerifyOTP(val)}
              error={error}
              isLoading={isLoading}
            />
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => handleVerifyOTP()}
              loading={isLoading}
              disabled={otp.length !== 6}
            >
              Verify OTP
            </Button>
            <div className={styles.resend}>
              {resendCountdown > 0 ? (
                <span className={styles.resendTimer}>Resend in {resendCountdown}s</span>
              ) : (
                <button className={styles.resendBtn} onClick={handleResend}>
                  Resend OTP
                </button>
              )}
            </div>
            <button className={styles.backBtn} onClick={() => { setOtp(''); setError(''); }}>
              ← Change number
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <p className={styles.terms}>
        By continuing, you agree to our{' '}
        <a href="/terms" className={styles.link}>Terms of Service</a> &{' '}
        <a href="/privacy" className={styles.link}>Privacy Policy</a>
      </p>
    </div>
  );
}
