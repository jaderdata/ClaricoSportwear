'use client';

import React, { useMemo, useState } from 'react';
import { StoreProductWithVariants, resolveImageUrl, StoreProductVariantWithImages } from '@/lib/store';
import { useCart } from '@/components/cart/CartProvider';
import { Eye, Images, ShoppingBag } from 'lucide-react';
import { ShopProductModal } from './ShopProductModal';

interface Props {
  product: StoreProductWithVariants;
}

export const ShopProductCard: React.FC<Props> = ({ product }) => {
  const { addItem } = useCart();
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(product.variants[0]?.id);
  const [adding, setAdding] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const selectedVariant = useMemo<StoreProductVariantWithImages | undefined>(
    () => product.variants.find((v) => v.id === selectedVariantId) || product.variants[0],
    [product.variants, selectedVariantId]
  );

  // Strictly gather photos belonging ONLY to the selected variant
  const variantImageUrls = useMemo(() => {
    if (!selectedVariant) return [];
    
    let rawImages = selectedVariant.images || [];
    if (rawImages.length === 0 && (selectedVariant.size || selectedVariant.color)) {
      const match = product.variants.find(
        (v) =>
          (!selectedVariant.size || v.size === selectedVariant.size) &&
          (!selectedVariant.color || v.color === selectedVariant.color) &&
          v.images &&
          v.images.length > 0
      );
      if (match) rawImages = match.images;
    }

    const urls: string[] = [];
    const seen = new Set<string>();

    rawImages.forEach((img) => {
      const url = resolveImageUrl(img);
      if (url && !seen.has(url)) {
        seen.add(url);
        urls.push(url);
      }
    });

    if (urls.length === 0) {
      for (const v of product.variants) {
        for (const img of v.images || []) {
          const url = resolveImageUrl(img);
          if (url && !seen.has(url)) {
            seen.add(url);
            urls.push(url);
            break;
          }
        }
        if (urls.length > 0) break;
      }
    }

    return urls;
  }, [product.variants, selectedVariant]);

  const sizes = useMemo(
    () => [...new Set(product.variants.map((v) => v.size).filter((s): s is string => Boolean(s)))],
    [product.variants]
  );
  const colors = useMemo(
    () => [...new Set(product.variants.map((v) => v.color).filter((c): c is string => Boolean(c)))],
    [product.variants]
  );

  if (!selectedVariant) return null;

  const primaryImage = selectedVariant.images[0]
    ? resolveImageUrl(selectedVariant.images[0])
    : variantImageUrls[0] || '';
  const secondaryImage = variantImageUrls.find((url) => url !== primaryImage) || primaryImage;
  const inStock = selectedVariant.quantity === null || selectedVariant.quantity > 0;

  function pickBySize(size: string) {
    const match = product.variants.find(
      (v) => v.size === size && (!selectedVariant?.color || v.color === selectedVariant.color)
    ) || product.variants.find((v) => v.size === size);
    if (match) setSelectedVariantId(match.id);
  }

  function pickByColor(color: string) {
    const match = product.variants.find(
      (v) => v.color === color && (!selectedVariant?.size || v.size === selectedVariant.size)
    ) || product.variants.find((v) => v.color === color);
    if (match) setSelectedVariantId(match.id);
  }

  async function handleAdd(e: React.MouseEvent) {
    e.stopPropagation();
    if (!selectedVariant) return;
    setAdding(true);
    try {
      await addItem(selectedVariant, product, selectedVariant.images[0] || null);
    } finally {
      setAdding(false);
    }
  }

  return (
    <>
      <div className="flex flex-col h-full bg-paper-raised border border-border/80 hover:border-ink/20 rounded-2xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 group">
        {/* Image Display */}
        <div
          className="relative aspect-4/5 w-full bg-paper overflow-hidden cursor-pointer"
          onClick={() => setIsModalOpen(true)}
        >
          {primaryImage ? (
            <>
              {/* Main Image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={primaryImage}
                alt={product.title}
                className={`w-full h-full object-cover transition-all duration-500 ease-out group-hover:scale-105 ${
                  secondaryImage && secondaryImage !== primaryImage ? 'group-hover:opacity-0' : ''
                }`}
              />

              {/* Secondary Hover Image (if available) */}
              {secondaryImage && secondaryImage !== primaryImage && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={secondaryImage}
                  alt={`${product.title} view 2`}
                  className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 ease-out"
                />
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-ink-muted text-xs">
              No Image
            </div>
          )}

          {/* Top Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
            {!inStock ? (
              <span className="px-2.5 py-1 rounded-full bg-ink/80 text-paper text-[10px] font-bold uppercase tracking-wider backdrop-blur-xs">
                Sold Out
              </span>
            ) : product.brand ? (
              <span className="px-2.5 py-1 rounded-full bg-paper-raised/90 text-ink text-[10px] font-semibold border border-border shadow-xs backdrop-blur-xs">
                {product.brand}
              </span>
            ) : (
              <span />
            )}

            {/* Photo Count Badge */}
            {variantImageUrls.length > 1 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-ink/75 text-paper text-[10px] font-medium backdrop-blur-xs shadow-xs">
                <Images className="size-3" />
                {variantImageUrls.length} photos
              </span>
            )}
          </div>

          {/* Quick View / View Photos Overlay */}
          <div className="absolute inset-0 bg-ink/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(true);
              }}
              className="px-4 py-2 rounded-full bg-paper-raised/95 hover:bg-paper-raised text-ink text-xs font-semibold shadow-lg backdrop-blur-xs transform translate-y-2 group-hover:translate-y-0 transition-all flex items-center gap-1.5 cursor-pointer border border-border"
            >
              <Eye className="size-3.5 text-accent" />
              {variantImageUrls.length > 1 ? 'View Photos / Details' : 'View Details'}
            </button>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 flex flex-col justify-between p-4 bg-paper-raised space-y-3">
          <div>
            {/* Category / Subcategory */}
            <div className="text-[11px] font-semibold tracking-wider text-ink-muted uppercase line-clamp-1 mb-1">
              {product.category || product.subcategory || 'Clarico Sportwear'}
            </div>

            {/* Title - Fixed 2-line height for uniform card alignment */}
            <h3
              onClick={() => setIsModalOpen(true)}
              className="font-medium text-[15px] text-ink leading-snug line-clamp-2 min-h-10 flex items-center cursor-pointer hover:text-accent transition-colors"
              title={product.title}
            >
              {product.title}
            </h3>

            {/* Price */}
            <div className="text-sm font-bold text-ink mt-1.5 flex items-center gap-1">
              ${Number(selectedVariant.price).toFixed(2)}
              {sizes.length > 1 || colors.length > 1 ? (
                <span className="text-[11px] text-ink-muted font-normal">({sizes.length + colors.length} options)</span>
              ) : null}
            </div>
          </div>

          {/* Variant Selector Area (Fixed Min-Height for Grid Alignment) */}
          <div className="min-h-8 flex items-center gap-2 flex-wrap">
            {sizes.length > 1 && (
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-ink-muted uppercase font-semibold">Size:</span>
                <select
                  value={selectedVariant.size || ''}
                  onChange={(e) => pickBySize(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs font-medium border border-border rounded-lg px-2 py-1 bg-paper text-ink cursor-pointer hover:border-ink/40 focus:outline-none focus:ring-1 focus:ring-accent"
                  aria-label="Select size"
                >
                  {sizes.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {colors.length > 1 && (
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-ink-muted uppercase font-semibold">Color:</span>
                <select
                  value={selectedVariant.color || ''}
                  onChange={(e) => pickByColor(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs font-medium border border-border rounded-lg px-2 py-1 bg-paper text-ink cursor-pointer hover:border-ink/40 focus:outline-none focus:ring-1 focus:ring-accent"
                  aria-label="Select color"
                >
                  {colors.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Action Buttons - Pinned cleanly to the bottom */}
          <div className="mt-auto pt-3 border-t border-border/40 flex items-center gap-2">
            <button
              onClick={handleAdd}
              disabled={!inStock || adding}
              className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs bg-accent text-paper hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs active:scale-[0.98] flex items-center justify-center gap-1.5"
            >
              <ShoppingBag className="size-3.5" />
              {!inStock ? 'Sold Out' : adding ? 'Adding…' : 'Add to Cart'}
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(true);
              }}
              title="View photos & details"
              aria-label={`View photos and details for ${product.title}`}
              className="size-9 rounded-xl border border-border bg-paper hover:bg-paper-raised text-ink-muted hover:text-ink shrink-0 flex items-center justify-center cursor-pointer transition-colors"
            >
              <Eye className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Multi-Photo & Product Detail Lightbox Modal */}
      <ShopProductModal
        product={product}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialVariantId={selectedVariantId}
      />
    </>
  );
};
