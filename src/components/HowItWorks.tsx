'use client';

import React from 'react';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';

interface HowItWorksProps {
  onOpenQuote: () => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onOpenQuote }) => {
  const steps = [
    {
      number: '01',
      title: 'Choose your style',
      description: 'Classic Gildan 3600 heavy cotton, 64000 Softstyle, oversized street tees, or competition dry-fits.',
    },
    {
      number: '02',
      title: 'Upload your logo',
      description: 'Drag and drop your artwork (PNG, SVG, PDF, AI, EPS). No vector file? Our team will refine it, free.',
    },
    {
      number: '03',
      title: 'Approve the mockup',
      description: 'Receive a digital mockup with chest, back, and sleeve placements for final sign-off.',
    },
    {
      number: '04',
      title: 'Print and ship',
      description: 'Your order goes into precision DTF printing and ships within 3–5 business days.',
    },
  ];

  return (
    <Section id="how-it-works" border="top">
      <Container>
        <div className="max-w-2xl mb-16 sm:mb-20">
          <p className="eyebrow mb-4">Simple 4-Step Process</p>
          <h2 className="font-display text-h1 text-ink">How it works.</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-14">
          {steps.map((step) => (
            <div key={step.number} className="pt-6 border-t border-border">
              <span className="text-sm text-ink-faint font-medium">{step.number}</span>
              <h3 className="font-display text-h3 text-ink mt-4 mb-3">{step.title}</h3>
              <p className="text-[15px] text-ink-muted leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 sm:mt-20">
          <Button onClick={onOpenQuote} size="lg" withArrow>
            Start Your Custom Order
          </Button>
        </div>
      </Container>
    </Section>
  );
};
