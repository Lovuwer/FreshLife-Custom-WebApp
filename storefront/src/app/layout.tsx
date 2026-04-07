import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/lib/providers';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { FloatingCart } from '@/components/layout/FloatingCart';
import { ToastContainer } from '@/components/ui/ToastContainer';

export const metadata: Metadata = {
  title: 'FreshLife — Fresh Groceries Delivered',
  description: 'Order fresh groceries online with fast delivery. AI-powered Magic List.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Header />
          <main
            style={{
              minHeight: '100dvh',
              maxWidth: 'var(--max-content-width)',
              margin: '0 auto',
              paddingTop: 'var(--header-height)',
              paddingRight: 'var(--space-md)',
              paddingBottom: 'calc(var(--bottom-nav-height) + var(--floating-cart-height) + var(--space-md))',
              paddingLeft: 'var(--space-md)',
            }}
          >
            {children}
          </main>
          <FloatingCart />
          <BottomNav />
          <ToastContainer />
        </Providers>
      </body>
    </html>
  );
}
