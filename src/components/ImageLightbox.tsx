import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

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

  // Lock body scroll while open
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

  // Reset loading state when src changes
  useEffect(() => {
    setImageLoaded(false);
  }, [src]);

  if (!open || !src) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#070B14]/75 backdrop-blur-xl animate-fade-in select-none"
    >
      {/* Top Right Close Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Close image preview"
        className="fixed top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full bg-bg-elevated/80 border border-border-subtle hover:border-accent flex items-center justify-center text-text-secondary hover:text-accent transition-all duration-200 z-50 active:scale-95 shadow-md"
      >
        <X className="w-5 h-5" strokeWidth={1.75} />
      </button>

      {/* Main Lightbox Content Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[min(90vw,560px)] flex flex-col items-center text-center animate-menu-in transition-all"
      >
        {/* Image Container with Loading Skeleton */}
        <div className="relative w-full max-h-[min(65vh,520px)] flex items-center justify-center overflow-hidden rounded-2xl bg-bg-elevated/60 border border-[rgba(255,255,255,0.08)] shadow-[0_24px_64px_rgba(0,0,0,0.65)]">
          {!imageLoaded && (
            <div className="w-full h-72 sm:h-80 flex flex-col items-center justify-center bg-bg-surface animate-pulse">
              <div className="w-12 h-12 rounded-full border-2 border-accent/40 border-t-accent animate-spin" />
              <span className="font-sans text-xs text-text-tertiary mt-3">Loading photograph…</span>
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
            <span className="font-sans text-[0.7rem] uppercase tracking-[0.15em] text-accent font-medium block mb-1">
              {meta}
            </span>
          )}

          <h3 className="font-sans font-semibold text-text-primary text-base sm:text-lg leading-snug">
            {title}
          </h3>

          {description && (
            <p className="font-sans font-normal text-text-secondary text-xs sm:text-sm mt-1 max-w-md mx-auto leading-relaxed line-clamp-3">
              {description}
            </p>
          )}

          {credit && (
            <span className="font-sans text-[0.65rem] text-text-tertiary tracking-wide block mt-2">
              {credit}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
