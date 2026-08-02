'use client';

import React from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';

interface FooterProps {
  onOpenQuote: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenQuote }) => {
  return (
    <footer className="bg-paper border-t border-border pt-20 pb-10">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-16">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-0 select-none">
              <span className="text-body font-black uppercase tracking-[0.04em] text-ink leading-none">Clarico</span>
              <span className="mx-2.25 w-px h-3.5 bg-accent shrink-0" aria-hidden="true" />
              <span className="text-[13px] font-semibold uppercase tracking-[0.18em] text-accent leading-none">Studio</span>
            </div>
            <p className="text-[15px] text-ink-muted leading-relaxed max-w-xs">
              A premium custom apparel studio dedicated to sports teams, Jiu-Jitsu academies, and athletic organizations. No minimum order, fast turnaround, premium print quality.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-ink">Sport Categories</h4>
            <ul className="space-y-3 text-[15px] text-ink-muted">
              <li><Link href="/sports#sport-types" className="hover:text-ink transition-colors">Jiu-Jitsu Academies</Link></li>
              <li><Link href="/sports#sport-types" className="hover:text-ink transition-colors">MMA & Fight Teams</Link></li>
              <li><Link href="/sports#sport-types" className="hover:text-ink transition-colors">Wrestling & Combat</Link></li>
              <li><Link href="/sports#sport-types" className="hover:text-ink transition-colors">CrossFit & Fitness</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-ink">Navigation</h4>
            <ul className="space-y-3 text-[15px] text-ink-muted">
              <li><Link href="/#how-it-works" className="hover:text-ink transition-colors">How It Works</Link></li>
              <li><Link href="/#collections" className="hover:text-ink transition-colors">Apparel Catalog</Link></li>
              <li><Link href="/#value-pillars" className="hover:text-ink transition-colors">Why Choose Us</Link></li>
              <li><Link href="/sports#trusted-academies" className="hover:text-ink transition-colors">Academy Partners</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-ink">Contact</h4>
            <div className="space-y-3 text-[15px] text-ink-muted">
              <div>support@claricostudio.com</div>
              <div>+1 (800) 555-CLARICO</div>
              <div>United States</div>
            </div>
            <button
              onClick={onOpenQuote}
              className="text-[15px] font-medium text-accent hover:text-accent-hover transition-colors cursor-pointer"
            >
              Request a Quote →
            </button>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-ink-muted">
          <div>© {new Date().getFullYear()} Clarico Studio. All rights reserved.</div>
          <div className="flex gap-6">
            <span className="hover:text-ink cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-ink cursor-pointer transition-colors">Terms of Service</span>
          </div>
        </div>
      </Container>
    </footer>
  );
};
