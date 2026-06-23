import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  showText = true,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: { svg: 'h-6 w-6', text: 'text-lg' },
    md: { svg: 'h-8 w-8', text: 'text-2xl' },
    lg: { svg: 'h-10 w-10', text: 'text-3xl' },
  };

  const { svg: svgSize, text: textSize } = sizeClasses[size];

  return (
    <div className={`flex items-center gap-2.5 select-none font-bold ${className}`}>
      {/* Premium Gradient Logo Icon */}
      <div className={`relative ${svgSize} shrink-0`}>
        {/* Glowing Background Ring */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#ff6b5f] to-[#0f766e] opacity-20 blur-md rounded-xl animate-pulse" />
        
        {/* SVG Icon representing dynamic open book / M loop */}
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full relative z-10 filter drop-shadow-sm transition-transform duration-300 hover:scale-105"
        >
          <defs>
            <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff6b5f" /> {/* coral */}
              <stop offset="60%" stopColor="#0e7490" /> {/* sky */}
              <stop offset="100%" stopColor="#0f766e" /> {/* teal */}
            </linearGradient>
            <linearGradient id="logo-accent-gradient" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ff9f80" />
              <stop offset="100%" stopColor="#f5c542" />
            </linearGradient>
          </defs>
          
          {/* Main Book/M element */}
          <path
            d="M5 8C5 6.34315 6.34315 5 8 5H13C14.6569 5 16 6.34315 16 8V24C16 25.6569 14.6569 27 13 27H8C6.34315 27 5 25.6569 5 24V8Z"
            fill="url(#logo-gradient)"
          />
          <path
            d="M27 8C27 6.34315 25.6569 5 24 5H19C17.3431 5 16 6.34315 16 8V24C16 25.6569 17.3431 27 19 27H24C25.6569 27 27 25.6569 27 24V8Z"
            fill="url(#logo-gradient)"
            opacity="0.85"
          />
          
          {/* Accent light/ribbon of knowledge */}
          <path
            d="M11 5C11 3.34315 12.3431 2 14 2H18C19.6569 2 21 3.34315 21 5V8H11V5Z"
            fill="url(#logo-accent-gradient)"
          />
          
          {/* Spark/Star of mentoring/enlightenment */}
          <path
            d="M16 11L17.5 14L20.5 14.5L18.3 16.5L18.9 19.5L16 18L13.1 19.5L13.7 16.5L11.5 14.5L14.5 14L16 11Z"
            fill="#ffffff"
          />
        </svg>
      </div>

      {showText && (
        <span
          className={`font-semibold tracking-tight font-outfit ${textSize} bg-gradient-to-r from-[#17202a] via-[#0f766e] to-[#0e7490] bg-clip-text text-transparent`}
        >
          Mentora
        </span>
      )}
    </div>
  );
};
