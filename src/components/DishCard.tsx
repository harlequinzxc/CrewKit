import React, { useState, useEffect } from 'react';
import { MenuItem } from '../lib/sq/types';
import { resolveDishImage, ResolvedDishImageResult } from '../lib/images/resolveDishImage';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Heading, Text } from './ui';

export interface DishCardProps {
  item: MenuItem;
  courseCategory?: string;
  cabin?: string;
  imageFit?: 'cover' | 'contain';
  imageBg?: 'dark' | 'white';
}

export const DishCard: React.FC<DishCardProps> = ({
  item,
  courseCategory,
  cabin,
  imageFit,
  imageBg,
}) => {
  const isAmenity =
    imageBg === 'white' ||
    imageFit === 'contain' ||
    Boolean(courseCategory && courseCategory.toLowerCase().includes('amenit'));

  const [imageState, setImageState] = useState<ResolvedDishImageResult>(() =>
    resolveDishImage({
      dishTitle: item.title,
      sqImageUrl: item.imageUrl,
      cabin,
    })
  );

  useEffect(() => {
    setImageState(
      resolveDishImage({
        dishTitle: item.title,
        sqImageUrl: item.imageUrl,
        cabin,
      })
    );
  }, [item.title, item.imageUrl, cabin]);

  const hasPhoto = Boolean(
    imageState && imageState.thumbUrl && imageState.source === 'sq'
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="cabin-glass flex flex-col justify-between overflow-hidden p-4 group hover:border-gold-400/40 hover:shadow-gold-glow transition-all text-left"
    >
      <div>
        {/* 1. 16:10 Aspect-Ratio Image Container (Only rendered if authentic SQ image exists) */}
        {hasPhoto ? (
          isAmenity ? (
            /* Amenity Frame: Fitted (contain) with clean solid white background */
            <div className="w-full aspect-[16/10] rounded-xl relative overflow-hidden mb-3.5 bg-white flex items-center justify-center p-3.5 border border-white/20 group-hover:border-gold-400/60 shadow-sm transition-all">
              <img
                src={imageState.thumbUrl!}
                alt={item.title}
                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                onError={() => {
                  setImageState({ thumbUrl: null, fullUrl: null, source: 'placeholder' });
                }}
              />
            </div>
          ) : (
            /* Food/Beverage Frame: Luxury Cover with Bottom Dark Fade */
            <div className="w-full aspect-[16/10] rounded-xl relative overflow-hidden mb-3.5 border border-gold-dim group-hover:border-gold-400/50 transition-colors bg-ink-950">
              <img
                src={imageState.thumbUrl!}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                onError={() => {
                  setImageState({ thumbUrl: null, fullUrl: null, source: 'placeholder' });
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-900/90 via-transparent to-transparent pointer-events-none" />
            </div>
          )
        ) : null}

        {/* 2. Dish Title (Inter Medium, ~1rem, No serif) */}
        <Heading
          variant="subsection"
          as="h4"
          className="text-base sm:text-[1.05rem] font-medium font-sans text-ivory-100 leading-snug group-hover:text-gold-300 transition-colors"
        >
          {item.title}
        </Heading>

        {/* 3. Description */}
        {item.description && (
          <Text variant="secondary" className="mt-1.5 leading-relaxed">
            {item.description}
          </Text>
        )}

        {/* 4. Footnote */}
        {item.footnote && (
          <Text variant="secondary" className="text-[0.8rem] text-mist-400 mt-1.5 italic">
            {item.footnote}
          </Text>
        )}
      </div>

      {/* 5. Dietary & Tag Chips */}
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
