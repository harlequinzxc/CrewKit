import React, { useState, useEffect } from 'react';
import { MenuItem } from '../../lib/sq/types';
import { resolveDishImage, ResolvedDishImageResult } from '../../lib/images/resolveDishImage';
import { Heading, Text } from './index';
import { GoldHairline } from './GoldHairline';
import { Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface MenuItemCardProps {
  item: MenuItem;
  courseCategory?: string;
  cabin?: string;
  imageFit?: 'cover' | 'contain';
  imageBg?: 'dark' | 'white';
  className?: string;
}

/**
 * Unified CrewKit menu item card for Food dishes, Drinks entries, and Amenities tiles.
 * - Soft 1px gold/subtle border (no heavy frame)
 * - Image full-width with bottom fade into card surface
 * - Inset graduated GoldHairline separator in the fade zone
 * - Clean Inter Medium subsection heading and secondary text
 * - Completely static container with no hover lift or press flash
 */
export const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  courseCategory,
  cabin,
  imageFit,
  imageBg,
  className,
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
    <div
      className={cn(
        'rounded-card bg-ink-900 border border-gold-400/10 overflow-hidden flex flex-col justify-between text-left shadow-[0_8px_24px_rgba(0,0,0,0.25)] select-none',
        className
      )}
    >
      <div>
        {/* 1. Media (Image) Region with Soft Bottom Dissolve */}
        {hasPhoto && (
          <div className="relative w-full aspect-[16/10] overflow-hidden bg-ink-950">
            <img
              src={imageState.thumbUrl!}
              alt={item.title}
              className={cn(
                'w-full h-full',
                isAmenity ? 'object-contain p-2' : 'object-cover'
              )}
              loading="lazy"
              onError={() => {
                setImageState({ thumbUrl: null, fullUrl: null, source: 'placeholder' });
              }}
            />

            {/* Bottom Gradient Overlay: photo dissolves into card navy surface */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'linear-gradient(to bottom, transparent 55%, rgb(var(--ink-900-rgb) / 0.65) 78%, rgb(var(--ink-900-rgb) / 1) 100%)',
              }}
            />
          </div>
        )}

        {/* 2. Media → Text Separator: Inset Graduated GoldHairline */}
        {hasPhoto && (
          <div className="px-5 -mt-px relative z-10">
            <GoldHairline />
          </div>
        )}

        {/* 3. Text Region */}
        <div
          className={cn(
            'px-4 sm:px-5 flex flex-col',
            hasPhoto ? 'pt-3.5 sm:pt-4' : 'pt-4 sm:pt-5'
          )}
        >
          {/* Title */}
          <Heading
            variant="subsection"
            as="h4"
            className="text-base sm:text-[1.02rem] font-medium font-sans text-ivory-100 leading-snug tracking-normal"
          >
            {item.title}
          </Heading>

          {/* Description */}
          {item.description && (
            <Text
              variant="secondary"
              className="text-xs sm:text-[0.85rem] text-mist-300 mt-1.5 leading-relaxed"
            >
              {item.description}
            </Text>
          )}

          {/* Optional Footnote */}
          {item.footnote && (
            <Text
              variant="secondary"
              className="text-[0.78rem] text-mist-400 mt-1.5 italic"
            >
              {item.footnote}
            </Text>
          )}
        </div>
      </div>

      {/* 4. Dietary & Badges */}
      {item.tags && item.tags.length > 0 && (
        <div className="px-4 sm:px-5 pb-4 mt-3.5 pt-2.5 border-t border-gold-400/10 flex flex-wrap gap-1.5">
          {item.tags.map((tag, tIdx) => {
            const isSig = tag.toLowerCase().includes('signature');
            const isChef =
              tag.toLowerCase().includes('panel') || tag.toLowerCase().includes('chef');
            return (
              <span
                key={tIdx}
                className={cn(
                  'text-[9px] px-2 py-0.5 rounded-sm font-ui uppercase tracking-wider font-semibold',
                  isSig
                    ? 'bg-gold-400/15 text-gold-300 border border-gold-400/30'
                    : isChef
                    ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                    : 'bg-ink-800 text-mist-300 border border-gold-400/10'
                )}
              >
                {isSig && (
                  <Sparkles className="w-2.5 h-2.5 inline mr-1 -mt-0.5 text-gold-400" />
                )}
                {tag}
              </span>
            );
          })}
        </div>
      )}

      {/* Bottom spacing when no tags are present */}
      {(!item.tags || item.tags.length === 0) && <div className="pb-4" />}
    </div>
  );
};
