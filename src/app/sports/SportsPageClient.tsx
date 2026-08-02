'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { QuoteFormModal } from '@/components/QuoteFormModal';
import { TrackStatusModal } from '@/components/TrackStatusModal';
import { ValueProps } from '@/components/ValueProps';
import { PartnerCarousel } from '@/components/PartnerCarousel';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';

const sportCategories = [
  { name: 'Jiu-Jitsu Academies', sub: 'School Apparel · Custom Gis & Merch', primary: true },
];

const bjjCategories = [
  { label: 'Academy Shirts', desc: 'Represent your school every day on and off the mat.' },
  { label: 'Tournament Shirts', desc: 'Custom competition tees for teams competing at events.' },
  { label: 'Coach Apparel', desc: 'Premium staff shirts that carry your academy brand.' },
  { label: 'Kids Team Apparel', desc: 'Junior program shirts that grow your academy identity.' },
  { label: 'Event Shirts', desc: 'Seminars, camps, and special event custom gear.' },
  { label: 'Supporter Shirts', desc: 'Fan and spectator apparel for tournaments and galas.' },
];

export default function SportsPageClient() {
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [trackModalOpen, setTrackModalOpen] = useState(false);

  const handleOpenQuote = () => setQuoteModalOpen(true);

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col">
      <Navbar onOpenQuote={handleOpenQuote} onOpenTrack={() => setTrackModalOpen(true)} />

      <main className="grow">
        {/* ── HERO ── */}
        <section className="relative min-h-[88vh] flex items-end overflow-hidden bg-ink">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=2400')` }}
          />
          <div className="absolute inset-0 bg-linear-to-t from-ink/90 via-ink/25 to-ink/10" />

          <Container className="relative z-10 pb-16 sm:pb-24 pt-40">
            <div className="max-w-3xl animate-reveal">
              <p className="eyebrow text-paper/60 mb-6">Sports — Flagship Segment</p>
              <h1 className="font-display text-display-xl text-paper mb-6">
                Your Team.
                <br />
                Your Identity.
              </h1>
              <p className="text-body-lg text-paper/75 max-w-xl mb-10 leading-relaxed">
                Premium custom apparel focused 100% on Jiu-Jitsu academies, teams, athletes, and championship events.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={handleOpenQuote} size="lg" withArrow>
                  Create Your Team Shirt
                </Button>
                <Button href="#sport-types" variant="secondary" size="lg" className="border-paper/30! text-paper! hover:border-paper!">
                  Explore Sports Designs
                </Button>
              </div>
            </div>
          </Container>
        </section>

        {/* ── SPORT TYPES ── */}
        <Section id="sport-types" border="top">
          <Container>
            <div className="max-w-2xl mb-14">
              <p className="eyebrow mb-4">Sport Categories</p>
              <h2 className="font-display text-h1 text-ink">Built 100% for Jiu-Jitsu.</h2>
            </div>

            <div className="pt-6 border-t border-border">
              {sportCategories.map((sport) => (
                <div key={sport.name} className="max-w-md">
                  <p className={`text-[15px] ${sport.primary ? 'text-accent font-semibold' : 'text-ink font-medium'}`}>
                    {sport.name}
                  </p>
                  <p className="text-sm text-ink-muted mt-1 leading-snug">{sport.sub}</p>
                </div>
              ))}
            </div>
          </Container>
        </Section>

        {/* ── BJJ PRODUCT CATEGORIES ── */}
        <Section border="top">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
              <div>
                <p className="eyebrow mb-4">Jiu-Jitsu Specialization</p>
                <h2 className="font-display text-h2 text-ink mb-6 leading-tight">
                  Custom apparel built for the academy experience.
                </h2>
                <p className="text-body text-ink-muted leading-relaxed mb-8 max-w-md">
                  We understand the Jiu-Jitsu community. From a small academy ordering 5 shirts for a seminar to a gym network ordering 300+ pieces for a tournament — we scale with you, with no minimum ever required.
                </p>
                <Button onClick={handleOpenQuote} withArrow>
                  Start Your Academy Order
                </Button>
              </div>

              <div className="border-t border-border">
                {bjjCategories.map((cat) => (
                  <div key={cat.label} className="py-5 border-b border-border">
                    <h3 className="text-[15px] font-medium text-ink">{cat.label}</h3>
                    <p className="text-sm text-ink-muted mt-1">{cat.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </Section>

        {/* ── TRUSTED ACADEMIES (DYNAMIC FROM ADMIN PANEL) ── */}
        <PartnerCarousel />

        <ValueProps />
      </main>

      <Footer onOpenQuote={handleOpenQuote} />

      <QuoteFormModal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        initialProductName="Sports Team Custom Shirt"
      />

      <TrackStatusModal isOpen={trackModalOpen} onClose={() => setTrackModalOpen(false)} />
    </div>
  );
}
