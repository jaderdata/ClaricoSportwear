import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ShopProductCard } from '../shop/ShopProductCard';
import { StoreProductWithVariants } from '@/lib/store';

// Mock CartProvider
vi.mock('@/components/cart/CartProvider', () => ({
  useCart: () => ({
    addItem: vi.fn().mockResolvedValue(undefined),
  }),
}));

// Mock Supabase browser client
vi.mock('@/lib/supabase-browser', () => ({
  supabase: {
    storage: {
      from: () => ({
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://example.com/${path}` } }),
      }),
    },
  },
}));

const dummyProduct: StoreProductWithVariants = {
  id: 'prod-1',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  slug: 'test-tee',
  title: 'Test Athletic Graphic Tee',
  description: 'High quality sportswear tee',
  category: 'Tees',
  subcategory: null,
  brand: 'Clarico',
  condition: 'New',
  material: 'Cotton',
  status: 'active',
  tags: ['tee', 'sport'],
  variants: [
    {
      id: 'var-1',
      created_at: new Date().toISOString(),
      product_id: 'prod-1',
      size: 'M',
      color: 'Black',
      price: 29.99,
      currency: 'USD',
      quantity: 10,
      sku: 'TEE-BLK-M',
      images: [
        {
          id: 'img-1',
          variant_id: 'var-1',
          position: 1,
          storage_path: 'tee-front.png',
          source_url: null,
        },
        {
          id: 'img-2',
          variant_id: 'var-1',
          position: 2,
          storage_path: 'tee-back.png',
          source_url: null,
        },
      ],
    },
    {
      id: 'var-2',
      created_at: new Date().toISOString(),
      product_id: 'prod-1',
      size: 'L',
      color: 'Black',
      price: 29.99,
      currency: 'USD',
      quantity: 5,
      sku: 'TEE-BLK-L',
      images: [],
    },
  ],
};

describe('ShopProductCard Component', () => {
  it('renders product title, category, price and photo badge correctly', () => {
    render(<ShopProductCard product={dummyProduct} />);

    expect(screen.getByText('Test Athletic Graphic Tee')).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toBeInTheDocument();
    expect(screen.getByText('2 photos')).toBeInTheDocument();
  });

  it('opens ShopProductModal when clicking product image or details button', () => {
    render(<ShopProductCard product={dummyProduct} />);

    // Click the view details button
    const viewButton = screen.getByRole('button', { name: /View photos and details for Test Athletic Graphic Tee/i });
    fireEvent.click(viewButton);

    // Modal should now be rendered with product details
    expect(screen.getByText('Material:')).toBeInTheDocument();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });
});
