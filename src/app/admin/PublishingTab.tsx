'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-browser';

interface PublishJob {
  id: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  variant_id: string;
  marketplace: string;
  action: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  retry_count: number;
  last_error: string | null;
}

interface JobDisplay extends PublishJob {
  productTitle: string;
  variantLabel: string;
}

interface ListingPreview {
  input: {
    productTitle: string;
    productDescription: string | null;
    category: string | null;
    brand: string | null;
    condition: string | null;
    size: string | null;
    color: string | null;
    price: number;
    currency: string;
    sku: string | null;
    imageUrls: string[];
  };
  effective: {
    title: string;
    description: string | null;
    price: number;
  };
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  processing: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  failed: 'bg-red-500/10 text-red-400 border-red-500/30',
  cancelled: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
};

export default function PublishingTab() {
  const [jobs, setJobs] = useState<JobDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [reconciling, setReconciling] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [incompleteDetails, setIncompleteDetails] = useState<{ productId: string; title: string; missing: string[] }[]>([]);
  const [previewJobId, setPreviewJobId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<ListingPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');

  const fetchJobs = async () => {
    setLoading(true);
    const { data: jobRows } = await supabase.from('cs_publish_jobs').select('*').order('created_at', { ascending: false }).limit(200);

    if (!jobRows || jobRows.length === 0) {
      setJobs([]);
      setLoading(false);
      return;
    }

    const variantIds = [...new Set(jobRows.map((j) => j.variant_id))];
    const { data: variants } = await supabase.from('cs_store_product_variants').select('id, product_id, size, color').in('id', variantIds);
    const productIds = [...new Set((variants || []).map((v) => v.product_id))];
    const { data: products } = await supabase.from('cs_store_products').select('id, title').in('id', productIds);

    const variantMap = new Map((variants || []).map((v) => [v.id, v]));
    const productMap = new Map((products || []).map((p) => [p.id, p]));

    const display: JobDisplay[] = jobRows.map((job) => {
      const variant = variantMap.get(job.variant_id);
      const product = variant ? productMap.get(variant.product_id) : undefined;
      return {
        ...job,
        productTitle: product?.title || 'Unknown product',
        variantLabel: variant ? [variant.size, variant.color].filter(Boolean).join(' / ') || 'Standard' : job.variant_id,
      };
    });

    setJobs(display);
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const runReconcile = async () => {
    setReconciling(true);
    setError('');
    setMessage('');
    setIncompleteDetails([]);
    try {
      const res = await fetch('/api/admin/publish-jobs/reconcile', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      setMessage(
        `Reconcile: ${data.jobsCreated} publish job(s) + ${data.updateJobsCreated} update job(s) created, ${data.alreadyPublished} already published, ` +
          `${data.alreadyQueued} already queued, ${data.skippedNotActive} skipped (not active), ${data.skippedIncomplete} skipped (incomplete).`
      );
      setIncompleteDetails(data.incompleteDetails || []);
      await fetchJobs();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setReconciling(false);
    }
  };

  const runProcess = async () => {
    setProcessing(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/admin/publish-jobs/process', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      setMessage(
        `Process: ${data.processed} processed — ${data.published} published, ${data.updated} updated, ${data.cancelled} cancelled, ${data.failed} failed.`
      );
      await fetchJobs();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  const [retryingId, setRetryingId] = useState<string | null>(null);

  const handleRetry = async (job: JobDisplay) => {
    setRetryingId(job.id);
    setError('');
    try {
      const { error: retryError } = await supabase
        .from('cs_publish_jobs')
        .update({ status: 'pending', started_at: null, completed_at: null, last_error: null })
        .eq('id', job.id);
      if (retryError) throw new Error(retryError.message);
      await fetchJobs();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRetryingId(null);
    }
  };

  const openPreview = async (job: JobDisplay) => {
    setPreviewJobId(job.id);
    setPreviewData(null);
    setPreviewError('');
    setPreviewLoading(true);
    try {
      const res = await fetch('/api/admin/publish-jobs/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId: job.variant_id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      setPreviewData(data);
    } catch (e) {
      setPreviewError((e as Error).message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    setPreviewJobId(null);
    setPreviewData(null);
    setPreviewError('');
  };

  const filtered = jobs.filter((j) => statusFilter === 'all' || j.status === statusFilter);
  const pendingCount = jobs.filter((j) => j.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl border border-(--border-subtle) space-y-4">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-red-500 block mb-1">Phase 4 — Publishing Engine</span>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Marketplace Publishing</h2>
          <p className="text-xs text-slate-400 mt-1">
            Reconcile compares desired channels (set per-product in Store Products) against what&apos;s actually published and queues{' '}
            <strong className="text-white">publish</strong> jobs for the gap. Process runs queued jobs through the marketplace connector.
            Manual for now — nothing happens on its own.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={runReconcile}
            disabled={reconciling}
            className="touch-target px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-extrabold text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50"
          >
            {reconciling ? 'Reconciling…' : 'Reconcile'}
          </button>
          <button
            onClick={runProcess}
            disabled={processing || pendingCount === 0}
            className="touch-target px-5 py-2.5 rounded-xl bg-linear-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50"
          >
            {processing ? 'Processing…' : `Process Queue (${pendingCount} pending)`}
          </button>
        </div>
        {message && <div className="text-xs text-slate-300">{message}</div>}
        {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">{error}</div>}

        {incompleteDetails.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <div className="text-xs font-bold text-amber-400 uppercase">Skipped — incomplete ({incompleteDetails.length})</div>
            {incompleteDetails.map((d) => (
              <div key={d.productId} className="text-xs text-slate-300 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2">
                <span className="font-bold text-white">{d.title}</span> — missing: {d.missing.join(', ')}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {['all', 'pending', 'processing', 'completed', 'failed', 'cancelled'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
              statusFilter === st ? 'bg-red-600 text-white shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      <div className="glass-card rounded-2xl overflow-hidden border border-(--border-subtle)">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/90 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-800">
                <th className="py-4 px-6">Product</th>
                <th className="py-4 px-6">Variant</th>
                <th className="py-4 px-6">Marketplace</th>
                <th className="py-4 px-6">Action</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Created</th>
                <th className="py-4 px-6">Error</th>
                <th className="py-4 px-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading jobs…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No jobs match this filter.
                  </td>
                </tr>
              ) : (
                filtered.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-4 px-6 font-bold text-white">{job.productTitle}</td>
                    <td className="py-4 px-6 text-slate-400">{job.variantLabel}</td>
                    <td className="py-4 px-6 text-slate-300 uppercase font-bold">{job.marketplace}</td>
                    <td className="py-4 px-6 text-slate-400 uppercase">{job.action}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase border ${STATUS_STYLES[job.status]}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-400">{new Date(job.created_at).toLocaleString()}</td>
                    <td className="py-4 px-6 text-red-400 max-w-xs truncate" title={job.last_error || ''}>
                      {job.last_error || '—'}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => openPreview(job)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Preview
                      </button>
                      {job.status === 'failed' && (
                        <button
                          onClick={() => handleRetry(job)}
                          disabled={retryingId === job.id}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/30 text-emerald-400 hover:text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {retryingId === job.id ? 'Retrying…' : 'Retry'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {previewJobId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-xl glass-panel rounded-2xl overflow-hidden border border-(--border-subtle) shadow-2xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Listing Preview</h3>
              <button onClick={closePreview} className="touch-target w-8 h-8 rounded-full bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center font-bold cursor-pointer">
                ✕
              </button>
            </div>

            {previewLoading && <div className="text-sm text-slate-400 py-8 text-center">Loading…</div>}
            {previewError && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">{previewError}</div>}

            {previewData && (
              <div className="space-y-4 text-sm">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Title (effective)</span>
                  <p className="text-white font-bold">{previewData.effective.title}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Description (effective)</span>
                  <p className="text-slate-300 whitespace-pre-wrap max-h-40 overflow-y-auto">{previewData.effective.description || '—'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Price (effective)</span>
                    <p className="text-amber-400 font-black">
                      {previewData.input.currency} {previewData.effective.price.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Size / Color</span>
                    <p className="text-slate-300">{[previewData.input.size, previewData.input.color].filter(Boolean).join(' / ') || '—'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Category</span>
                    <p className="text-slate-300">{previewData.input.category || '—'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Brand / Condition</span>
                    <p className="text-slate-300">{[previewData.input.brand, previewData.input.condition].filter(Boolean).join(' · ') || '—'}</p>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Images ({previewData.input.imageUrls.length})
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {previewData.input.imageUrls.map((url) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={url} src={url} alt="" className="size-16 rounded-lg object-cover border border-slate-800" />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
