import React from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon, ArrowUpRight } from 'lucide-react';

interface NavCardProps {
  to: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export const NavCard: React.FC<NavCardProps> = ({
  to,
  title,
  description,
  icon: Icon,
}) => {
  return (
    <Link
      to={to}
      className="group relative flex flex-col justify-between p-4 sm:p-4.5 rounded-card bg-bg-surface/90 border border-border-subtle hover:border-accent-dim/60 active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-[0_4px_24px_rgba(0,0,0,0.3)] focus:outline-none focus:ring-1 focus:ring-accent/40"
    >
      {/* Top row with icon and subtle arrow */}
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-full bg-bg-elevated border border-border-subtle flex items-center justify-center text-accent group-hover:scale-105 group-hover:border-accent/40 transition-all shadow-sm">
          <Icon className="w-5 h-5 text-accent" strokeWidth={1.75} />
        </div>

        <div className="w-6 h-6 rounded-full bg-bg-elevated/40 flex items-center justify-center text-text-tertiary group-hover:text-accent group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all">
          <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2} />
        </div>
      </div>

      {/* Feature Title and Description */}
      <div className="mt-4">
        <h3 className="font-serif text-base sm:text-lg font-medium text-text-primary group-hover:text-accent transition-colors leading-tight">
          {title}
        </h3>
        <p className="text-[11px] sm:text-xs text-text-secondary mt-1 line-clamp-2 leading-relaxed">
          {description}
        </p>
      </div>
    </Link>
  );
};
