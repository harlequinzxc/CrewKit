import React, { useState, useEffect } from 'react';
import { MenuItem } from '../lib/sq/types';
import { resolveDishImage, ResolvedDishImageResult } from '../lib/images/resolveDishImage';
import { UtensilsCrossed } from 'lucide-react';

export interface DishCardProps {
  item: MenuItem;
  courseCategory?: string;
  cabin?: string;
  onOpenLightbox: (data: {
    src: string;
    title: string;
    description?: string;
    meta?: string;
    credit?: string;
  }) => void;
}

export const DishCard: React.FC<DishCardProps> = ({
  item,
  courseCategory,
  cabin,
  onOpenLightbox,
}) => {
  const [imageState, setImageState] = useState<ResolvedDishImageResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
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

  const handleImageClick = () => {
    if (imageState && imageState.fullUrl && (imageState.source === 'sq' || imageState.source === 'google')) {
      onOpenLightbox({
        src: imageState.fullUrl,
        title: item.title,
        description: item.description,
        meta: courseCategory,
        credit: imageState.source === 'google' ? 'Photo via Google' : undefined,
      });
    }
  };

  return (
    <div className="group flex items-start text-left transition-all">
      {/* 1. Image Thumbnail Slot (64×64) */}
      <div className="w-16 h-16 min-w-[64px] min-h-[64px] shrink-0 rounded-xl relative overflow-hidden">
        {isLoading ? (
          // Shimmer Skeleton
          <div className="w-full h-full rounded-xl bg-bg-elevated animate-pulse border border-border-subtle/40" />
        ) : imageState && imageState.thumbUrl && imageState.source !== 'placeholder' ? (
          // Resolved Image (SQ or Google)
          <img
            src={imageState.thumbUrl}
            alt={item.title}
            onClick={handleImageClick}
            className="w-full h-full object-cover rounded-xl border border-[rgba(255,255,255,0.06)] cursor-pointer hover:scale-105 transition-transform duration-200 shadow-sm animate-fade-in"
            loading="lazy"
            onError={() => {
              setImageState({ thumbUrl: null, fullUrl: null, source: 'placeholder' });
            }}
          />
        ) : (
          // Editorial Placeholder
          <div className="w-full h-full rounded-xl bg-bg-elevated/80 border border-[rgba(255,255,255,0.05)] flex items-center justify-center text-text-tertiary">
            <UtensilsCrossed className="w-5 h-5 opacity-40 text-text-tertiary" strokeWidth={1.5} />
          </div>
        )}
      </div>

      {/* 2. Text Block */}
      <div className="flex flex-col gap-1 ml-4 flex-1">
        {/* Dish Title */}
        <h4 className="font-sans font-medium text-[1rem] text-text-primary leading-snug group-hover:text-text-primary transition-colors">
          {item.title}
        </h4>

        {/* Dish Description */}
        {item.description && (
          <p className="font-sans font-normal text-[0.85rem] text-text-secondary leading-relaxed">
            {item.description}
          </p>
        )}

        {/* Footnote */}
        {item.footnote && (
          <p className="font-serif italic text-[0.75rem] text-text-tertiary">
            {item.footnote}
          </p>
        )}

        {/* Badges / Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {item.tags.map((tag, tIdx) => (
              <span
                key={tIdx}
                className={`text-[9px] px-2 py-0.5 rounded-md font-sans font-medium tracking-wide ${
                  tag === 'Signature'
                    ? 'bg-accent/15 text-accent border border-accent/30 font-semibold'
                    : tag === 'Culinary Panel'
                    ? 'bg-blue-500/15 text-blue-300 border border-blue-500/25'
                    : 'bg-bg-elevated text-text-secondary border border-border-subtle/50'
                }`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
