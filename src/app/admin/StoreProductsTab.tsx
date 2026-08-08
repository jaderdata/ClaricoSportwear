'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-browser';
import { getAllStoreProducts, getCompletenessChecklist, resolveImageUrl, SALES_CHANNELS, StoreProductWithVariants } from '@/lib/store';

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  archived: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
};

const CHANNEL_INITIALS: Record<string, string> = { website: 'W', depop: 'D', vinted: 'V', ebay: 'E' };

function priceRange(product: StoreProductWithVariants): string {
  const prices = product.variants.map((v) => Number(v.price)).filter((p) => !isNaN(p));
  if (prices.length === 0) return '—';
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? `$${min.toFixed(2)}` : `$${min.toFixed(2)} – $${max.toFixed(2)}`;
}

export default function StoreProductsTab() {
  const router = useRouter();
  const [products, setProducts] = useState<StoreProductWithVariants[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteError, setDeleteError] = useState('');
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    const data = await getAllStoreProducts();
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}" and all its variants/images/listings? This cannot be undone.`)) return;
    setDeleteError('');
    const { error } = await supabase.from('cs_store_products').delete().eq('id', id);
    if (error) {
      setDeleteError(error.message);
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleDuplicate = async (product: StoreProductWithVariants) => {
    setDuplicatingId(product.id);
    setDeleteError('');
    try {
      const newSlug = `${product.slug}-copy-${Date.now().toString().slice(-5)}`;
      const { data: newProduct, error: productError } = await supabase
        .from('cs_store_products')
        .insert({
          slug: newSlug,
          title: `${product.title} (Copy)`,
          description: product.description,
          category: product.category,
          subcategory: product.subcategory,
          brand: product.brand,
          condition: product.condition,
          material: product.material,
          status: 'draft',
          desired_channels: product.desired_channels || [],
        })
        .select('id')
        .single();

      if (productError || !newProduct) throw new Error(productError?.message || 'Failed to duplicate product.');

      if (product.tags.length > 0) {
        await supabase.from('cs_store_product_tags').insert(product.tags.map((tag) => ({ product_id: newProduct.id, tag })));
      }

      // Variants and images are copied; marketplace listings are deliberately NOT — the duplicate
      // must never inherit the original's external Depop/Vinted/eBay identity.
      for (const variant of product.variants) {
        const { data: newVariant, error: variantError } = await supabase
          .from('cs_store_product_variants')
          .insert({
            product_id: newProduct.id,
            size: variant.size,
            color: variant.color,
            price: variant.price,
            currency: variant.currency,
            quantity: variant.quantity,
            sku: variant.sku,
          })
          .select('id')
          .single();

        if (variantError || !newVariant) continue;

        if (variant.images.length > 0) {
          await supabase.from('cs_store_product_images').insert(
            variant.images.map((img) => ({
              variant_id: newVariant.id,
              position: img.position,
              storage_path: img.storage_path,
              source_url: img.source_url,
            }))
          );
        }
      }

      router.push(`/admin/store-products/${newProduct.id}`);
    } catch (e) {
      setDeleteError((e as Error).message);
      setDuplicatingId(null);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    setUpdatingStatusId(id);
    const { error } = await supabase.from('cs_store_products').update({ status }).eq('id', id);
    if (!error) {
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, status: status as typeof p.status } : p)));
    }
    setUpdatingStatusId(null);
  };

  const filtered = products.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.slug.includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const allFilteredSelected = filtered.length > 0 && filtered.every((p) => selectedIds.has(p.id));

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (allFilteredSelected) {
        const next = new Set(prev);
        filtered.forEach((p) => next.delete(p.id));
        return next;
      }
      const next = new Set(prev);
      filtered.forEach((p) => next.add(p.id));
      return next;
    });
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkStatus = async (status: 'draft' | 'active' | 'archived') => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    setBulkBusy(true);
    const { error } = await supabase.from('cs_store_products').update({ status }).in('id', ids);
    if (!error) {
      setProducts((prev) => prev.map((p) => (selectedIds.has(p.id) ? { ...p, status } : p)));
      clearSelection();
    } else {
      setDeleteError(error.message);
    }
    setBulkBusy(false);
  };

  const handleBulkDelete = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    if (!confirm(`Delete ${ids.length} product(s) and all their variants/images/listings? This cannot be undone.`)) return;
    setBulkBusy(true);
    const { error } = await supabase.from('cs_store_products').delete().in('id', ids);
    if (!error) {
      setProducts((prev) => prev.filter((p) => !selectedIds.has(p.id)));
      clearSelection();
    } else {
      setDeleteError(error.message);
    }
    setBulkBusy(false);
  };

  const selectionCount = selectedIds.size;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-(--border-subtle)">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-red-500 block mb-1">D2C Storefront</span>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Store Products</h2>
          <p className="text-xs text-slate-400 mt-1">
            Individual ready-to-ship products (migrated from Depop + new ones). Feeds <code className="text-amber-400">/shop</code> when
            status is <strong className="text-white">active</strong>.
          </p>
        </div>
        <Link
          href="/admin/store-products/new"
          className="touch-target px-6 py-3 rounded-xl bg-linear-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg"
        >
          + New Product
        </Link>
      </div>

      <div className="glass-panel p-4 rounded-2xl border border-(--border-subtle) flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={allFilteredSelected}
              onChange={toggleSelectAll}
              disabled={filtered.length === 0}
              className="size-4 rounded cursor-pointer"
            />
            <span className="text-[11px] font-bold text-slate-300 uppercase whitespace-nowrap">Select All ({filtered.length})</span>
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search title or slug..."
            className="w-full md:w-72 touch-target px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-xs"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {['all', 'draft', 'active', 'archived'].map((st) => (
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
      </div>

      {selectionCount > 0 && (
        <div className="sticky top-2 z-20 glass-panel p-4 rounded-2xl border border-red-500/30 bg-red-500/5 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-extrabold text-white uppercase">{selectionCount} selected</span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleBulkStatus('active')}
              disabled={bulkBusy}
              className="px-4 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/30 text-emerald-400 hover:text-white text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              Set Active
            </button>
            <button
              onClick={() => handleBulkStatus('draft')}
              disabled={bulkBusy}
              className="px-4 py-2 rounded-lg bg-amber-600/20 hover:bg-amber-600 border border-amber-500/30 text-amber-400 hover:text-white text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              Set Draft
            </button>
            <button
              onClick={() => handleBulkStatus('archived')}
              disabled={bulkBusy}
              className="px-4 py-2 rounded-lg bg-slate-700/40 hover:bg-slate-600 border border-slate-500/30 text-slate-300 hover:text-white text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              Set Archived
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={bulkBusy}
              className="px-4 py-2 rounded-lg bg-red-600/20 hover:bg-red-600 border border-red-500/30 text-red-400 hover:text-white text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              Delete
            </button>
            <button onClick={clearSelection} className="px-3 py-2 rounded-lg text-slate-400 hover:text-white text-xs font-bold cursor-pointer">
              Clear
            </button>
          </div>
        </div>
      )}

      {deleteError && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
          {deleteError}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">Loading store products…</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-sm">No store products match your filters.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((product) => {
            const primaryImage = product.variants.flatMap((v) => v.images)[0];
            const imageUrl = resolveImageUrl(primaryImage);
            const isSelected = selectedIds.has(product.id);
            const incompleteCount = getCompletenessChecklist(product).filter((c) => !c.passed).length;
            return (
              <div
                key={product.id}
                className={`glass-card rounded-2xl overflow-hidden border flex flex-col justify-between transition-colors ${
                  isSelected ? 'border-red-500/60 ring-1 ring-red-500/40' : 'border-(--border-subtle)'
                }`}
              >
                <div className="relative h-48 bg-slate-900 overflow-hidden">
                  {imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl} alt={product.title} className="w-full h-full object-cover" />
                  )}
                  <label className="absolute top-3 left-3 size-6 rounded-md bg-slate-950/80 border border-slate-700 flex items-center justify-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOne(product.id)}
                      className="size-4 cursor-pointer"
                    />
                  </label>
                  <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
                    <div className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase border ${STATUS_STYLES[product.status]}`}>
                      {product.status}
                    </div>
                    {incompleteCount > 0 && (
                      <div
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30"
                        title="Missing required info"
                      >
                        ⚠ {incompleteCount} missing
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-slate-400">
                      {product.category || 'Uncategorized'} · {product.variants.length} variant{product.variants.length !== 1 ? 's' : ''}
                    </span>
                    <h3 className="text-base font-extrabold text-white uppercase tracking-tight">{product.title}</h3>
                  </div>

                  <div className="flex items-center gap-1.5" title="Desired sales channels">
                    {SALES_CHANNELS.map((channel) => {
                      const desired = (product.desired_channels || []).includes(channel);
                      return (
                        <span
                          key={channel}
                          className={`size-5 rounded-md flex items-center justify-center text-[10px] font-black border ${
                            desired
                              ? 'bg-red-500/15 text-red-400 border-red-500/40'
                              : 'bg-slate-900 text-slate-600 border-slate-800'
                          }`}
                        >
                          {CHANNEL_INITIALS[channel]}
                        </span>
                      );
                    })}
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Price</span>
                      <span className="text-sm font-black text-amber-400">{priceRange(product)}</span>
                    </div>
                    <select
                      value={product.status}
                      onChange={(e) => handleStatusChange(product.id, e.target.value)}
                      disabled={updatingStatusId === product.id}
                      className="touch-target px-2 py-1.5 rounded-lg text-[11px] font-bold border bg-slate-900 border-slate-800 text-slate-200 focus:outline-none cursor-pointer"
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/store-products/${product.id}`}
                      className="touch-target flex-1 text-center px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDuplicate(product)}
                      disabled={duplicatingId === product.id}
                      className="touch-target px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                      title="Duplicate product (variants + images copied, Depop link never copied)"
                    >
                      {duplicatingId === product.id ? 'Copying…' : 'Duplicate'}
                    </button>
                    <button
                      onClick={() => handleDelete(product.id, product.title)}
                      className="touch-target px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
