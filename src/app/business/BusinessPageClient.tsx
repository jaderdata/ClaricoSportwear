'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { QuoteFormModal } from '@/components/QuoteFormModal';
import { TrackStatusModal } from '@/components/TrackStatusModal';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';

const industries = [
  { label: 'Restaurants', desc: 'Staff uniforms, event shirts, and branded front-of-house apparel.' },
  { label: 'Construction', desc: 'Work shirts, crew tees, and branded safety-ready apparel.' },
  { label: 'Landscaping', desc: 'Team shirts that represent your crew in the field.' },
  { label: 'Cleaning', desc: 'Branded uniforms that look professional and build trust.' },
  { label: 'Automotive', desc: 'Shop shirts, dealership polos, and service team apparel.' },
  { label: 'Gyms', desc: 'Staff uniforms, merchandise, and member apparel.' },
  { label: 'Real Estate', desc: 'Team shirts for open houses, events, and daily wear.' },
  { label: 'Service Companies', desc: 'Brand your delivery, installation, or service team.' },
];

const productTypes = [
  { label: 'Company T-Shirts', detail: 'Classic crew tees in your brand colors with your logo.' },
  { label: 'Employee Uniforms', detail: 'Cohesive staff apparel that builds brand recognition.' },
  { label: 'Polo Shirts', detail: 'Professional polos for client-facing and management staff.' },
  { label: 'Work Shirts', detail: 'Durable everyday work shirts branded for your crew.' },
  { label: 'Hoodies', detail: 'Branded fleece hoodies for team events and cooler days.' },
  { label: 'Event Apparel', detail: 'Custom shirts for company events, conferences, and promotions.' },
  { label: 'Staff Apparel', detail: 'Consistent on-brand attire for every team member.' },
  { label: 'Promotional Apparel', detail: 'Branded merchandise for trade shows and client gifts.' },
];

const valuePoints = [
  {
    title: 'Your brand, everywhere',
    desc: 'When your team wears your logo, every customer interaction becomes a brand impression. We help you build that identity consistently.',
  },
  {
    title: 'No bulk requirement',
    desc: 'Onboard a new employee? Need one extra shirt? Reorder 5 pieces without waiting for a full batch. We produce every quantity.',
  },
  {
    title: 'Professional quality',
    desc: 'Gildan blank garments combined with DTF printing that doesn\'t crack, peel, or fade — even through heavy commercial washing.',
  },
  {
    title: 'Fast business turnaround',
    desc: 'We know businesses move fast. Standard production in 3–5 business days means your team is ready when you need them.',
  },
];

export default function BusinessPageClient() {
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
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=2400')` }}
          />
          <div className="absolute inset-0 bg-linear-to-t from-ink/90 via-ink/25 to-ink/10" />

          <Container className="relative z-10 pb-16 sm:pb-24 pt-40">
            <div className="max-w-3xl animate-reveal">
              <p className="eyebrow text-paper/60 mb-6">Business — Professional Apparel</p>
              <h1 className="font-display text-display-xl text-paper mb-6">
                Make your team
                <br />
                look like a team.
              </h1>
              <p className="text-body-lg text-paper/75 max-w-xl mb-10 leading-relaxed">
                Professional custom apparel and uniforms for businesses of any size. From restaurants and contractors to gyms and retail — your team represents your brand.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={handleOpenQuote} size="lg" withArrow>
                  Build Your Team Apparel
                </Button>
                <Button href="#industries" variant="secondary" size="lg" className="border-paper/30! text-paper! hover:border-paper!">
                  Explore Business Uniforms
                </Button>
              </div>
            </div>
          </Container>
        </section>

        {/* ── INDUSTRIES WE SERVE ── */}
        <Section id="industries" border="top">
          <Container>
            <div className="max-w-2xl mb-14">
              <p className="eyebrow mb-4">Industries We Serve</p>
              <h2 className="font-display text-h1 text-ink">Built for every business type.</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10 pt-6 border-t border-border">
              {industries.map((ind) => (
                <div key={ind.label}>
                  <h3 className="text-[15px] font-medium text-ink mb-2">{ind.label}</h3>
                  <p className="text-sm text-ink-muted leading-relaxed">{ind.desc}</p>
                </div>
              ))}
            </div>
          </Container>
        </Section>

        {/* ── VALUE PILLARS FOR BUSINESS ── */}
        <Section border="top">
          <Container>
            <div className="max-w-2xl mb-16">
              <p className="eyebrow mb-4">Why Businesses Choose Clarico</p>
              <h2 className="font-display text-h1 text-ink">Apparel built for commercial use.</h2>
            </div>

            <div className="border-t border-border">
              {valuePoints.map((vp) => (
                <div key={vp.title} className="grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-8 py-8 border-b border-border">
                  <div className="sm:col-span-4">
                    <h3 className="text-[15px] font-medium text-ink">{vp.title}</h3>
                  </div>
                  <div className="sm:col-span-8">
                    <p className="text-body text-ink-muted leading-relaxed max-w-xl">{vp.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </Section>

        {/* ── BUSINESS PRODUCT TYPES ── */}
        <Section border="top">
          <Container>
            <div className="max-w-2xl mb-14">
              <p className="eyebrow mb-4">Business Catalog</p>
              <h2 className="font-display text-h1 text-ink">Uniform & staff solutions.</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10 pt-6 border-t border-border">
              {productTypes.map((pt) => (
                <div key={pt.label}>
                  <h3 className="text-[15px] font-medium text-ink mb-2">{pt.label}</h3>
                  <p className="text-sm text-ink-muted leading-relaxed">{pt.detail}</p>
                </div>
              ))}
            </div>

            <div className="mt-16">
              <Button onClick={handleOpenQuote} size="lg" withArrow>
                Request Business Quote
              </Button>
            </div>
          </Container>
        </Section>
      </main>

      <Footer onOpenQuote={handleOpenQuote} />

      <QuoteFormModal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        initialProductName="Business Custom Uniform"
      />

      <TrackStatusModal isOpen={trackModalOpen} onClose={() => setTrackModalOpen(false)} />
    </div>
  );
}
