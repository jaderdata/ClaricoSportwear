'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { QuoteFormModal } from '@/components/QuoteFormModal';
import { TrackStatusModal } from '@/components/TrackStatusModal';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { ShopProductCard } from '@/components/shop/ShopProductCard';
import { getActiveStoreProducts, StoreProductWithVariants } from '@/lib/store';
import { ArrowUpDown, Filter, Sparkles } from 'lucide-react';

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'title';

export default function ShopPageClient() {
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [trackModalOpen, setTrackModalOpen] = useState(false);
  const [products, setProducts] = useState<StoreProductWithVariants[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  useEffect(() => {
    getActiveStoreProducts()
      .then(setProducts)
      .finally(() => setLoading(false));
  }, []);

  // Compute available categories dynamically
  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return ['All', ...Array.from(cats)];
  }, [products]);

  // Filter and sort products
  const processedProducts = useMemo(() => {
    let result = [...products];

    if (selectedCategory !== 'All') {
      result = result.filter((p) => p.category === selectedCategory);
    }

    result.sort((a, b) => {
      const priceA = a.variants[0]?.price || 0;
      const priceB = b.variants[0]?.price || 0;

      if (sortBy === 'price-asc') return priceA - priceB;
      if (sortBy === 'price-desc') return priceB - priceA;
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      // default: newest
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return result;
  }, [products, selectedCategory, sortBy]);

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col">
      <Navbar onOpenQuote={() => setQuoteModalOpen(true)} onOpenTrack={() => setTrackModalOpen(true)} />

      <main className="grow pt-32 sm:pt-36">
        <Section border="none" className="pt-0 sm:pt-0 pb-20">
          <Container>
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-8 border-b border-border">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-soft text-accent text-xs font-semibold uppercase tracking-wider mb-4 border border-accent/10">
                  <Sparkles className="size-3.5" />
                  Ready-to-Ship Collection
                </div>
                <h1 className="font-display text-h1 text-ink">Premium Athletic Gear.</h1>
                <p className="text-body-lg text-ink-muted mt-3 leading-relaxed">
                  Individual pieces, shipped directly — no quote needed. Select your size, browse full high-res photos, and order instantly.
                </p>
              </div>

              {/* Items Counter Badge */}
              {!loading && (
                <div className="text-xs text-ink-muted font-medium bg-paper-raised px-4 py-2 rounded-xl border border-border shrink-0 self-start md:self-auto shadow-xs">
                  Showing <span className="font-bold text-ink">{processedProducts.length}</span> {processedProducts.length === 1 ? 'item' : 'items'}
                </div>
              )}
            </div>

            {/* Filter & Sort Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-10">
              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
                <Filter className="size-4 text-ink-muted shrink-0 mr-1 hidden sm:block" />
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-ink text-paper shadow-md scale-102'
                        : 'bg-paper-raised text-ink-muted border border-border hover:border-ink/40 hover:text-ink'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Sorting Controls */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <ArrowUpDown className="size-3.5 text-ink-muted" />
                <span className="text-xs text-ink-muted font-medium whitespace-nowrap">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="text-xs font-semibold bg-paper-raised text-ink border border-border rounded-xl px-3 py-2 cursor-pointer hover:border-ink/40 focus:outline-none focus:ring-1 focus:ring-accent shadow-xs"
                >
                  <option value="newest">Newest Arrivals</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="title">Title: A – Z</option>
                </select>
              </div>
            </div>

            {/* Product Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse bg-paper-raised border border-border rounded-2xl overflow-hidden p-4 space-y-4">
                    <div className="aspect-4/5 bg-border/60 rounded-xl" />
                    <div className="space-y-2">
                      <div className="h-3 w-1/3 bg-border/60 rounded" />
                      <div className="h-4 w-3/4 bg-border/60 rounded" />
                      <div className="h-4 w-1/4 bg-border/60 rounded" />
                    </div>
                    <div className="h-10 w-full bg-border/60 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : processedProducts.length === 0 ? (
              <div className="py-24 text-center text-ink-muted bg-paper-raised rounded-2xl border border-border p-8">
                <p className="text-base font-medium text-ink mb-1">No products found</p>
                <p className="text-xs text-ink-muted">Try changing your category filter or check back later.</p>
                {selectedCategory !== 'All' && (
                  <button
                    onClick={() => setSelectedCategory('All')}
                    className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-accent text-paper hover:bg-accent-hover transition-colors cursor-pointer"
                  >
                    View All Products
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {processedProducts.map((product) => (
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
