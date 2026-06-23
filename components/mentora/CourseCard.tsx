import React from 'react';
import { BookOpen, ArrowRight, GraduationCap } from 'lucide-react';

interface CourseCardProps {
  code: string;
  title: string;
  institution: string;
  progress: number;
  materialsCount?: number;
  onClick?: () => void;
  variant?: 'teal' | 'coral' | 'sky' | 'indigo';
}

export const CourseCard: React.FC<CourseCardProps> = ({
  code,
  title,
  institution,
  progress,
  materialsCount = 0,
  onClick,
  variant = 'teal',
}) => {
  // Map variant to gradient classes
  const gradientMap = {
    teal: 'from-[#0f766e] to-[#0e7490]',
    coral: 'from-[#ff6b5f] to-[#f5c542]',
    sky: 'from-[#0e7490] to-[#6366f1]',
    indigo: 'from-[#6366f1] to-[#ff6b5f]',
  };

  const selectedGradient = gradientMap[variant] || gradientMap.teal;

  return (
    <div
      onClick={onClick}
      className="glass glass-card-hover group relative flex flex-col justify-between overflow-hidden p-6 cursor-pointer select-none rounded-xl"
    >
      {/* Decorative top border gradient line on hover */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${selectedGradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`} />

      <div>
        {/* Header: Institution & Code */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium max-w-[70%] truncate">
            <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{institution}</span>
          </div>
          <span className="text-[10px] tracking-wider uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
            {code}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-slate-800 line-clamp-2 mb-6 group-hover:text-[#0f766e] transition-colors duration-base ease-standard">
          {title}
        </h3>
      </div>

      {/* Footer & Progress */}
      <div>
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            <span className="tabular-nums">{materialsCount}</span> {materialsCount === 1 ? 'material' : 'materiales'}
          </span>
          <span className="font-semibold text-slate-700 tabular-nums">{progress}%</span>
        </div>

        {/* Modern progress bar with gradient */}
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1">
          <div
            className={`h-full bg-gradient-to-r ${selectedGradient} rounded-full transition-[width] duration-slow ease-standard`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Action prompt */}
        <div className="flex items-center justify-end mt-4 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-[opacity,transform] duration-base ease-emphasized text-xs font-semibold text-[#0f766e]">
          <span>Estudiar</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </div>
      </div>
    </div>
  );
};
