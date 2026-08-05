import React from 'react';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const Container: React.FC<ContainerProps> = ({ children, className = '' }) => {
  return (
    <div className={`mx-auto w-full max-w-350 px-5 sm:px-8 lg:px-[clamp(2rem,5vw,5rem)] ${className}`}>
      {children}
    </div>
  );
};
