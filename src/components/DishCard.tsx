import React, { useState, useEffect } from 'react';
import { MenuItem } from '../lib/sq/types';
import { resolveDishImage, ResolvedDishImageResult } from '../lib/images/resolveDishImage';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export interface DishCardProps {
  item: MenuItem;
  courseCategory?: string;
  cabin?: string;
  onOpenLightbox: (data: {
    src: string;
    title: string;
    description?: string;
    meta?: string;
  }) => void;
}

export const DishCard: React.FC<DishCardProps> = ({
  item,
  courseCategory,
  cabin,
  onOpenLightbox,
}) => {
  const [imageState, setImageState] = useState<ResolvedDishImageResult | null>(() => {
    if (!item.imageUrl) {
      return { thumbUrl: null, fullUrl: null, source: 'placeholder' };
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(item.imageUrl));

  useEffect(() => {
    if (!item.imageUrl) {
      setImageState({ thumbUrl: null, fullUrl: null, source: 'placeholder' });
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    resolveDishImage({
      dishTitle: item.title,
      sqImageUrl: item.imageUrl,
      cabin,
    })
      .then((res) => {
        if (isMounted) {
          setImageState(res);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setImageState({ thumbUrl: null, fullUrl: null, source: 'placeholder' });
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [item.title, item.imageUrl, cabin]);

  const hasPhoto = Boolean(
    imageState && imageState.thumbUrl && imageState.source === 'sq'
  );

  const handleImageClick = () => {
    if (imageState && imageState.fullUrl && imageState.source === 'sq') {
      onOpenLightbox({
        src: imageState.fullUrl,
        title: item.title,
        description: item.description,
        meta: courseCategory,
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="cabin-glass flex flex-col justify-between overflow-hidden p-4 group hover:border-gold-400/40 hover:shadow-gold-glow transition-all text-left"
    >
      <div>
        {/* 1. 16:10 Aspect-Ratio Image Container (Only rendered if authentic SQ image exists) */}
        {isLoading ? (
          <div className="w-full aspect-[16/10] rounded-xl bg-ink-800/80 animate-pulse border border-gold-dim mb-3.5" />
        ) : hasPhoto ? (
          <div
            onClick={handleImageClick}
            className="w-full aspect-[16/10] rounded-xl relative overflow-hidden mb-3.5 cursor-pointer border border-gold-dim group-hover:border-gold-400/50 transition-colors"
          >
            <img
              src={imageState!.thumbUrl!}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              onError={() => {
                setImageState({ thumbUrl: null, fullUrl: null, source: 'placeholder' });
              }}
            />
            {/* Bottom Gradient Fade into Card Surface */}
            <div className="absolute inset-0 bg-gradient-to-t from-ink-900/90 via-transparent to-transparent pointer-events-none" />
          </div>
        ) : null}

        {/* 2. Dish Title (Cormorant Garamond) */}
        <h4 className="font-display text-xl sm:text-2xl font-light text-ivory-100 leading-snug group-hover:text-gold-300 transition-colors">
          {item.title}
        </h4>

        {/* 3. Dish Description */}
        {item.description && (
          <p className="font-sans text-[0.85rem] text-mist-300 mt-1.5 leading-relaxed">
            {item.description}
          </p>
        )}

        {/* 4. Footnote */}
        {item.footnote && (
          <p className="font-display italic text-[0.8rem] text-mist-400 mt-1.5">
            {item.footnote}
          </p>
        )}
      </div>

      {/* 5. Uppercase Icon Chips for Dietary & Tags */}
      {item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3.5 pt-2 border-t border-gold-dim">
          {item.tags.map((tag, tIdx) => {
            const isSig = tag.toLowerCase().includes('signature');
            const isChef = tag.toLowerCase().includes('panel') || tag.toLowerCase().includes('chef');
            return (
              <span
                key={tIdx}
                className={`text-[9px] px-2 py-0.5 rounded-sm font-ui uppercase tracking-wider font-semibold ${
                  isSig
                    ? 'bg-gold-400/20 text-gold-300 border border-gold-400/40'
                    : isChef
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    : 'bg-ink-850 text-mist-300 border border-gold-dim'
                }`}
              >
                {isSig && <Sparkles className="w-2.5 h-2.5 inline mr-1 -mt-0.5 text-gold-400" />}
                {tag}
              </span>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};
