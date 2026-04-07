'use client';
import { useState } from 'react';
import Link from 'next/link';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AddressCard } from '@/components/account/AddressCard';
import { AddressForm } from '@/components/account/AddressForm';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useAddresses, useAddAddress, useDeleteAddress } from '@/lib/hooks/useAddresses';
import type { Address } from '@/lib/types/account';
import styles from './page.module.css';

export default function AddressesPage() {
  const { data: addresses, isLoading } = useAddresses();
  const addMutation = useAddAddress();
  const deleteMutation = useDeleteAddress();
  const [showForm, setShowForm] = useState(false);

  return (
    <AuthGuard>
      <div className={styles.page}>
        <div className={styles.header}>
          <Link href="/account" className={styles.back}>← Back</Link>
          <h1 className={styles.title}>📍 Addresses</h1>
          <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>+ Add</Button>
        </div>

        {isLoading && (
          <div className={styles.skeletons}>
            {[1, 2].map((i) => (
              <Skeleton key={i} variant="rect" height={120} borderRadius="var(--radius-lg)" />
            ))}
          </div>
        )}

        {!isLoading && (!addresses || addresses.length === 0) && (
          <EmptyState
            icon={<span style={{ fontSize: '3rem' }}>📍</span>}
            title="No addresses saved"
            description="Add an address for delivery"
            action={<Button variant="primary" onClick={() => setShowForm(true)}>Add Address</Button>}
          />
        )}

        {addresses && addresses.length > 0 && (
          <div className={styles.list}>
            {addresses.map((addr) => (
              <AddressCard
                key={addr.name}
                address={addr}
                onDelete={() => deleteMutation.mutate(addr.name)}
              />
            ))}
          </div>
        )}

        <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Add Address">
          <AddressForm
            onSubmit={(data) => {
              addMutation.mutate(data, {
                onSuccess: () => setShowForm(false),
              });
            }}
            onCancel={() => setShowForm(false)}
            isLoading={addMutation.isPending}
          />
        </Modal>
      </div>
    </AuthGuard>
  );
}
