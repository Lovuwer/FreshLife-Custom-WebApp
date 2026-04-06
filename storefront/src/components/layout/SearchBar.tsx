'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useSearchProducts } from '@/lib/hooks/useProducts';
import { useLocationStore } from '@/lib/stores/locationStore';
import { useCartStore } from '@/lib/stores/cartStore';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import styles from './SearchBar.module.css';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const { currentLocation } = useLocationStore();
  const addItem = useCartStore((s) => s.addItem);
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useSearchProducts(debouncedQuery, currentLocation?.warehouse ?? undefined);
  const results = data?.results ?? [];

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const handleSelect = (itemCode: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(`/product/${encodeURIComponent(itemCode)}`);
  };

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <div className={styles.inputRow}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          type="search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search for groceries..."
          className={styles.input}
          aria-label="Search products"
        />
        {query && (
          <button className={styles.clearBtn} onClick={() => { setQuery(''); setIsOpen(false); }}>✕</button>
        )}
      </div>
      {isOpen && query.length >= 2 && (
        <div className={styles.dropdown}>
          {isLoading && <p className={styles.loadingText}>Searching…</p>}
          {!isLoading && results.length === 0 && (
            <p className={styles.emptyText}>No results for &quot;{query}&quot;</p>
          )}
          {results.map((product) => (
            <div key={product.item_code} className={styles.resultItem} onClick={() => handleSelect(product.item_code)}>
              <div className={styles.resultImage}>
                {product.image ? (
                  <Image src={product.image} alt={product.item_name} fill sizes="40px" className={styles.img} />
                ) : <span>🛒</span>}
              </div>
              <div className={styles.resultInfo}>
                <p className={styles.resultName}>{product.item_name}</p>
                <p className={styles.resultPrice}>{formatCurrency(product.standard_rate)}</p>
              </div>
              <button
                className={styles.addBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  addItem({
                    item_code: product.item_code,
                    item_name: product.item_name,
                    quantity: 1,
                    rate: product.standard_rate,
                    image: product.image,
                    max_qty: 20,
                    in_stock: product.in_stock,
                  });
                }}
                disabled={!product.in_stock}
              >
                {product.in_stock ? '+' : '✗'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
