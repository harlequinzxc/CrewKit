import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  to?: string;
  onClick?: () => void;
  label?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({ to = '/', onClick, label }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      onClick={handleClick}
      aria-label={label || 'Go back to home'}
      className="group flex items-center justify-center w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-ink-900/80 backdrop-blur-md border border-gold-dim hover:border-gold-400 active:scale-95 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2 focus:ring-offset-ink-950"
    >
      <ArrowLeft className="w-4.5 h-4.5 text-mist-300 group-hover:text-gold-300 transition-colors" strokeWidth={1.75} />
    </button>
  );
};
