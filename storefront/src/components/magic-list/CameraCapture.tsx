'use client';
import { useRef } from 'react';
import styles from './CameraCapture.module.css';
import { optimizeImageForUpload } from '@/lib/utils/imageOptimize';

interface CameraCaptureProps {
  mode: 'camera' | 'upload';
  onCapture: (base64: string, mimeType: string) => void;
  isLoading: boolean;
}

export function CameraCapture({ mode, onCapture, isLoading }: CameraCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const base64 = await optimizeImageForUpload(file);
    onCapture(base64, 'image/jpeg');
  };

  return (
    <div className={styles.wrapper}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture={mode === 'camera' ? 'environment' : undefined}
        className={styles.hiddenInput}
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
        id="camera-capture-input"
      />
      <button
        className={`btn-primary ${styles.captureBtn}`}
        onClick={() => inputRef.current?.click()}
        disabled={isLoading}
      >
        {mode === 'camera' ? '📷 Take Photo' : '📤 Choose Image'}
      </button>
      <p className={styles.hint}>
        {mode === 'camera'
          ? 'Photograph your handwritten grocery list'
          : 'Upload a photo or scan of your list'}
      </p>
    </div>
  );
}
