import React from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <Link to={to} className="focus:outline-none focus:ring-1 focus:ring-gold-400 rounded-cabin">
      <motion.div
        whileHover={{ y: -3, scale: 1.01 }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="cabin-glass group flex flex-col justify-between p-5 min-h-[120px] select-none hover:border-gold-400/50 hover:shadow-gold-glow transition-all"
      >
        {/* Gold Glyph Icon (24px, Lucide 1.75 stroke) */}
        <div className="text-gold-300 group-hover:text-gold-400 transition-colors mb-3">
          <Icon className="w-6 h-6 text-gold-300 group-hover:text-gold-400" strokeWidth={1.75} />
        </div>

        {/* Title (Cormorant Garamond) & Description (Jost/Inter) */}
        <div>
          <h3 className="font-display font-medium text-2xl text-ivory-100 group-hover:text-gold-300 transition-colors leading-tight">
            {title}
          </h3>
          <p className="font-ui text-[0.75rem] uppercase tracking-eyebrow text-mist-300 mt-1 line-clamp-1">
            {description}
          </p>
        </div>
      </motion.div>
    </Link>
  );
};
