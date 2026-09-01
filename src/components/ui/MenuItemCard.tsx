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
  mediaVariant?: 'photo' | 'amenity';
  imageFit?: 'cover' | 'contain';
  imageBg?: 'dark' | 'white';
  className?: string;
}

/**
 * Unified CrewKit menu item card for Food dishes, Drinks entries, and Amenities tiles.
 * - Soft card radius (16–20px / rounded-card), quiet subtle border (no heavy frame)
 * - Media stage:
 *     - 'photo' (Food/Drinks): object-cover photography with bottom fade into card footing
 *     - 'amenity': warm paper / white stage (#F5F2EB), object-contain with ~56-68% max bounds, bottom fade into navy footing
 * - Inset graduated GoldHairline separator in the fade zone between media and text
 * - Bottom navy footing with Inter Medium subsection heading and quiet secondary text
 * - Completely static container with no hover lift or press flash
 */
export const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  courseCategory,
  cabin,
  mediaVariant = 'photo',
  imageFit,
  imageBg,
  className,
}) => {
  const isAmenity =
    mediaVariant === 'amenity' ||
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
        'rounded-card bg-ink-900 border border-gold-dim overflow-hidden flex flex-col justify-between text-left shadow-sm select-none transition-colors',
        className
      )}
    >
      <div>
        {/* 1. Media Stage with Aspect Ratio and Bottom Dissolve */}
        {hasPhoto && (
          <>
            {isAmenity ? (
              /* Amenity Light Stage: Warm paper/white ground with centered ink artwork */
              <div
                className="relative w-full aspect-[16/10] overflow-hidden flex items-center justify-center p-6 bg-gradient-to-b from-white via-ink-900/40 to-ink-900/80"
              >
                <img
                  src={imageState.thumbUrl!}
                  alt={item.title}
                  className="w-full h-full max-w-[64%] max-h-[64%] object-contain select-none"
                  loading="lazy"
                  onError={() => {
                    setImageState({ thumbUrl: null, fullUrl: null, source: 'placeholder' });
                  }}
                />

                {/* Theme-aware soft bottom dissolve into card text footing */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(to bottom, transparent 48%, rgb(var(--ink-900-rgb) / 0.45) 75%, rgb(var(--ink-900-rgb) / 1) 100%)',
                  }}
                />
              </div>
            ) : (
              /* Food / Drinks Photo Stage: Luxury cover with theme-aware dissolve into card footing */
              <div className="relative w-full aspect-[16/10] overflow-hidden bg-ink-950">
                <img
                  src={imageState.thumbUrl!}
                  alt={item.title}
                  className="w-full h-full object-cover select-none"
                  loading="lazy"
                  onError={() => {
                    setImageState({ thumbUrl: null, fullUrl: null, source: 'placeholder' });
                  }}
                />

                {/* Photo bottom dissolve into card footing */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(to bottom, transparent 52%, rgb(var(--ink-900-rgb) / 0.55) 76%, rgb(var(--ink-900-rgb) / 1) 100%)',
                  }}
                />
              </div>
            )}
          </>
        )}

        {/* 2. Media → Text Separator: Inset Graduated GoldHairline */}
        {hasPhoto && (
          <div className="px-5 -mt-px relative z-10">
            <GoldHairline />
          </div>
        )}

        {/* 3. Text Region (Navy/Ivory Card Footing) */}
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
              className="text-[0.78rem] text-mist-400 mt-1.5 italic font-medium"
            >
              {item.footnote}
            </Text>
          )}
        </div>
      </div>

      {/* 4. Dietary & Badges */}
      {item.tags && item.tags.length > 0 && (
        <div className="px-4 sm:px-5 pb-4 mt-3.5 pt-2.5 border-t border-gold-dim flex flex-wrap gap-1.5">
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
                    ? 'bg-gold-400/15 text-gold-400 border border-gold-400/30'
                    : isChef
                    ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                    : 'bg-ink-850 text-mist-300 border border-gold-dim'
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
