'use client';

import React from 'react';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';

export const ValueProps: React.FC = () => {
  const pillars = [
    {
      num: '01',
      title: 'Fast turnaround.',
      description: 'A streamlined production pipeline gets your order printed, inspected, and shipped in days, not weeks — so your team, event, or business is ready when it matters.',
    },
    {
      num: '02',
      title: 'No minimum. 1 or 1,000.',
      description: 'Order exactly what you need — a single gift, or a full season of team kits — with no bulk requirements standing in the way.',
    },
    {
      num: '03',
      title: 'Fully custom.',
      description: 'Every project is built around your identity — logo, colors, name, brand. From academy crests to business uniforms, it starts with your idea.',
    },
    {
      num: '04',
      title: 'Premium quality.',
      description: 'Gildan 3600 and 64000 Softstyle blanks, printed with high-definition DTF for vivid, durable detail that holds up wash after wash.',
    },
  ];

  return (
    <Section id="value-pillars" border="top">
      <Container>
        <div className="max-w-2xl mb-16 sm:mb-20">
          <p className="eyebrow mb-4">Why Clarico</p>
          <h2 className="font-display text-h1 text-ink">The same promise, every order.</h2>
        </div>

        <div className="border-t border-border">
          {pillars.map((pillar) => (
            <div key={pillar.num} className="grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-8 py-10 border-b border-border">
              <div className="sm:col-span-1 text-sm text-ink-faint font-medium">{pillar.num}</div>
              <div className="sm:col-span-4">
                <h3 className="font-display text-h3 text-ink">{pillar.title}</h3>
              </div>
              <div className="sm:col-span-7">
                <p className="text-body text-ink-muted leading-relaxed max-w-xl">{pillar.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
};
