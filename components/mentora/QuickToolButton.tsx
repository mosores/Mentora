import React from 'react';
import { 
  Sparkles, 
  FileText, 
  BookMarked, 
  HelpCircle, 
  ListTodo, 
  Languages,
  BookOpen,
  Compass,
  ArrowRight,
  Loader2
} from 'lucide-react';

export type QuickToolIconType = 
  | 'explain' 
  | 'summary' 
  | 'citation' 
  | 'quiz' 
  | 'guide' 
  | 'translate'
  | 'flashcard'
  | 'explore';

interface QuickToolButtonProps {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  iconType?: QuickToolIconType;
  onClick: () => void;
  isLoading?: boolean;
  isActive?: boolean;
  variant?: 'teal' | 'coral' | 'sky' | 'indigo' | 'slate';
}

export const QuickToolButton: React.FC<QuickToolButtonProps> = ({
  label,
  description,
  icon,
  iconType,
  onClick,
  isLoading = false,
  isActive = false,
  variant = 'slate',
}) => {
  // Select icon if iconType is provided
  const renderIcon = () => {
    if (isLoading) {
      return <Loader2 className="w-5 h-5 animate-spin text-current" />;
    }
    if (icon) return icon;

    switch (iconType) {
      case 'explain':
        return <Sparkles className="w-5 h-5 text-current transition-transform group-hover:rotate-12 duration-200" />;
      case 'summary':
        return <FileText className="w-5 h-5 text-current transition-transform group-hover:scale-110 duration-200" />;
      case 'citation':
        return <BookMarked className="w-5 h-5 text-current transition-transform group-hover:-translate-y-0.5 duration-200" />;
      case 'quiz':
        return <HelpCircle className="w-5 h-5 text-current transition-transform group-hover:rotate-6 duration-200" />;
      case 'guide':
        return <ListTodo className="w-5 h-5 text-current transition-transform group-hover:translate-x-0.5 duration-200" />;
      case 'translate':
        return <Languages className="w-5 h-5 text-current transition-transform group-hover:scale-105 duration-200" />;
      case 'flashcard':
        return <BookOpen className="w-5 h-5 text-current transition-transform group-hover:rotate-[-6deg] duration-200" />;
      case 'explore':
        return <Compass className="w-5 h-5 text-current transition-transform group-hover:animate-spin-slow duration-200" />;
      default:
        return <Sparkles className="w-5 h-5 text-current" />;
    }
  };

  // Variants styling
  const variantStyles = {
    teal: {
      button: 'hover:border-[#0f766e]/30 hover:bg-[#e8f7f4]/40 text-[#0f766e]',
      active: 'border-[#0f766e] bg-[#e8f7f4] text-[#0f3f3a] shadow-inner',
      iconContainer: 'bg-[#e8f7f4] text-[#0f766e]',
    },
    coral: {
      button: 'hover:border-[#ff6b5f]/30 hover:bg-[#fff0ee]/40 text-[#ff6b5f]',
      active: 'border-[#ff6b5f] bg-[#fff0ee] text-[#b91c1c] shadow-inner',
      iconContainer: 'bg-[#fff0ee] text-[#ff6b5f]',
    },
    sky: {
      button: 'hover:border-[#0e7490]/30 hover:bg-[#e0f2fe]/45 text-[#0e7490]',
      active: 'border-[#0e7490] bg-[#e0f2fe] text-[#0369a1] shadow-inner',
      iconContainer: 'bg-[#e0f2fe] text-[#0e7490]',
    },
    indigo: {
      button: 'hover:border-indigo-500/30 hover:bg-indigo-50/50 text-[#6366f1]',
      active: 'border-[#6366f1] bg-[#e0e7ff] text-[#3730a3] shadow-inner',
      iconContainer: 'bg-[#e0e7ff] text-[#6366f1]',
    },
    slate: {
      button: 'hover:border-slate-300 hover:bg-slate-50 text-slate-700',
      active: 'border-slate-800 bg-slate-100 text-slate-900 shadow-inner',
      iconContainer: 'bg-slate-100 text-slate-600',
    },
  };

  const currentStyle = variantStyles[variant] || variantStyles.slate;
  const stateClass = isActive ? currentStyle.active : `${currentStyle.button} border-slate-200 bg-white`;

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`group flex items-start gap-3 p-3 min-h-[44px] text-left border rounded-xl cursor-pointer select-none focus:outline-none w-full ${stateClass} ${
        isLoading ? 'opacity-70 cursor-not-allowed' : ''
      } transition-[transform,border-color,background-color,box-shadow] duration-base ease-standard`}
    >
      {/* Icon frame */}
      <div className={`p-2 rounded-md shrink-0 transition-colors duration-base ease-standard ${currentStyle.iconContainer}`}>
        {renderIcon()}
      </div>

      {/* Label and Description */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <span className="text-sm font-semibold truncate leading-tight">
            {label}
          </span>
          <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-[opacity,transform] duration-base ease-emphasized shrink-0 text-current" />
        </div>
        {description && (
          <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 font-normal leading-normal">
            {description}
          </p>
        )}
      </div>
    </button>
  );
};
