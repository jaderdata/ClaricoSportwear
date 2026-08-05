'use client';

import React, { useEffect } from 'react';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useCart } from './CartProvider';
import { resolveImageUrl } from '@/lib/store';
import { Button } from '@/components/ui/Button';

export const CartDrawer: React.FC = () => {
  const { items, subtotal, isDrawerOpen, closeDrawer, updateQuantity, removeItem } = useCart();

  useEffect(() => {
    if (!isDrawerOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer();
    };
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen, closeDrawer]);

  if (!isDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex justify-end" role="dialog" aria-modal="true" aria-label="Shopping cart">
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={closeDrawer} />

      <div className="relative w-full max-w-md h-full bg-paper-raised shadow-[0_30px_80px_-24px_rgba(23,20,15,0.35)] flex flex-col animate-reveal">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h2 className="font-display text-h3 text-ink flex items-center gap-2">
            <ShoppingBag className="size-5" strokeWidth={1.75} />
            Your Cart
          </h2>
          <button
            onClick={closeDrawer}
            aria-label="Close cart"
            className="touch-target inline-flex items-center justify-center rounded-full text-ink-muted hover:text-ink hover:bg-paper transition-colors"
          >
            <X className="size-5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-ink-muted py-20">
              <ShoppingBag className="size-10 mb-4 opacity-40" strokeWidth={1.25} />
              <p className="text-[15px]">Your cart is empty.</p>
            </div>
          ) : (
            <ul className="space-y-5">
              {items.map((item) => {
                const imageUrl = resolveImageUrl(item.image);
                return (
                  <li key={item.id} className="flex gap-4">
                    <div className="size-20 rounded-card bg-border overflow-hidden shrink-0">
                      {imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imageUrl} alt={item.product.title} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[15px] font-medium text-ink truncate">{item.product.title}</h3>
                      <p className="text-sm text-ink-muted mt-0.5">
                        {[item.variant.size, item.variant.color].filter(Boolean).join(' / ') || 'Standard'}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2 border border-border rounded-control">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="touch-target p-1.5 text-ink-muted hover:text-ink disabled:opacity-30 cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="size-3.5" strokeWidth={2} />
                          </button>
                          <span className="text-sm font-medium text-ink w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="touch-target p-1.5 text-ink-muted hover:text-ink cursor-pointer"
                            aria-label="Increase quantity"
                          >
                            <Plus className="size-3.5" strokeWidth={2} />
                          </button>
                        </div>
                        <span className="text-[15px] font-medium text-ink">
                          ${(item.unitPrice * item.quantity).toFixed(2)}
                        </span>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-sm text-ink-muted hover:text-accent mt-2 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-border px-6 py-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[15px] text-ink-muted">Subtotal</span>
              <span className="text-h3 font-display text-ink">${subtotal.toFixed(2)}</span>
            </div>
            <Button className="w-full" size="lg" disabled>
              Checkout — coming soon
            </Button>
            <p className="text-xs text-ink-muted text-center">
              Payment and shipping are being finalized. Your cart is saved.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
