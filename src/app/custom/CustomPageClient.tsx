'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { QuoteFormModal } from '@/components/QuoteFormModal';
import { TrackStatusModal } from '@/components/TrackStatusModal';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';

const useCases = [
  { label: 'Birthdays', desc: 'Make it personal with a one-of-a-kind birthday shirt.' },
  { label: 'Family Events', desc: 'Family reunions, trips, and gatherings made memorable.' },
  { label: 'Bachelorette', desc: 'Custom party shirts for every member of the squad.' },
  { label: 'Group Trips', desc: 'Matching travel gear that everyone will actually keep.' },
  { label: 'Personalized Gifts', desc: 'The most thoughtful gift you can give — made uniquely for them.' },
  { label: 'Memorial Shirts', desc: 'Honor someone with a custom tribute piece.' },
  { label: 'Photo Shirts', desc: 'Your favorite photo printed with premium DTF quality.' },
  { label: 'Special Occasions', desc: 'Graduations, retirements, anniversaries — any moment worth wearing.' },
];

const orderSteps = [
  {
    number: '01',
    title: 'Choose your apparel',
    desc: 'Select your shirt style, fabric, and color. Next Level 3600 adult or 3310 youth tees, plus fleece hoodies.',
  },
  {
    number: '02',
    title: 'Upload your design',
    desc: "Share your logo, photo, sketch, screenshot, or idea. You don't need a finished design — we can help.",
  },
  {
    number: '03',
    title: 'Tell us what you want',
    desc: 'Describe placement, text, names, numbers, or any customization details. Our team reads every note.',
  },
  {
    number: '04',
    title: 'Receive preview & quote',
    desc: 'We send you a digital mockup and custom pricing within 24 business hours. You approve before we print.',
  },
  {
    number: '05',
    title: 'Approve & produce',
    desc: 'Once you approve, your order enters production. Printed and shipped in 3–5 business days.',
  },
];

export default function CustomPageClient() {
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [trackModalOpen, setTrackModalOpen] = useState(false);

  const handleOpenQuote = () => setQuoteModalOpen(true);

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col">
      <Navbar onOpenQuote={handleOpenQuote} onOpenTrack={() => setTrackModalOpen(true)} />

      <main className="grow">
        {/* ── HERO ── */}
        <section className="relative pt-32 sm:pt-36 pb-16 sm:pb-24 bg-ink overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-accent/5 blur-3xl pointer-events-none" />

          <Container className="relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              <div className="lg:col-span-7 animate-reveal">
                <p className="eyebrow text-accent mb-4">Custom — Personal Apparel</p>
                <h1 className="font-display text-display-xl text-paper mb-6">
                  You imagine it.
                  <br />
                  We print it.
                </h1>
                <p className="text-body-lg text-paper/75 max-w-xl mb-10 leading-relaxed">
                  Turn your idea, photo, logo, or sketch into premium custom apparel. No design degree required, no minimum order — just your idea, made real.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <Button onClick={handleOpenQuote} size="lg" withArrow>
                    Start Your Custom Order
                  </Button>
                  <Button href="#use-cases" variant="secondary" size="lg" className="border-paper/30! text-paper! hover:border-paper!">
                    See Custom Ideas
                  </Button>
                </div>
                <div className="pt-6 border-t border-paper/10 flex flex-wrap items-center gap-6 text-paper/60 text-sm">
                  <span>✓ 100% Cotton Blanks</span>
                  <span>✓ High-Definition DTF</span>
                  <span>✓ 3–5 Day Turnaround</span>
                </div>
              </div>

              <div className="lg:col-span-5 relative">
                <div className="relative aspect-4/5 max-w-md mx-auto rounded-panel overflow-hidden border border-paper/15 shadow-2xl group">
                  <img
                    src="/images/custom-music-tshirt.jpg"
                    alt="Custom printed t-shirt apparel"
                    className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute bottom-4 left-4 right-4 bg-ink/80 backdrop-blur-md p-4 rounded-card border border-paper/10 text-paper flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-accent font-semibold">Live Showcase</p>
                      <p className="text-sm font-medium text-paper mt-0.5">Oversized Custom Tee</p>
                    </div>
                    <span className="text-xs bg-paper/10 px-2.5 py-1 rounded-full text-paper/80 font-mono">No Minimum</span>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* ── NO MINIMUM STATEMENT ── */}
        <Section border="top">
          <Container>
            <p className="font-display text-display text-ink leading-none">
              No minimum.
              <br />
              <span className="text-accent">1 or 1,000.</span>
            </p>
            <p className="mt-6 text-body-lg text-ink-muted max-w-md">
              Order exactly what you need. You&apos;re never too small for premium custom.
            </p>
          </Container>
        </Section>

        {/* ── USE CASES ── */}
        <Section id="use-cases" border="top">
          <Container>
            <div className="max-w-2xl mb-14">
              <p className="eyebrow mb-4">Custom Apparel For Any Moment</p>
              <h2 className="font-display text-h1 text-ink">What are you celebrating?</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10 pt-6 border-t border-border">
              {useCases.map((uc) => (
                <div key={uc.label}>
                  <h3 className="text-[15px] font-medium text-ink mb-2">{uc.label}</h3>
                  <p className="text-sm text-ink-muted leading-relaxed">{uc.desc}</p>
                </div>
              ))}
            </div>
          </Container>
        </Section>

        {/* ── HOW TO ORDER ── */}
        <Section border="top">
          <Container>
            <div className="max-w-2xl mb-16">
              <p className="eyebrow mb-4">Simple & Personal</p>
              <h2 className="font-display text-h1 text-ink">How custom ordering works.</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-x-8 gap-y-12">
              {orderSteps.map((step) => (
                <div key={step.number} className="pt-6 border-t border-border">
                  <span className="text-sm text-ink-faint font-medium">{step.number}</span>
                  <h3 className="text-[15px] font-medium text-ink mt-4 mb-2">{step.title}</h3>
                  <p className="text-sm text-ink-muted leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-16">
              <Button onClick={handleOpenQuote} size="lg" withArrow>
                Request Custom Quote
              </Button>
            </div>
          </Container>
        </Section>
      </main>

      <Footer onOpenQuote={handleOpenQuote} />

      <QuoteFormModal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        initialProductName="Personal Custom Apparel"
      />

      <TrackStatusModal isOpen={trackModalOpen} onClose={() => setTrackModalOpen(false)} />
    </div>
  );
}
