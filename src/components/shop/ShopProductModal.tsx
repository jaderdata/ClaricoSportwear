'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { StoreProductWithVariants, resolveImageUrl, StoreProductVariantWithImages } from '@/lib/store';
import { useCart } from '@/components/cart/CartProvider';
import { Modal } from '@/components/ui/Modal';
import { ChevronLeft, ChevronRight, ShoppingBag, ShieldCheck, Truck, RefreshCw } from 'lucide-react';

interface ShopProductModalProps {
  product: StoreProductWithVariants | null;
  isOpen: boolean;
  onClose: () => void;
  initialVariantId?: string;
}

export const ShopProductModal: React.FC<ShopProductModalProps> = ({
  product,
  isOpen,
  onClose,
  initialVariantId,
}) => {
  const { addItem } = useCart();
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(initialVariantId);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  // Update selected variant when product or initialVariantId changes
  useEffect(() => {
    if (product) {
      const initial = initialVariantId 
        ? product.variants.find(v => v.id === initialVariantId)
        : product.variants[0];
      setSelectedVariantId(initial?.id || product.variants[0]?.id);
      setActiveImageIndex(0);
      setQuantity(1);
    }
  }, [product, initialVariantId]);

  const selectedVariant = useMemo<StoreProductVariantWithImages | undefined>(
    () => product?.variants.find((v) => v.id === selectedVariantId) || product?.variants[0],
    [product, selectedVariantId]
  );

  // Reset active image index when variant changes
  useEffect(() => {
    setActiveImageIndex(0);
  }, [selectedVariantId]);

  // Strictly gather photos belonging ONLY to the selected variant
  const variantImages = useMemo(() => {
    if (!product || !selectedVariant) return [];

    let rawImages = selectedVariant.images || [];

    // Fallback: If selected variant has no images assigned, check matching size & color variant
    if (rawImages.length === 0 && (selectedVariant.size || selectedVariant.color)) {
      const match = product.variants.find(
        (v) =>
          (!selectedVariant.size || v.size === selectedVariant.size) &&
          (!selectedVariant.color || v.color === selectedVariant.color) &&
          v.images &&
          v.images.length > 0
      );
      if (match) {
        rawImages = match.images;
      }
    }

    const list: { url: string; variantId: string; alt: string }[] = [];
    const seenUrls = new Set<string>();

    rawImages.forEach((img) => {
      const url = resolveImageUrl(img);
      if (url && !seenUrls.has(url)) {
        seenUrls.add(url);
        list.push({
          url,
          variantId: selectedVariant.id,
          alt: `${product.title} ${selectedVariant.color ? `- ${selectedVariant.color}` : ''} ${selectedVariant.size ? `(${selectedVariant.size})` : ''}`,
        });
      }
    });

    // Ultimate fallback if variant has zero images anywhere: take 1 primary image from product
    if (list.length === 0) {
      for (const v of product.variants) {
        for (const img of v.images || []) {
          const url = resolveImageUrl(img);
          if (url && !seenUrls.has(url)) {
            seenUrls.add(url);
            list.push({
              url,
              variantId: v.id,
              alt: product.title,
            });
            break;
          }
        }
        if (list.length > 0) break;
      }
    }

    return list;
  }, [product, selectedVariant]);

  // Extract unique available sizes and colors
  const sizes = useMemo(
    () => [...new Set(product?.variants.map((v) => v.size).filter((s): s is string => Boolean(s)))],
    [product]
  );
  const colors = useMemo(
    () => [...new Set(product?.variants.map((v) => v.color).filter((c): c is string => Boolean(c)))],
    [product]
  );

  if (!product || !selectedVariant) return null;

  const currentImage = variantImages[activeImageIndex]?.url || resolveImageUrl(selectedVariant.images[0]) || '';
  const inStock = selectedVariant.quantity === null || selectedVariant.quantity > 0;

  function pickSize(size: string) {
    const match = product?.variants.find(
      (v) => v.size === size && (!selectedVariant?.color || v.color === selectedVariant.color)
    ) || product?.variants.find((v) => v.size === size);

    if (match) {
      setSelectedVariantId(match.id);
    }
  }

  function pickColor(color: string) {
    const match = product?.variants.find(
      (v) => v.color === color && (!selectedVariant?.size || v.size === selectedVariant.size)
    ) || product?.variants.find((v) => v.color === color);

    if (match) {
      setSelectedVariantId(match.id);
    }
  }

  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (prev === 0 ? variantImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev === variantImages.length - 1 ? 0 : prev + 1));
  };

  async function handleAddToCart() {
    if (!selectedVariant || !product) return;
    setAdding(true);
    try {
      const imgObj = selectedVariant.images[0] || null;
      await addItem(selectedVariant, product, imgObj, quantity);
      onClose();
    } finally {
      setAdding(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-5xl" ariaLabel={`View ${product.title}`}>
      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[500px]">
        {/* Gallery Column */}
        <div className="md:col-span-7 bg-paper p-4 sm:p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-border rounded-t-panel md:rounded-l-panel md:rounded-tr-none">
          {/* Main Photo Viewer */}
          <div className="relative aspect-4/5 w-full bg-paper-raised rounded-card overflow-hidden shadow-xs border border-border flex items-center justify-center group">
            {currentImage ? (
              <img
                src={currentImage}
                alt={variantImages[activeImageIndex]?.alt || product.title}
                className="w-full h-full object-cover transition-opacity duration-300"
              />
            ) : (
              <div className="text-ink-muted text-sm">No image available</div>
            )}

            {/* Photo Counter Badge */}
            {variantImages.length > 0 && (
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-ink/75 backdrop-blur-xs text-paper text-xs font-medium tracking-wide">
                {activeImageIndex + 1} / {variantImages.length}
              </div>
            )}

            {/* Sold Out Overlay */}
            {!inStock && (
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-accent text-paper text-xs font-bold uppercase tracking-wider">
                Sold Out
              </div>
            )}

            {/* Navigation Arrows */}
            {variantImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 size-10 rounded-full bg-paper/90 text-ink shadow-md hover:bg-paper hover:scale-105 transition-all flex items-center justify-center cursor-pointer border border-border"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 size-10 rounded-full bg-paper/90 text-ink shadow-md hover:bg-paper hover:scale-105 transition-all flex items-center justify-center cursor-pointer border border-border"
                  aria-label="Next photo"
                >
                  <ChevronRight className="size-5" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail Carousel Strip */}
          {variantImages.length > 1 && (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1 pt-1 scrollbar-thin">
              {variantImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative size-16 shrink-0 rounded-md overflow-hidden border-2 transition-all cursor-pointer ${
                    activeImageIndex === idx ? 'border-accent scale-105 shadow-xs' : 'border-border opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details & Actions Column */}
        <div className="md:col-span-5 p-6 sm:p-8 flex flex-col justify-between bg-paper-raised rounded-b-panel md:rounded-r-panel md:rounded-bl-none">
          <div className="space-y-5">
            {/* Category / Brand Tag */}
            <div className="flex items-center justify-between gap-2">
              <span className="eyebrow text-xs font-semibold text-accent tracking-widest uppercase">
                {product.brand || product.category || 'Ready To Ship'}
              </span>
              {product.condition && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-paper border border-border text-ink-muted">
                  {product.condition}
                </span>
              )}
            </div>

            {/* Product Title & Price */}
            <div>
              <h2 className="font-display text-h3 text-ink leading-snug">{product.title}</h2>
              <div className="mt-2 flex items-baseline gap-3">
                <span className="text-2xl font-bold text-ink">
                  ${Number(selectedVariant.price).toFixed(2)}
                </span>
                <span className="text-xs text-ink-muted">USD</span>
                {inStock ? (
                  <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-success font-medium">
                    <span className="size-2 rounded-full bg-success animate-pulse" /> In Stock
                  </span>
                ) : (
                  <span className="ml-auto text-xs text-accent font-medium">Out of stock</span>
                )}
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-sm text-ink-muted leading-relaxed border-t border-border pt-4">
                {product.description}
              </p>
            )}

            {/* Material / Details */}
            {product.material && (
              <div className="text-xs text-ink-muted flex items-center gap-2">
                <span className="font-medium text-ink">Material:</span> {product.material}
              </div>
            )}

            {/* Color Selection */}
            {colors.length > 0 && (
              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold text-ink uppercase tracking-wider block">
                  Color: <span className="text-ink-muted font-normal">{selectedVariant.color || 'Default'}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {colors.map((col) => {
                    const isSelected = selectedVariant.color === col;
                    return (
                      <button
                        key={col}
                        type="button"
                        onClick={() => pickColor(col)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-ink bg-ink text-paper shadow-xs'
                            : 'border-border bg-paper text-ink hover:border-ink/50'
                        }`}
                      >
                        {col}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {sizes.length > 0 && (
              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold text-ink uppercase tracking-wider block">
                  Size: <span className="text-ink-muted font-normal">{selectedVariant.size || 'Standard'}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((sz) => {
                    const isSelected = selectedVariant.size === sz;
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => pickSize(sz)}
                        className={`min-w-10 px-3 py-2 rounded-lg text-xs font-bold border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'border-accent bg-accent text-paper shadow-xs scale-105'
                            : 'border-border bg-paper text-ink hover:border-ink/50'
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="pt-2">
              <label className="text-xs font-semibold text-ink uppercase tracking-wider block mb-2">Quantity</label>
              <div className="inline-flex items-center border border-border rounded-lg bg-paper p-1">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="size-8 rounded-md hover:bg-paper-raised text-ink font-bold transition-colors cursor-pointer"
                >
                  -
                </button>
                <span className="w-10 text-center text-sm font-semibold text-ink">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="size-8 rounded-md hover:bg-paper-raised text-ink font-bold transition-colors cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Add to Cart & Value Props */}
          <div className="space-y-4 pt-6 mt-6 border-t border-border">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!inStock || adding}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-accent text-paper hover:bg-accent-hover active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="size-4" />
              {!inStock ? 'Sold Out' : adding ? 'Adding to Cart…' : `Add to Cart — $${(Number(selectedVariant.price) * quantity).toFixed(2)}`}
            </button>

            <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] text-ink-muted text-center border-t border-border/60">
              <div className="flex flex-col items-center gap-1">
                <Truck className="size-4 text-ink-muted" />
                <span>Ready to Ship</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <ShieldCheck className="size-4 text-ink-muted" />
                <span>Authentic Gear</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <RefreshCw className="size-4 text-ink-muted" />
                <span>Easy Returns</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
