'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-browser';

interface ImportSummary {
  scope: 'test' | 'full';
  groupsProcessed: number;
  productsCreated: number;
  productsMatched: number;
  variantsCreated: number;
  variantsSkippedExisting: number;
  imagesUploaded: number;
  skippedNoLocalImages: number;
  productIds: string[];
  errors: string[];
}

interface Progress {
  processed: number;
  total: number;
  label: string;
}

export default function ImportClient() {
  const [running, setRunning] = useState<'test' | 'full' | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [result, setResult] = useState<ImportSummary | null>(null);
  const [error, setError] = useState('');
  const [activating, setActivating] = useState(false);
  const [activated, setActivated] = useState(false);

  const runImport = async (scope: 'test' | 'full') => {
    if (scope === 'full' && !confirm('This imports all 156 Depop listings into cs_store_products as draft. Continue?')) {
      return;
    }
    setRunning(scope);
    setProgress({ processed: 0, total: scope === 'full' ? 156 : 5, label: 'Starting…' });
    setError('');
    setResult(null);
    setActivated(false);

    try {
      const res = await fetch('/api/admin/import-depop-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope }),
      });

      if (!res.body) throw new Error('No response body from server.');

      // Early failures (auth, missing file) come back as plain JSON, not the NDJSON progress stream.
      if (!res.headers.get('content-type')?.includes('ndjson')) {
        const data = await res.json();
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalSummary: ImportSummary | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          const msg = JSON.parse(line);
          if (msg.type === 'progress') {
            setProgress({ processed: msg.processed, total: msg.total, label: msg.label });
          } else if (msg.type === 'done') {
            finalSummary = msg.summary;
          } else if (msg.type === 'error') {
            throw new Error(msg.error);
          }
        }
      }

      if (!finalSummary) throw new Error('Stream ended without a final result.');
      setResult(finalSummary);
      alert(
        `Import finished (${finalSummary.scope}).\n\n` +
          `Products created: ${finalSummary.productsCreated}\n` +
          `Products matched: ${finalSummary.productsMatched}\n` +
          `Variants created: ${finalSummary.variantsCreated}\n` +
          `Images uploaded: ${finalSummary.imagesUploaded}\n` +
          (finalSummary.errors.length > 0
            ? `\n⚠ ${finalSummary.errors.length} error(s) — see details on the page.`
            : '\n✓ No errors.')
      );
    } catch (e) {
      const message = (e as Error).message;
      setError(message);
      alert(`Import failed: ${message}`);
    } finally {
      setRunning(null);
      setProgress(null);
    }
  };

  const handleActivate = async () => {
    if (!result?.productIds.length) return;
    setActivating(true);
    try {
      const { error: activateError } = await supabase
        .from('cs_store_products')
        .update({ status: 'active' })
        .in('id', result.productIds);
      if (activateError) setError(activateError.message);
      else setActivated(true);
    } finally {
      setActivating(false);
    }
  };

  const percent = progress && progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex flex-col font-sans">
      <header className="glass-panel border-b border-(--border-subtle)">
        <div className="max-w-3xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-red-500 block mb-1">Phase 2 — One-off Tool</span>
            <h1 className="text-xl font-black text-white uppercase tracking-tight">Depop Catalog Import</h1>
          </div>
          <Link href="/admin" className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold">
            ← Back to Admin
          </Link>
        </div>
      </header>

      <main className="grow max-w-3xl w-full mx-auto px-6 py-10 space-y-6">
        <div className="glass-card p-6 rounded-2xl border border-(--border-subtle) space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            Imports Depop listings into <code className="text-amber-400">cs_store_products</code>,{' '}
            <code className="text-amber-400">cs_store_product_variants</code>, <code className="text-amber-400">cs_store_product_images</code>,
            and <code className="text-amber-400">cs_marketplace_listings</code>. Variants of the same design (different size/color, same
            listing since Depop has no native variant support) are grouped into one product using each listing&apos;s <code className="text-amber-400">product_group</code>.
            New products save as <strong className="text-white">draft</strong> — nothing shows on <code className="text-amber-400">/shop</code> until
            you flip it to <strong className="text-white">active</strong> in the <strong className="text-white">Store Products</strong> admin tab.
            Safe to re-run: existing Depop listing IDs are skipped, never duplicated.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => runImport('test')}
              disabled={running !== null}
              className="touch-target px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-extrabold text-xs uppercase tracking-wider shadow-lg cursor-pointer disabled:opacity-50"
            >
              {running === 'test' ? 'Importing…' : 'Run Test Batch (5 listings)'}
            </button>
            <button
              onClick={() => runImport('full')}
              disabled={running !== null}
              className="touch-target px-6 py-3 rounded-xl bg-linear-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg cursor-pointer disabled:opacity-50"
            >
              {running === 'full' ? 'Importing…' : 'Run FULL Catalog Import (156 listings)'}
            </button>
          </div>

          {progress && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono truncate max-w-[70%]">{progress.label}</span>
                <span className="text-white font-bold">
                  {percent}% ({progress.processed}/{progress.total})
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-red-600 to-rose-500 transition-all duration-200 ease-out"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-semibold">{error}</div>
        )}

        {result && (
          <div className="glass-card p-6 rounded-2xl border border-(--border-subtle) space-y-4">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">
              Result ({result.scope === 'full' ? 'full catalog' : 'test batch'})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                ['Groups Processed', result.groupsProcessed],
                ['Products Created', result.productsCreated],
                ['Products Matched', result.productsMatched],
                ['Variants Created', result.variantsCreated],
                ['Variants Skipped', result.variantsSkippedExisting],
                ['Images Uploaded', result.imagesUploaded],
                ['Skipped (no local images)', result.skippedNoLocalImages],
              ].map(([label, value]) => (
                <div key={label as string} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-500">{label}</div>
                  <div className="text-2xl font-black text-white">{value}</div>
                </div>
              ))}
            </div>
            {result.errors.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-red-400 uppercase">Errors ({result.errors.length})</div>
                {result.errors.map((e, i) => (
                  <div key={i} className="text-xs text-red-300 font-mono bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2">
                    {e}
                  </div>
                ))}
              </div>
            )}

            {result.productIds.length > 0 && (
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <p className="text-xs text-slate-400">
                  Quick shortcut for testing: marks every product touched by this run as active. For normal use, publish
                  products one at a time from the <strong className="text-white">Store Products</strong> admin tab instead.
                </p>
                <button
                  onClick={handleActivate}
                  disabled={activating || activated}
                  className="touch-target px-5 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/30 text-emerald-400 hover:text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {activated ? '✓ Activated — check /shop' : activating ? 'Activating…' : `Set ${result.productIds.length} product(s) active`}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
