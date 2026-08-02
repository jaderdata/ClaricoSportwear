'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';

export const SegmentCards: React.FC = () => {
  const segments = [
    {
      id: 'sports',
      href: '/sports',
      tag: 'Sports',
      headline: 'Built for the team.',
      description: 'Custom apparel for Jiu-Jitsu academies, tournament teams, coaches, and events. Your identity, on the mat and off it.',
      cta: 'Explore Sports',
      image: '/images/bjj-championship-shirt.png',
    },
    {
      id: 'custom',
      href: '/custom',
      tag: 'Custom',
      headline: 'Your idea. Your shirt.',
      description: 'Birthdays, reunions, gifts, personal projects — turn any idea into premium apparel. One piece or one hundred.',
      cta: 'Create Something',
      image: '/images/custom-music-tshirt.jpg',
    },
    {
      id: 'business',
      href: '/business',
      tag: 'Business',
      headline: 'Your team. Your brand.',
      description: 'Professional apparel and uniforms for restaurants, contractors, gyms, and retail teams that want to look the part.',
      cta: 'Build Your Team',
      image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=1600',
    },
  ];

  return (
    <Section id="segment-cards" border="top">
      <Container>
        <div className="max-w-2xl mb-16 sm:mb-20">
          <p className="eyebrow mb-4">One Platform. Three Audiences.</p>
          <h2 className="font-display text-h1 text-ink">What are you creating?</h2>
        </div>

        <div className="space-y-20 sm:space-y-28">
          {segments.map((seg, idx) => (
            <Link
              key={seg.id}
              href={seg.href}
              className={`group flex flex-col ${idx % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-8 lg:gap-16`}
            >
              <div className="w-full lg:w-7/12 aspect-4/3 overflow-hidden rounded-card">
                <div
                  className="w-full h-full bg-cover bg-top transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  style={{ backgroundImage: `url('${seg.image}')` }}
                />
              </div>
              <div className="w-full lg:w-5/12">
                <p className="eyebrow mb-4">{seg.tag}</p>
                <h3 className="font-display text-h2 text-ink mb-4">{seg.headline}</h3>
                <p className="text-body text-ink-muted leading-relaxed mb-6 max-w-md">{seg.description}</p>
                <span className="inline-flex items-center gap-2 text-[15px] font-medium text-ink">
                  {seg.cta}
                  <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={2} />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-20 sm:mt-28 pt-10 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-8 text-center sm:text-left">
          {[
            { label: 'Fast Turnaround', sub: '3–5 business days' },
            { label: 'No Minimum', sub: 'Order 1 or 1,000' },
            { label: 'Fully Custom', sub: 'Your design, your way' },
            { label: 'Premium Quality', sub: 'Gildan + DTF printing' },
          ].map((v) => (
            <div key={v.label}>
              <div className="text-[15px] font-medium text-ink">{v.label}</div>
              <div className="text-sm text-ink-muted mt-1">{v.sub}</div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
};
