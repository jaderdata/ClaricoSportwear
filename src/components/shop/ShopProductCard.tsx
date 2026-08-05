'use client';

import React, { useMemo, useState } from 'react';
import { StoreProductWithVariants, resolveImageUrl } from '@/lib/store';
import { useCart } from '@/components/cart/CartProvider';

interface Props {
  product: StoreProductWithVariants;
}

export const ShopProductCard: React.FC<Props> = ({ product }) => {
  const { addItem } = useCart();
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(product.variants[0]?.id);
  const [adding, setAdding] = useState(false);

  const selectedVariant = useMemo(
    () => product.variants.find((v) => v.id === selectedVariantId) || product.variants[0],
    [product.variants, selectedVariantId]
  );

  const sizes = useMemo(
    () => [...new Set(product.variants.map((v) => v.size).filter((s): s is string => Boolean(s)))],
    [product.variants]
  );
  const colors = useMemo(
    () => [...new Set(product.variants.map((v) => v.color).filter((c): c is string => Boolean(c)))],
    [product.variants]
  );

  if (!selectedVariant) return null;

  const primaryImage = selectedVariant.images[0] || product.variants.flatMap((v) => v.images)[0];
  const imageUrl = resolveImageUrl(primaryImage);
  const inStock = selectedVariant.quantity === null || selectedVariant.quantity > 0;

  function pickBySize(size: string) {
    const match = product.variants.find((v) => v.size === size && (!selectedVariant?.color || v.color === selectedVariant.color));
    setSelectedVariantId((match || product.variants.find((v) => v.size === size))?.id);
  }

  function pickByColor(color: string) {
    const match = product.variants.find((v) => v.color === color && (!selectedVariant?.size || v.size === selectedVariant.size));
    setSelectedVariantId((match || product.variants.find((v) => v.color === color))?.id);
  }

  async function handleAdd() {
    setAdding(true);
    try {
      await addItem(selectedVariant, product, primaryImage || null);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="group">
      <div className="relative aspect-4/5 overflow-hidden rounded-card bg-border">
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-all duration-500 ease-out"
          />
        )}
        {!inStock && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-ink/80 text-paper text-[10px] font-extrabold uppercase">
            Sold Out
          </div>
        )}
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <h3 className="text-[15px] font-medium text-ink">{product.title}</h3>
          <div className="text-sm text-ink-muted mt-1">${Number(selectedVariant.price).toFixed(2)}</div>
        </div>

        {(sizes.length > 1 || colors.length > 1) && (
          <div className="flex flex-wrap gap-2">
            {sizes.length > 1 && (
              <select
                value={selectedVariant.size || ''}
                onChange={(e) => pickBySize(e.target.value)}
                className="text-xs border border-border rounded-control px-2 py-1.5 bg-paper text-ink cursor-pointer"
                aria-label="Select size"
              >
                {sizes.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            )}
            {colors.length > 1 && (
              <select
                value={selectedVariant.color || ''}
                onChange={(e) => pickByColor(e.target.value)}
                className="text-xs border border-border rounded-control px-2 py-1.5 bg-paper text-ink cursor-pointer"
                aria-label="Select color"
              >
                {colors.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        <button
          onClick={handleAdd}
          disabled={!inStock || adding}
          className="w-full touch-target py-2.5 rounded-control text-[15px] font-medium bg-accent text-paper hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {!inStock ? 'Sold Out' : adding ? 'Adding…' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};
