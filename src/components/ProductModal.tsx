'use client';

import React from 'react';
import { Product } from '@/lib/supabase';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onSelectProductForQuote: (productName: string) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  onClose,
  onSelectProductForQuote,
}) => {
  return (
    <Modal isOpen={!!product} onClose={onClose} maxWidth="max-w-4xl" ariaLabel="Product details">
      {product && (
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="relative aspect-square md:aspect-auto bg-paper">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover md:rounded-l-panel"
            />
          </div>

          <div className="p-6 sm:p-10 flex flex-col justify-between gap-8">
            <div>
              <p className="eyebrow mb-3">{product.category}</p>
              <h2 className="font-display text-h2 text-ink mb-2">{product.name}</h2>
              <div className="text-lg text-ink mb-5">
                Starting at ${Number(product.price_starting_at).toFixed(2)}{' '}
                <span className="text-sm text-ink-muted font-normal">/ unit</span>
              </div>
              <p className="text-[15px] text-ink-muted leading-relaxed mb-6">{product.description}</p>

              <div className="space-y-3 text-[15px] border-t border-border pt-5">
                <div className="flex justify-between gap-4">
                  <span className="text-ink-muted">Garment</span>
                  <span className="text-ink font-medium text-right">{product.gildan_model}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-ink-muted">Fabric</span>
                  <span className="text-ink font-medium text-right">{product.fabric_details}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-ink-muted">Print method</span>
                  <span className="text-ink font-medium text-right">{product.print_technology}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-ink-muted">Lead time</span>
                  <span className="text-ink font-medium text-right">{product.estimated_days} business days</span>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-border">
                <span className="text-sm text-ink-muted block mb-2">Available colors</span>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-full border border-border text-sm text-ink">
                      {color}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                className="w-full"
                withArrow
                onClick={() => {
                  onClose();
                  onSelectProductForQuote(product.name);
                }}
              >
                Customize This Design
              </Button>
              <p className="text-center text-sm text-ink-muted">No minimum order · Digital proof provided</p>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
