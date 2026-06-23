import React from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

interface ProgressRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  variant?: 'teal' | 'coral' | 'sky' | 'indigo';
  showText?: boolean;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  size = 60,
  strokeWidth = 8,
  variant = 'teal',
  showText = true,
}) => {
  // Map variant to theme colors matching globals.css
  const colorMap = {
    teal: '#0f766e',
    coral: '#ff6b5f',
    sky: '#0e7490',
    indigo: '#6366f1',
  };

  const selectedColor = colorMap[variant] || colorMap.teal;

  return (
    <div style={{ width: size, height: size }} className="relative font-outfit select-none font-bold">
      <CircularProgressbar
        value={value}
        strokeWidth={strokeWidth}
        styles={buildStyles({
          pathColor: selectedColor,
          trailColor: 'rgba(23, 32, 42, 0.06)',
          strokeLinecap: 'round',
          pathTransition: 'stroke-dashoffset 0.8s ease 0s',
        })}
      />
      {showText && (
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span
            className="text-xs font-bold font-outfit text-slate-800 tabular-nums"
          >
            {Math.round(value)}%
          </span>
        </div>
      )}
    </div>
  );
};
