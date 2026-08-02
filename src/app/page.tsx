'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { SegmentCards } from '@/components/SegmentCards';
import { ValueProps } from '@/components/ValueProps';
import { HowItWorks } from '@/components/HowItWorks';
import { CatalogSection } from '@/components/CatalogSection';
import { CustomizerSection } from '@/components/CustomizerSection';
import { Footer } from '@/components/Footer';
import { QuoteFormModal } from '@/components/QuoteFormModal';
import { TrackStatusModal } from '@/components/TrackStatusModal';

import { PartnerCarousel } from '@/components/PartnerCarousel';

export default function Home() {
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [trackModalOpen, setTrackModalOpen] = useState(false);
  const [selectedProductName, setSelectedProductName] = useState<string>('');
  const [selectedCustomNotes, setSelectedCustomNotes] = useState<string>('');

  const handleOpenQuote = (productName?: string, customNotes?: string) => {
    setSelectedProductName(productName || '');
    setSelectedCustomNotes(customNotes || '');
    setQuoteModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col justify-between selection:bg-accent selection:text-paper">
      
      {/* Navigation */}
      <Navbar
        onOpenQuote={handleOpenQuote}
        onOpenTrack={() => setTrackModalOpen(true)}
      />

      {/* Main Page Sections */}
      <main className="grow">
        <Hero onOpenQuote={() => handleOpenQuote()} />
        <SegmentCards />
        <PartnerCarousel />
        <ValueProps />
        <HowItWorks onOpenQuote={() => handleOpenQuote()} />
        <CatalogSection onOpenQuote={handleOpenQuote} />
        
        {/* Interactive Live Shirt Customizer & Mockup Previewer */}
        <CustomizerSection onOpenQuote={handleOpenQuote} />
      </main>

      {/* Footer */}
      <Footer onOpenQuote={() => handleOpenQuote()} />

      {/* Interactive Quote Request Modal */}
      <QuoteFormModal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        initialProductName={selectedProductName}
        initialNotes={selectedCustomNotes}
      />

      {/* Real-time Order Tracking Modal */}
      <TrackStatusModal
        isOpen={trackModalOpen}
        onClose={() => setTrackModalOpen(false)}
      />

    </div>
  );
}
