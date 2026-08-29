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
      className="group flex items-center justify-center w-10 h-10 rounded-full bg-bg-elevated border border-border-subtle hover:border-border-medium hover:text-accent active:scale-95 transition-all shadow-sm"
    >
      <ArrowLeft className="w-5 h-5 text-text-secondary group-hover:text-accent transition-colors" strokeWidth={1.75} />
    </button>
  );
};
