import React from 'react';

interface LogoProps {
  className?: string;
  imgClassName?: string;
  textClassName?: string;
  showText?: boolean;
  variant?: 'main' | 'chrome';
}

export const Logo: React.FC<LogoProps> = ({ 
  className = "flex items-center gap-2", 
  imgClassName = "w-10 h-10", 
  textClassName = "text-2xl font-bold",
  showText = true,
  variant = 'main'
}) => {
  const logoFile = variant === 'chrome' ? 'favicon.png' : 'logo.png';
  return (
    <div className={className}>
      <img 
        src={`${import.meta.env.BASE_URL}${logoFile}`} 
        alt="Zane Tutors Logo" 
        className={imgClassName}
        onError={(e) => {
          // If the logo is missing, we can show a placeholder or nothing
          // For now, let's keep it simple
        }}
      />
      {showText && (
        <span className={textClassName}>Zane Tutors</span>
      )}
    </div>
  );
};
