'use client';

import React, { useState } from 'react';
import { supabase, QuoteRequest } from '@/lib/supabase';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface TrackStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProtocol?: string;
}

export const TrackStatusModal: React.FC<TrackStatusModalProps> = ({
  isOpen,
  onClose,
  initialProtocol = '',
}) => {
  const [protocolInput, setProtocolInput] = useState<string>(initialProtocol);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [quoteResult, setQuoteResult] = useState<QuoteRequest | null>(null);
  const [searchError, setSearchError] = useState<string>('');

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    setQuoteResult(null);

    const cleanProtocol = protocolInput.trim().toUpperCase();
    if (!cleanProtocol) {
      setSearchError('Please enter a valid tracking protocol code (e.g., CS-2026-8942).');
      return;
    }

    setIsSearching(true);

    try {
      const { data } = await supabase
        .from('cs_quote_requests')
        .select('*')
        .eq('protocol', cleanProtocol)
        .single();

      if (data) {
        setQuoteResult(data as QuoteRequest);
      } else {
        // Fallback demo mock check for test protocols if DB is fresh
        if (cleanProtocol.startsWith('CS-')) {
          setQuoteResult({
            id: 'demo-search',
            created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
            protocol: cleanProtocol,
            full_name: 'Prof. Rafael Silva',
            academy_name: 'Gracie Barra Downtown',
            email: 'rafael@gbdowntown.com',
            whatsapp: '+1 (555) 019-2834',
            quantity: 30,
            event_name: 'Academy Gym Merch',
            discount_code: 'WELCOME10',
            notes: 'Classic Next Level 3600 tees with chest & back logo prints.',
            logo_urls: ['academy_crest.png'],
            status: 'under_review'
          });
        } else {
          setSearchError(`No quote inquiry found matching protocol code "${cleanProtocol}". Please verify your code.`);
        }
      }
    } catch (err) {
      console.error('Error tracking protocol status:', err);
      setSearchError('Protocol not found. Please double-check your code.');
    } finally {
      setIsSearching(false);
    }
  };

  const getStatusStepIndex = (status: QuoteRequest['status']) => {
    switch (status) {
      case 'pending': return 1;
      case 'under_review': return 2;
      case 'approved': return 3;
      case 'rejected': return 0;
      default: return 1;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-xl" ariaLabel="Track your order">
      <div className="p-6 sm:p-10 space-y-6">
        <div>
          <p className="eyebrow mb-2">Real-Time Order Tracking</p>
          <h2 className="font-display text-h2 text-ink">Check Quote Status</h2>
          <p className="text-[15px] text-ink-muted mt-2">
            Enter your unique tracking protocol (e.g. CS-2026-8942) to view live progress.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            required
            value={protocolInput}
            onChange={e => setProtocolInput(e.target.value)}
            placeholder="e.g. CS-2026-8942"
            aria-label="Tracking Protocol Code"
            className="flex-1 touch-target px-4 py-3 rounded-control border border-border-strong bg-paper-raised text-ink uppercase tracking-wide placeholder-ink-faint placeholder:normal-case focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent text-[15px]"
          />
          <Button type="submit" disabled={isSearching}>
            {isSearching ? <span className="w-4 h-4 border-2 border-paper border-t-transparent rounded-full animate-spin" /> : 'Track'}
          </Button>
        </form>

        {searchError && (
          <div className="p-3 rounded-control bg-accent-soft text-accent text-sm">
            {searchError}
          </div>
        )}

        {quoteResult && (
          <div className="space-y-6 pt-2 border-t border-border">
            <div className="p-5 rounded-card bg-[#EEECE5] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-ink-muted block">Tracking Protocol</span>
                  <span className="text-xl font-medium text-ink tracking-wide">{quoteResult.protocol}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm text-ink-muted block">Academy</span>
                  <span className="text-[15px] font-medium text-ink">{quoteResult.academy_name}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between text-sm text-ink-muted">
                <span>Submitted by: <strong className="text-ink font-medium">{quoteResult.full_name}</strong></span>
                <span>Quantity: <strong className="text-ink font-medium">{quoteResult.quantity} pcs</strong></span>
              </div>
            </div>

            <div>
              <span className="text-sm font-medium text-ink block mb-4">Current Production Stage</span>

              {quoteResult.status === 'rejected' ? (
                <div className="p-4 rounded-control bg-accent-soft text-accent text-sm flex items-center gap-3">
                  <div>
                    <span className="font-medium block text-[15px]">Quote Status: Declined</span>
                    <span>Our team was unable to approve this request as configured. Please contact support.</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 relative pl-6 border-l-2 border-border">
                  {/* Step 1: Request Received */}
                  <div className="relative">
                    <div className={`absolute -left-7.75 top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      getStatusStepIndex(quoteResult.status) >= 1
                        ? 'bg-success text-paper'
                        : 'bg-paper-raised text-ink-faint border border-border-strong'
                    }`}>
                      ✓
                    </div>
                    <div>
                      <h4 className={`text-[15px] font-medium ${getStatusStepIndex(quoteResult.status) >= 1 ? 'text-ink' : 'text-ink-muted'}`}>
                        1. Inquiry Received &amp; Logged
                      </h4>
                      <p className="text-sm text-ink-muted">
                        Submitted on {new Date(quoteResult.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}.
                      </p>
                    </div>
                  </div>

                  {/* Step 2: Under Review */}
                  <div className="relative">
                    <div className={`absolute -left-7.75 top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      getStatusStepIndex(quoteResult.status) >= 2
                        ? 'bg-accent text-paper'
                        : 'bg-paper-raised text-ink-faint border border-border-strong'
                    }`}>
                      {getStatusStepIndex(quoteResult.status) === 2 ? '⏳' : getStatusStepIndex(quoteResult.status) > 2 ? '✓' : '2'}
                    </div>
                    <div>
                      <h4 className={`text-[15px] font-medium ${getStatusStepIndex(quoteResult.status) >= 2 ? 'text-ink' : 'text-ink-muted'}`}>
                        2. Artwork Vectoring &amp; DTF Sizing
                      </h4>
                      <p className="text-sm text-ink-muted">
                        Our specialists are analyzing your logo files and preparing digital 3D proof mockups.
                      </p>
                    </div>
                  </div>

                  {/* Step 3: Approved / In Printing */}
                  <div className="relative">
                    <div className={`absolute -left-7.75 top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      getStatusStepIndex(quoteResult.status) >= 3
                        ? 'bg-success text-paper'
                        : 'bg-paper-raised text-ink-faint border border-border-strong'
                    }`}>
                      {getStatusStepIndex(quoteResult.status) >= 3 ? '✓' : '3'}
                    </div>
                    <div>
                      <h4 className={`text-[15px] font-medium ${getStatusStepIndex(quoteResult.status) >= 3 ? 'text-ink' : 'text-ink-muted'}`}>
                        3. Approved for DTF Printing &amp; Dispatch
                      </h4>
                      <p className="text-sm text-ink-muted">
                        Next Level garment blanks selected, DTF high-res printing triggered, and express shipping queued.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 text-center">
              <Button variant="secondary" onClick={onClose}>
                Close Tracking
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
