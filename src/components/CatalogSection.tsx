'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { supabase, Product } from '@/lib/supabase';
import { ProductModal } from './ProductModal';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';

interface CatalogSectionProps {
  onOpenQuote: (productName?: string) => void;
}

const FALLBACK_PRODUCTS: Product[] = [
  {
    id: '1',
    created_at: new Date().toISOString(),
    slug: 'gildan-3600-classic-academy-tee',
    name: 'Classic Academy Custom Tee',
    category: 'Academy Collection',
    gildan_model: 'Gildan 3600',
    print_technology: 'DTF Premium',
    description: 'Ultra-durable classic crewneck shirt designed for everyday gym wear, coaching staff, and student apparel.',
    fabric_details: '100% Ring Spun Cotton • 6.0 oz/yd²',
    colors: ['Black', 'White', 'Navy Blue', 'Charcoal', 'Red'],
    estimated_days: 5,
    price_starting_at: 14.50,
    image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=800',
    is_featured: true
  },
  {
    id: '2',
    created_at: new Date().toISOString(),
    slug: 'gildan-64000-softstyle-event-tee',
    name: 'Softstyle Event & Tournament Tee',
    category: 'Event Collection',
    gildan_model: 'Gildan 64000 Softstyle',
    print_technology: 'DTF Premium',
    description: 'Lightweight, ultra-soft athletic fit ideal for event giveaways, spectator shirts, and tournament merch lines.',
    fabric_details: '100% Preshrunk Ring-Spun Cotton • 4.5 oz/yd²',
    colors: ['Black', 'Sport Grey', 'Royal Blue', 'Dark Heather'],
    estimated_days: 3,
    price_starting_at: 12.90,
    image_url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=800',
    is_featured: true
  },
  {
    id: '3',
    created_at: new Date().toISOString(),
    slug: 'oversized-streetwear-academy-tee',
    name: 'Heavyweight Oversized Street Tee',
    category: 'Oversized',
    gildan_model: 'Gildan 3600 Heavy',
    print_technology: 'DTF Premium',
    description: 'Modern relaxed drop-shoulder cut popular with competition teams and lifestyle sportswear collections.',
    fabric_details: '100% Heavyweight Cotton • 7.5 oz/yd²',
    colors: ['Washed Black', 'Bone White', 'Olive Green'],
    estimated_days: 5,
    price_starting_at: 18.00,
    image_url: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&q=80&w=800',
    is_featured: true
  },
  {
    id: '4',
    created_at: new Date().toISOString(),
    slug: 'custom-academy-heavy-fleece-hoodie',
    name: 'Heavyweight Academy Pullover Hoodie',
    category: 'Hoodies',
    gildan_model: 'Gildan 18000 Heavy Blend',
    print_technology: 'DTF Premium',
    description: 'Warm fleece hoodie featuring custom back print, chest academy crest, and sleeve prints.',
    fabric_details: '50% Cotton / 50% Polyester • 8.0 oz/yd²',
    colors: ['Black', 'Dark Heather', 'Navy'],
    estimated_days: 6,
    price_starting_at: 28.00,
    image_url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=800',
    is_featured: true
  }
];

export const CatalogSection: React.FC<CatalogSectionProps> = ({ onOpenQuote }) => {
  const [products, setProducts] = useState<Product[]>(FALLBACK_PRODUCTS);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const categories = [
    'All',
    'Academy Collection',
    'Event Collection',
    'Oversized',
    'Competition Shirts',
    'Women\'s Collection',
    'Kids Collection',
    'Hoodies',
    'Accessories'
  ];

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data } = await supabase.from('cs_products').select('*');
        if (data && data.length > 0) {
          setProducts(data);
        }
      } catch (err) {
        console.error('Failed fetching products from Supabase:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const filteredProducts = selectedCategory === 'All'
    ? products
    : products.filter(p => p.category === selectedCategory);

  return (
    <Section id="collections" border="top">
      <Container>
        <div className="max-w-2xl mb-12">
          <p className="eyebrow mb-4">Explore the Catalog</p>
          <h2 className="font-display text-h1 text-ink">Curated collections.</h2>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-14 pb-6 border-b border-border">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-[15px] transition-colors cursor-pointer ${
                selectedCategory === cat ? 'text-ink font-medium' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
          {loading && filteredProducts.length === 0 ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-4/5 bg-border rounded-card" />
                <div className="mt-4 space-y-2">
                  <div className="h-3 w-1/3 bg-border rounded" />
                  <div className="h-4 w-2/3 bg-border rounded" />
                </div>
              </div>
            ))
          ) : filteredProducts.map((product) => (
            <div key={product.id} className="group">
              <div
                className="relative aspect-4/5 overflow-hidden rounded-card cursor-pointer bg-border"
                onClick={() => setSelectedProduct(product)}
              >
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                />
              </div>

              <div className="mt-4 flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm text-ink-muted">{product.gildan_model}</div>
                  <h3
                    onClick={() => setSelectedProduct(product)}
                    className="text-[15px] font-medium text-ink cursor-pointer mt-0.5"
                  >
                    {product.name}
                  </h3>
                  <div className="text-sm text-ink-muted mt-1">From ${Number(product.price_starting_at).toFixed(2)}</div>
                </div>

                <button
                  onClick={() => onOpenQuote(product.name)}
                  aria-label={`Customize ${product.name}`}
                  className="touch-target shrink-0 text-ink-muted hover:text-accent transition-colors cursor-pointer mt-1"
                >
                  <ArrowRight className="size-5" strokeWidth={1.75} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Container>

      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onSelectProductForQuote={(prodName) => onOpenQuote(prodName)}
      />
    </Section>
  );
};
