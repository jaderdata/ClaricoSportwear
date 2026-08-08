'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-browser';
import {
  getCompletenessChecklist,
  getMarketplaceListingsForVariants,
  getStoreProductById,
  MarketplaceListing,
  resolveImageUrl,
  SALES_CHANNELS,
  SalesChannel,
  slugifyTitle,
  StoreProductVariantWithImages,
  StoreProductWithVariants,
} from '@/lib/store';

const CHANNEL_LABELS: Record<SalesChannel, string> = {
  website: 'Website',
  depop: 'Depop',
  vinted: 'Vinted',
  ebay: 'eBay',
};

interface Props {
  productId?: string;
}

interface BasicFields {
  title: string;
  description: string;
  category: string;
  subcategory: string;
  brand: string;
  condition: string;
  material: string;
  status: 'draft' | 'active' | 'archived';
}

const EMPTY_FIELDS: BasicFields = {
  title: '',
  description: '',
  category: '',
  subcategory: '',
  brand: '',
  condition: '',
  material: '',
  status: 'draft',
};

export default function StoreProductEditorClient({ productId }: Props) {
  const router = useRouter();
  const isNew = !productId;

  const [loading, setLoading] = useState(!isNew);
  const [slug, setSlug] = useState('');
  const [fields, setFields] = useState<BasicFields>(EMPTY_FIELDS);
  const [tagsInput, setTagsInput] = useState('');
  const [desiredChannels, setDesiredChannels] = useState<string[]>([]);
  const [variants, setVariants] = useState<StoreProductVariantWithImages[]>([]);
  const [listings, setListings] = useState<MarketplaceListing[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (isNew) return;
    (async () => {
      setLoading(true);
      const product = await getStoreProductById(productId!);
      if (!product) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setSlug(product.slug);
      setFields({
        title: product.title,
        description: product.description || '',
        category: product.category || '',
        subcategory: product.subcategory || '',
        brand: product.brand || '',
        condition: product.condition || '',
        material: product.material || '',
        status: product.status,
      });
      setTagsInput(product.tags.join(', '));
      setDesiredChannels(product.desired_channels || []);
      setVariants(product.variants);
      const variantIds = product.variants.map((v) => v.id);
      setListings(await getMarketplaceListingsForVariants(variantIds));
      setLoading(false);
    })();
  }, [isNew, productId]);

  const handleSaveBasics = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fields.title.trim()) {
      setError('Title is required.');
      return;
    }
    setSaving(true);
    setError('');

    const tags = [...new Set(tagsInput.split(',').map((t) => t.trim()).filter(Boolean))];
    const payload = {
      title: fields.title.trim(),
      description: fields.description.trim() || null,
      category: fields.category.trim() || null,
      subcategory: fields.subcategory.trim() || null,
      brand: fields.brand.trim() || null,
      condition: fields.condition.trim() || null,
      material: fields.material.trim() || null,
      status: fields.status,
      desired_channels: desiredChannels,
    };

    if (isNew) {
      const newSlug = `${slugifyTitle(fields.title)}-${Date.now().toString().slice(-5)}`;
      const { data: newProduct, error: createError } = await supabase
        .from('cs_store_products')
        .insert({ ...payload, slug: newSlug })
        .select('id')
        .single();

      if (createError || !newProduct) {
        setSaving(false);
        setError(createError?.message || 'Failed to create product.');
        return;
      }

      if (tags.length > 0) {
        await supabase.from('cs_store_product_tags').insert(tags.map((tag) => ({ product_id: newProduct.id, tag })));
      }

      router.replace(`/admin/store-products/${newProduct.id}`);
      return;
    }

    const { error: updateError } = await supabase.from('cs_store_products').update(payload).eq('id', productId);
    if (updateError) {
      setSaving(false);
      setError(updateError.message);
      return;
    }

    await supabase.from('cs_store_product_tags').delete().eq('product_id', productId);
    if (tags.length > 0) {
      await supabase.from('cs_store_product_tags').insert(tags.map((tag) => ({ product_id: productId, tag })));
    }

    setSaving(false);
  };

  const handleDeleteProduct = async () => {
    if (!productId) return;
    if (!confirm(`Delete "${fields.title}" and all its variants/images/listings? This cannot be undone.`)) return;
    const { error: deleteError } = await supabase.from('cs_store_products').delete().eq('id', productId);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    router.push('/admin');
  };

  const toggleChannel = (channel: SalesChannel) => {
    setDesiredChannels((prev) => (prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel]));
  };

  /** "Actual" state per channel: website mirrors the product's own status; others come from real marketplace_listings. */
  const actualChannelStatus = (channel: SalesChannel): string => {
    if (channel === 'website') return fields.status === 'active' ? 'Active' : 'Not published';
    const listing = listings.find((l) => l.marketplace === channel);
    return listing ? listing.status : 'Not published';
  };

  const handleAddVariant = async () => {
    if (!productId) return;
    const { data: newVariant, error: insertError } = await supabase
      .from('cs_store_product_variants')
      .insert({ product_id: productId, price: 0, currency: 'USD' })
      .select('*')
      .single();
    if (insertError || !newVariant) {
      setError(insertError?.message || 'Failed to add variant.');
      return;
    }
    setVariants((prev) => [...prev, { ...newVariant, images: [] }]);
  };

  const handleUpdateVariant = async (variant: StoreProductVariantWithImages) => {
    const { error: updateError } = await supabase
      .from('cs_store_product_variants')
      .update({
        size: variant.size,
        color: variant.color,
        price: variant.price,
        quantity: variant.quantity,
        sku: variant.sku,
      })
      .eq('id', variant.id);
    if (updateError) setError(updateError.message);
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (!confirm('Delete this variant and its images?')) return;
    const { error: deleteError } = await supabase.from('cs_store_product_variants').delete().eq('id', variantId);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setVariants((prev) => prev.filter((v) => v.id !== variantId));
  };

  const handleUploadImage = async (variant: StoreProductVariantWithImages, file: File) => {
    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const nextPosition = (variant.images[variant.images.length - 1]?.position || 0) + 1;
    const storagePath = `store/${slug}/${variant.id}/${Date.now()}-${cleanName}`;

    const { error: uploadError } = await supabase.storage.from('product-images').upload(storagePath, file, { cacheControl: '3600' });
    if (uploadError) {
      setError(uploadError.message);
      return;
    }

    const { data: newImage, error: insertError } = await supabase
      .from('cs_store_product_images')
      .insert({ variant_id: variant.id, position: nextPosition, storage_path: storagePath })
      .select('*')
      .single();

    if (insertError || !newImage) {
      setError(insertError?.message || 'Failed to save image reference.');
      return;
    }

    setVariants((prev) => prev.map((v) => (v.id === variant.id ? { ...v, images: [...v.images, newImage] } : v)));
  };

  const handleDeleteImage = async (variantId: string, imageId: string) => {
    const { error: deleteError } = await supabase.from('cs_store_product_images').delete().eq('id', imageId);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setVariants((prev) => prev.map((v) => (v.id === variantId ? { ...v, images: v.images.filter((i) => i.id !== imageId) } : v)));
  };

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#090a0f] text-slate-100 flex items-center justify-center flex-col gap-4">
        <p className="text-slate-400">Product not found.</p>
        <Link href="/admin" className="text-red-400 hover:text-red-300 text-sm font-bold">
          ← Back to Admin
        </Link>
      </div>
    );
  }

  if (loading) {
    return <div className="min-h-screen bg-[#090a0f] text-slate-400 flex items-center justify-center">Loading…</div>;
  }

  const checklist = getCompletenessChecklist({
    title: fields.title,
    description: fields.description,
    category: fields.category,
    variants,
  } as StoreProductWithVariants);
  const incompleteCount = checklist.filter((c) => !c.passed).length;

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 font-sans">
      <header className="glass-panel border-b border-(--border-subtle)">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-red-500 block mb-1">Store Product</span>
            <h1 className="text-xl font-black text-white uppercase tracking-tight">{isNew ? 'New Product' : fields.title}</h1>
          </div>
          <Link href="/admin" className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold">
            ← Back to Admin
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">{error}</div>}

        <div
          className={`glass-card p-6 rounded-2xl border space-y-3 ${
            incompleteCount === 0 ? 'border-emerald-500/30' : 'border-amber-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">Completeness</h2>
            <span
              className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase border ${
                incompleteCount === 0
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}
            >
              {incompleteCount === 0 ? 'Ready to sell' : `${incompleteCount} item(s) missing`}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {checklist.map((c) => (
              <div key={c.label} className={`flex items-center gap-1.5 text-xs ${c.passed ? 'text-emerald-400' : 'text-amber-400'}`}>
                <span>{c.passed ? '✓' : '✗'}</span>
                <span>{c.label}</span>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSaveBasics} className="glass-card p-6 rounded-2xl border border-(--border-subtle) space-y-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">Basic Info</h2>

          <div>
            <label className="block font-bold text-slate-300 uppercase text-xs mb-1">Title *</label>
            <input
              type="text"
              required
              value={fields.title}
              onChange={(e) => setFields((f) => ({ ...f, title: e.target.value }))}
              className="w-full touch-target px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-300 uppercase text-xs mb-1">Description</label>
            <textarea
              rows={3}
              value={fields.description}
              onChange={(e) => setFields((f) => ({ ...f, description: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-300 uppercase text-xs mb-1">Category</label>
              <input
                type="text"
                value={fields.category}
                onChange={(e) => setFields((f) => ({ ...f, category: e.target.value }))}
                className="w-full touch-target px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-300 uppercase text-xs mb-1">Subcategory</label>
              <input
                type="text"
                value={fields.subcategory}
                onChange={(e) => setFields((f) => ({ ...f, subcategory: e.target.value }))}
                className="w-full touch-target px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-300 uppercase text-xs mb-1">Brand</label>
              <input
                type="text"
                value={fields.brand}
                onChange={(e) => setFields((f) => ({ ...f, brand: e.target.value }))}
                className="w-full touch-target px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-300 uppercase text-xs mb-1">Condition</label>
              <input
                type="text"
                value={fields.condition}
                onChange={(e) => setFields((f) => ({ ...f, condition: e.target.value }))}
                className="w-full touch-target px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-300 uppercase text-xs mb-1">Material</label>
              <input
                type="text"
                value={fields.material}
                onChange={(e) => setFields((f) => ({ ...f, material: e.target.value }))}
                className="w-full touch-target px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-300 uppercase text-xs mb-1">Status</label>
              <select
                value={fields.status}
                onChange={(e) => setFields((f) => ({ ...f, status: e.target.value as BasicFields['status'] }))}
                className="w-full touch-target px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs cursor-pointer"
              >
                <option value="draft">Draft</option>
                <option value="active">Active (visible on /shop)</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-300 uppercase text-xs mb-1">Tags (comma separated)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="BJJ, Streetwear, Y2K..."
              className="w-full touch-target px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="touch-target px-6 py-3 rounded-xl bg-linear-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Saving…' : isNew ? 'Create Product' : 'Save Changes'}
          </button>
        </form>

        <div className="glass-card p-6 rounded-2xl border border-(--border-subtle) space-y-4">
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">Sales Channels</h2>
            <p className="text-xs text-slate-500 mt-1">
              Where you <strong className="text-slate-300">want</strong> this sold — separate from where it{' '}
              <strong className="text-slate-300">actually is</strong>. Checking a box here doesn&apos;t publish anything by itself
              (no automation yet); it just records intent for when publishing is built.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SALES_CHANNELS.map((channel) => {
              const desired = desiredChannels.includes(channel);
              const actual = actualChannelStatus(channel);
              const isLive = actual.toLowerCase() === 'active';
              return (
                <label
                  key={channel}
                  className={`p-3 rounded-xl border cursor-pointer transition-colors space-y-2 ${
                    desired ? 'border-red-500/40 bg-red-500/5' : 'border-slate-800 bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-white uppercase">{CHANNEL_LABELS[channel]}</span>
                    <input
                      type="checkbox"
                      checked={desired}
                      onChange={() => toggleChannel(channel)}
                      className="size-4 cursor-pointer"
                    />
                  </div>
                  <div
                    className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md border inline-block ${
                      isLive
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : desired
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-slate-800 text-slate-500 border-slate-700'
                    }`}
                  >
                    {actual}
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {!isNew && (
          <div className="glass-card p-6 rounded-2xl border border-(--border-subtle) space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">
                Variants ({variants.length})
              </h2>
              <button
                onClick={handleAddVariant}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
              >
                + Add Variant
              </button>
            </div>

            {variants.length === 0 ? (
              <p className="text-sm text-slate-500">No variants yet.</p>
            ) : (
              <div className="space-y-4">
                {variants.map((variant) => {
                  const variantListings = listings.filter((l) => l.variant_id === variant.id);
                  return (
                    <div key={variant.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Size</label>
                          <input
                            type="text"
                            value={variant.size || ''}
                            onChange={(e) =>
                              setVariants((prev) => prev.map((v) => (v.id === variant.id ? { ...v, size: e.target.value } : v)))
                            }
                            className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Color</label>
                          <input
                            type="text"
                            value={variant.color || ''}
                            onChange={(e) =>
                              setVariants((prev) => prev.map((v) => (v.id === variant.id ? { ...v, color: e.target.value } : v)))
                            }
                            className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Price ($)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={variant.price}
                            onChange={(e) =>
                              setVariants((prev) =>
                                prev.map((v) => (v.id === variant.id ? { ...v, price: Number(e.target.value) } : v))
                              )
                            }
                            className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Quantity</label>
                          <input
                            type="number"
                            value={variant.quantity ?? ''}
                            onChange={(e) =>
                              setVariants((prev) =>
                                prev.map((v) =>
                                  v.id === variant.id ? { ...v, quantity: e.target.value === '' ? null : Number(e.target.value) } : v
                                )
                              )
                            }
                            className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">SKU</label>
                          <input
                            type="text"
                            value={variant.sku || ''}
                            onChange={(e) =>
                              setVariants((prev) => prev.map((v) => (v.id === variant.id ? { ...v, sku: e.target.value } : v)))
                            }
                            className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs"
                          />
                        </div>
                      </div>

                      {variantListings.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {variantListings.map((l) => (
                            <a
                              key={l.id}
                              href={l.external_url || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 rounded-md text-[10px] font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/30"
                            >
                              {l.marketplace}: {l.status} ↗
                            </a>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {variant.images.map((img) => {
                          const url = resolveImageUrl(img);
                          return (
                            <div key={img.id} className="relative size-16 rounded-lg overflow-hidden bg-slate-800 border border-slate-700">
                              {url && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={url} alt="" className="w-full h-full object-cover" />
                              )}
                              <button
                                onClick={() => handleDeleteImage(variant.id, img.id)}
                                className="absolute top-0.5 right-0.5 size-4 rounded-full bg-black/70 text-white text-[10px] flex items-center justify-center cursor-pointer"
                                aria-label="Remove image"
                              >
                                ✕
                              </button>
                            </div>
                          );
                        })}
                        <label className="size-16 rounded-lg border-2 border-dashed border-slate-700 hover:border-red-500 flex items-center justify-center cursor-pointer text-slate-500 text-[10px] font-bold text-center">
                          + Photo
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              e.target.value = '';
                              if (file) handleUploadImage(variant, file);
                            }}
                          />
                        </label>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleUpdateVariant(variant)}
                          className="px-4 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/30 text-emerald-400 hover:text-white text-xs font-bold cursor-pointer"
                        >
                          Save Variant
                        </button>
                        <button
                          onClick={() => handleDeleteVariant(variant.id)}
                          className="px-4 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white text-xs font-bold cursor-pointer"
                        >
                          Delete Variant
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {!isNew && (
          <div className="glass-card p-6 rounded-2xl border border-red-500/20 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-red-400">Danger Zone</h2>
              <p className="text-xs text-slate-500 mt-1">Deletes the product, all variants, images, and marketplace listing records.</p>
            </div>
            <button
              onClick={handleDeleteProduct}
              className="px-5 py-2.5 rounded-xl bg-red-600/10 hover:bg-red-600 border border-red-500/30 text-red-400 hover:text-white text-xs font-bold cursor-pointer"
            >
              Delete Product
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
