'use client';
import { useState, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Button } from '@/components/ui/Button';
import { AnalysisLoader } from '@/components/magic-list/AnalysisLoader';
import { MatchedItemsList } from '@/components/magic-list/MatchedItemsList';
import { UnmatchedItems } from '@/components/magic-list/UnmatchedItems';
import { AddAllToCart } from '@/components/magic-list/AddAllToCart';
import { useMagicList } from '@/lib/hooks/useMagicList';
import styles from './page.module.css';

type InputMode = 'text' | 'photo' | 'upload';

export default function MagicListPage() {
  const [mode, setMode] = useState<InputMode>('text');
  const [text, setText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const {
    result,
    analyzeText,
    analyzeImage,
    addAllMatched,
    addSingleItem,
    reset,
    isAnalyzing,
    error,
  } = useMagicList();

  const handleTextSubmit = useCallback(() => {
    if (!text.trim()) return;
    analyzeText(text.trim());
  }, [text, analyzeText]);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        if (base64) analyzeImage(base64);
      };
      reader.readAsDataURL(file);
    },
    [analyzeImage]
  );

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch {
      // Camera permission denied
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    const base64 = canvas.toDataURL('image/jpeg').split(',')[1];
    if (base64) analyzeImage(base64);

    // Stop camera
    const stream = videoRef.current.srcObject as MediaStream;
    stream?.getTracks().forEach((t) => t.stop());
    setCameraActive(false);
  }, [analyzeImage]);

  const handleStartOver = () => {
    reset();
    setText('');
  };

  return (
    <AuthGuard>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>✨ Magic List</h1>
          <p className={styles.subtitle}>
            Type or photograph your grocery list — AI matches it to our inventory
          </p>
        </div>

        {!result && !isAnalyzing && (
          <>
            <div className={styles.modeTabs}>
              {(['text', 'photo', 'upload'] as InputMode[]).map((m) => (
                <button
                  key={m}
                  className={`${styles.modeTab} ${mode === m ? styles.modeTabActive : ''}`}
                  onClick={() => setMode(m)}
                >
                  {m === 'text' ? '✍️ Write' : m === 'photo' ? '📷 Photo' : '📤 Upload'}
                </button>
              ))}
            </div>

            {mode === 'text' && (
              <div className={styles.inputSection}>
                <textarea
                  className={styles.textarea}
                  placeholder={'Type your grocery list here...\n\nTomatoes 2kg\nMilk 1L\nRice basmati 5kg\nOnions'}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={8}
                />
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleTextSubmit}
                  disabled={!text.trim()}
                >
                  ✨ Analyze My List
                </Button>
              </div>
            )}

            {mode === 'photo' && (
              <div className={styles.cameraSection}>
                {!cameraActive ? (
                  <Button variant="primary" size="lg" fullWidth onClick={startCamera}>
                    📷 Open Camera
                  </Button>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className={styles.video}
                    />
                    <Button variant="primary" size="lg" fullWidth onClick={capturePhoto}>
                      📸 Capture & Analyze
                    </Button>
                  </>
                )}
              </div>
            )}

            {mode === 'upload' && (
              <div className={styles.uploadSection}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className={styles.fileInput}
                />
                <Button
                  variant="secondary"
                  size="lg"
                  fullWidth
                  onClick={() => fileInputRef.current?.click()}
                >
                  📤 Choose Image
                </Button>
                <p className={styles.uploadHint}>Upload a photo of your handwritten list</p>
              </div>
            )}
          </>
        )}

        <AnimatePresence>
          <AnalysisLoader isVisible={isAnalyzing} />
        </AnimatePresence>

        {error && <p className={styles.error}>⚠️ {error}</p>}

        {result && !isAnalyzing && (
          <>
            <div className={styles.summary}>
              <span className={styles.summaryItem}>✅ {result.summary.matched} matched</span>
              <span className={styles.summaryItem}>❌ {result.summary.unmatched} unmatched</span>
              <span className={styles.summaryItem}>📋 {result.summary.total} total</span>
            </div>

            <MatchedItemsList items={result.extracted_items} onAddItem={addSingleItem} />
            <UnmatchedItems items={result.extracted_items} />
            <AddAllToCart result={result} onAddAll={addAllMatched} />

            <Button variant="secondary" fullWidth onClick={handleStartOver}>
              Start Over
            </Button>
          </>
        )}

        {!result && !isAnalyzing && (
          <div className={styles.howItWorks}>
            <h2 className={styles.howTitle}>How it works</h2>
            <div className={styles.steps}>
              {['Write or photograph your grocery list', 'AI extracts and matches items', 'Review matches and add all to cart'].map((step, i) => (
                <div key={i} className={styles.step}>
                  <span className={styles.stepNum}>{i + 1}</span>
                  <span className={styles.stepText}>{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
