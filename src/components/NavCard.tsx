import React from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

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
      className="editorial-nav-card group flex flex-col justify-between select-none focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-base"
    >
      {/* Gold Glyph Icon (24px, NO filled circle background) */}
      <div className="text-accent mb-3">
        <Icon className="w-6 h-6 text-accent" strokeWidth={1.75} />
      </div>

      {/* Title & Description */}
      <div>
        <h3 className="font-sans font-semibold text-[1.05rem] text-text-primary group-hover:text-accent transition-colors leading-tight">
          {title}
        </h3>
        <p className="font-sans text-[0.8rem] text-text-secondary mt-1 line-clamp-1 leading-relaxed">
          {description}
        </p>
      </div>
    </Link>
  );
};
