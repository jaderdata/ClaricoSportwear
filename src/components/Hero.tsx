'use client';

import React from 'react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';

interface HeroProps {
  onOpenQuote: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenQuote }) => {
  return (
    <section className="relative min-h-[92vh] flex items-end overflow-hidden bg-ink">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('/images/hero-bg.png')` }}
      />
      <div className="absolute inset-0 bg-linear-to-t from-ink/90 via-ink/20 to-ink/10" />

      <Container className="relative z-10 pb-16 sm:pb-24 pt-40">
        <div className="max-w-3xl animate-reveal">
          <p className="eyebrow text-paper/60 mb-6">Sports Apparel Studio — Academy & Team Gear</p>
          <h1 className="font-display text-display-xl text-paper mb-6">
            Built for Teams
            <br />
            & Academies.
          </h1>
          <p className="text-body-lg text-paper/75 max-w-xl mb-10 leading-relaxed">
            Fast turnaround. No minimums. Fully customizable. From Jiu-Jitsu academy kits to tournament merch and fight team apparel, we print it with the craft it deserves.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={onOpenQuote} size="lg" withArrow>
              Start Your Design
            </Button>
            <Button href="#segment-cards" variant="secondary" size="lg" className="border-paper/30! text-paper! hover:border-paper!">
              Explore Our Work
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
};
