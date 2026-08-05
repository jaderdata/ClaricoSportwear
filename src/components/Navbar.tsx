'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ShoppingBag } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/components/cart/CartProvider';

interface NavbarProps {
  onOpenQuote: (productName?: string) => void;
  onOpenTrack: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenQuote, onOpenTrack }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { itemCount, openDrawer } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { href: '/sports', label: 'Sports' },
    { href: '/sports#sport-types', label: 'Academies & Sports' },
    { href: '/#collections', label: 'Catalog' },
    { href: '/shop', label: 'Shop' },
    { href: '/#how-it-works', label: 'How It Works' },
  ];

  const isActive = (href: string) => {
    if (href.startsWith('/#')) return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-border ${
        scrolled ? 'shadow-sm' : 'shadow-xs'
      }`}
      style={{
        backgroundColor: 'rgba(247, 245, 240, 0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <Container>
        <div className="flex items-center justify-between h-18 sm:h-20">
          <Link href="/" className="flex items-center gap-0 select-none" aria-label="Clarico Studio — Home">
            <span className="text-body font-black uppercase tracking-[0.04em] text-ink leading-none">Clarico</span>
            <span className="mx-2.25 w-px h-3.5 bg-accent shrink-0" aria-hidden="true" />
            <span className="text-[13px] font-semibold uppercase tracking-[0.18em] text-accent leading-none">Studio</span>
          </Link>

          <div className="hidden lg:flex items-center gap-1.5 text-[15px]">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-control font-semibold text-[15px] transition-all duration-200 ${
                    active
                      ? 'text-accent bg-accent-soft'
                      : 'text-ink hover:text-accent hover:bg-black/5'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenTrack}
              className="touch-target px-4 py-2 text-[15px] font-semibold text-ink hover:text-accent hover:bg-black/5 rounded-control transition-colors cursor-pointer"
            >
              Track Order
            </button>
            <button
              type="button"
              onClick={openDrawer}
              aria-label={`Open cart${itemCount > 0 ? ` (${itemCount} items)` : ''}`}
              className="touch-target relative p-2.5 text-ink hover:text-accent hover:bg-black/5 rounded-control transition-colors cursor-pointer"
            >
              <ShoppingBag className="size-5.5" strokeWidth={1.75} />
              {itemCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-4.5 h-4.5 px-1 rounded-full bg-accent text-paper text-[10px] font-bold flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>
            <Button onClick={() => onOpenQuote()} size="md">
              Request a Quote
            </Button>
          </div>

          <div className="lg:hidden flex items-center gap-1">
            <button
              type="button"
              onClick={openDrawer}
              aria-label={`Open cart${itemCount > 0 ? ` (${itemCount} items)` : ''}`}
              className="touch-target relative p-2 text-ink hover:text-accent transition-colors cursor-pointer"
            >
              <ShoppingBag className="size-6" strokeWidth={1.75} />
              {itemCount > 0 && (
                <span className="absolute top-0 right-0 min-w-4.5 h-4.5 px-1 rounded-full bg-accent text-paper text-[10px] font-bold flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="touch-target text-ink hover:text-accent transition-colors cursor-pointer p-2 rounded-control active:bg-black/5 select-none"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="size-6.5" strokeWidth={2} /> : <Menu className="size-6.5" strokeWidth={2} />}
            </button>
          </div>
        </div>
      </Container>

      {mobileMenuOpen && (
        <div className="lg:hidden bg-paper border-t border-border px-5 pt-4 pb-8 shadow-xl animate-reveal">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-3 rounded-control text-base font-medium ${
                  isActive(link.href) ? 'text-ink font-semibold bg-accent-soft' : 'text-ink-muted'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="mt-6 space-y-3">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenTrack();
              }}
            >
              Track Order Status
            </Button>
            <Button
              className="w-full"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenQuote();
              }}
              withArrow
            >
              Request a Quote
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};
