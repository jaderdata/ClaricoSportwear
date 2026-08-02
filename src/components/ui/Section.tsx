import React from 'react';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  border?: 'top' | 'none';
}

export const Section: React.FC<SectionProps> = ({ children, className = '', id, border = 'none' }) => {
  return (
    <section
      id={id}
      className={`relative py-24 sm:py-32 lg:py-[clamp(6rem,10vw,10rem)] ${
        border === 'top' ? 'border-t border-border' : ''
      } ${className}`}
    >
      {children}
    </section>
  );
};
