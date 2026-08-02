import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'text';
type Size = 'md' | 'lg';

interface BaseProps {
  variant?: Variant;
  size?: Size;
  withArrow?: boolean;
  className?: string;
  children: React.ReactNode;
}

interface ButtonAsButton extends BaseProps, Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> {
  href?: undefined;
}

interface ButtonAsLink extends BaseProps, Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children'> {
  href: string;
}

type ButtonProps = ButtonAsButton | ButtonAsLink;

const base =
  'touch-target inline-flex items-center justify-center gap-2 rounded-control font-medium tracking-[-0.01em] transition-colors duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper';

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-paper hover:bg-accent-hover',
  secondary: 'bg-transparent text-ink border border-border-strong hover:border-ink',
  text: 'bg-transparent text-ink underline-offset-4 hover:underline px-0',
};

const sizes: Record<Size, string> = {
  md: 'px-6 py-3 text-[15px]',
  lg: 'px-8 py-4 text-base',
};

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md', withArrow, className = '', children, href, ...rest }) => {
  const classes = `${base} ${variants[variant]} ${variant !== 'text' ? sizes[size] : ''} ${className} group`;
  const content = (
    <>
      {children}
      {withArrow && (
        <ArrowRight className="size-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2} />
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes} {...(rest as Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children'>)}>
        {content}
      </Link>
    );
  }

  return (
    <button className={classes} {...(rest as Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>)}>
      {content}
    </button>
  );
};
