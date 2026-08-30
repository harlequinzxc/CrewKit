import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ImageLightboxProps {
  open: boolean;
  onClose: () => void;
  src: string | null;
  title: string;
  description?: string;
  meta?: string;
  credit?: string;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  open,
  onClose,
  src,
  title,
  description,
  meta,
  credit,
}) => {
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [open, onClose]);

  useEffect(() => {
    setImageLoaded(false);
  }, [src]);

  if (!open || !src) return null;

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in select-none"
      >
        {/* Top Right Close Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Close image preview"
          className="fixed top-4 right-4 sm:top-6 sm:right-6 w-11 h-11 rounded-full bg-ink-900/90 border border-gold-dim hover:border-gold-400 flex items-center justify-center text-gold-300 transition-all duration-200 z-50 active:scale-95 shadow-md"
        >
          <X className="w-5 h-5" strokeWidth={1.75} />
        </button>

        {/* Main Lightbox Content Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-[min(90vw,560px)] flex flex-col items-center text-center transition-all"
        >
          {/* Image Container with Loading Skeleton */}
          <div className="relative w-full max-h-[min(65vh,520px)] flex items-center justify-center overflow-hidden rounded-2xl bg-ink-900 border border-gold-dim shadow-gold-glow">
            {!imageLoaded && (
              <div className="w-full h-72 sm:h-80 flex flex-col items-center justify-center bg-ink-850 animate-pulse">
                <div className="w-12 h-12 rounded-full border-2 border-gold-dim border-t-gold-400 animate-spin" />
                <span className="font-ui text-xs uppercase tracking-wider text-mist-400 mt-3">Loading photograph…</span>
              </div>
            )}

            <img
              src={src}
              alt={title}
              onLoad={() => setImageLoaded(true)}
              className={`w-full max-h-[min(65vh,520px)] object-contain rounded-2xl transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0'
              }`}
            />
          </div>

          {/* Caption Strip */}
          <div className="w-full mt-4 px-2">
            {meta && (
              <span className="font-ui text-[0.72rem] uppercase tracking-eyebrow text-gold-300 font-semibold block mb-1">
                {meta}
              </span>
            )}

            <h3 className="font-display text-2xl sm:text-3xl font-light text-ivory-100 leading-snug">
              {title}
            </h3>

            {description && (
              <p className="font-sans text-xs sm:text-sm text-mist-300 mt-1 max-w-md mx-auto leading-relaxed line-clamp-3">
                {description}
              </p>
            )}

            {credit && (
              <span className="font-ui text-[0.68rem] uppercase tracking-wider text-mist-400 block mt-2">
                {credit}
              </span>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
