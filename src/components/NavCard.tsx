import React from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon, ArrowUpRight } from 'lucide-react';

interface NavCardProps {
  to: string;
  title: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
}

export const NavCard: React.FC<NavCardProps> = ({
  to,
  title,
  description,
  icon: Icon,
  badge,
}) => {
  return (
    <Link
      to={to}
      className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-card bg-bg-surface border border-border-subtle hover:border-accent-dim/60 active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-gold-glow/20 focus:outline-none focus:ring-2 focus:ring-accent/40"
    >
      {/* Subtle top row with icon and top-right indicator */}
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-bg-elevated border border-border-subtle flex items-center justify-center text-accent group-hover:scale-105 group-hover:border-accent/40 transition-all shadow-sm">
          <Icon className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-accent" strokeWidth={1.75} />
        </div>

        <div className="flex items-center gap-1.5">
          {badge && (
            <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/25">
              {badge}
            </span>
          )}
          <div className="w-6 h-6 rounded-full bg-bg-elevated/60 flex items-center justify-center text-text-tertiary group-hover:text-accent group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all">
            <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2} />
          </div>
        </div>
      </div>

      {/* Title and one-line description */}
      <div className="mt-3 sm:mt-4">
        <h3 className="font-serif text-base sm:text-lg font-medium text-text-primary group-hover:text-accent transition-colors leading-tight">
          {title}
        </h3>
        <p className="text-xs sm:text-[13px] text-text-secondary mt-1 line-clamp-2 leading-relaxed">
          {description}
        </p>
      </div>
    </Link>
  );
};
