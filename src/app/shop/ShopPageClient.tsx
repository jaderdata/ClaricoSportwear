'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { QuoteFormModal } from '@/components/QuoteFormModal';
import { TrackStatusModal } from '@/components/TrackStatusModal';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { ShopProductCard } from '@/components/shop/ShopProductCard';
import { getActiveStoreProducts, StoreProductWithVariants } from '@/lib/store';

export default function ShopPageClient() {
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [trackModalOpen, setTrackModalOpen] = useState(false);
  const [products, setProducts] = useState<StoreProductWithVariants[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActiveStoreProducts()
      .then(setProducts)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col">
      <Navbar onOpenQuote={() => setQuoteModalOpen(true)} onOpenTrack={() => setTrackModalOpen(true)} />

      <main className="grow pt-32 sm:pt-40">
        <Section border="none" className="pt-0 sm:pt-0">
          <Container>
            <div className="max-w-2xl mb-12">
              <p className="eyebrow mb-4">Shop the Collection</p>
              <h1 className="font-display text-h1 text-ink">Ready-to-ship designs.</h1>
              <p className="text-body text-ink-muted mt-4 leading-relaxed">
                Individual pieces, shipped as-is — no quote needed. Add to your cart and check out directly.
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-4/5 bg-border rounded-card" />
                    <div className="mt-4 space-y-2">
                      <div className="h-3 w-1/3 bg-border rounded" />
                      <div className="h-4 w-2/3 bg-border rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="py-24 text-center text-ink-muted">
                <p className="text-[15px]">No products are live yet — check back soon.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
                {products.map((product) => (
                  <ShopProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </Container>
        </Section>
      </main>

      <Footer onOpenQuote={() => setQuoteModalOpen(true)} />

      <QuoteFormModal isOpen={quoteModalOpen} onClose={() => setQuoteModalOpen(false)} />
      <TrackStatusModal isOpen={trackModalOpen} onClose={() => setTrackModalOpen(false)} />
    </div>
  );
}
