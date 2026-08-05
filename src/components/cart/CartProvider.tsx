'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase-browser';
import { StoreProduct, StoreProductImage, StoreProductVariant } from '@/lib/store';

const CART_COOKIE = 'cs_cart_token';
const COOKIE_MAX_AGE_DAYS = 60;

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string, days: number) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export interface CartItem {
  id: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
  product: StoreProduct;
  variant: StoreProductVariant;
  image: StoreProductImage | null;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  loading: boolean;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (
    variant: StoreProductVariant,
    product: StoreProduct,
    image: StoreProductImage | null,
    quantity?: number
  ) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartId, setCartId] = useState<string | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  const loadCartItems = useCallback(async (id: string) => {
    const { data: cartItems } = await supabase
      .from('cs_cart_items')
      .select('*')
      .eq('cart_id', id)
      .order('created_at', { ascending: true });

    if (!cartItems || cartItems.length === 0) {
      setItems([]);
      return;
    }

    const variantIds = cartItems.map((ci) => ci.variant_id);
    const { data: variants } = await supabase.from('cs_store_product_variants').select('*').in('id', variantIds);
    const productIds = [...new Set((variants || []).map((v) => v.product_id))];

    const [{ data: products }, { data: images }] = await Promise.all([
      productIds.length
        ? supabase.from('cs_store_products').select('*').in('id', productIds)
        : Promise.resolve({ data: [] as StoreProduct[] }),
      supabase.from('cs_store_product_images').select('*').in('variant_id', variantIds).order('position', { ascending: true }),
    ]);

    const composed: CartItem[] = cartItems
      .map((ci) => {
        const variant = (variants || []).find((v) => v.id === ci.variant_id);
        const product = variant ? (products || []).find((p) => p.id === variant.product_id) : undefined;
        const image = (images || []).find((img) => img.variant_id === ci.variant_id) || null;
        if (!variant || !product) return null;
        return {
          id: ci.id,
          variantId: ci.variant_id,
          quantity: ci.quantity,
          unitPrice: Number(ci.unit_price),
          product,
          variant,
          image,
        };
      })
      .filter((ci): ci is CartItem => ci !== null);

    setItems(composed);
  }, []);

  useEffect(() => {
    async function init() {
      setLoading(true);
      const token = readCookie(CART_COOKIE);

      if (token) {
        const { data: existingCart } = await supabase
          .from('cs_carts')
          .select('*')
          .eq('session_token', token)
          .eq('status', 'open')
          .maybeSingle();

        if (existingCart) {
          setCartId(existingCart.id);
          await loadCartItems(existingCart.id);
        }
      }

      setLoading(false);
      // The cart row itself is only created lazily on the first addItem() call,
      // so anonymous visitors who never add anything never get a row in cs_carts.
    }
    init();
  }, [loadCartItems]);

  const ensureCart = useCallback(async (): Promise<string> => {
    if (cartId) return cartId;

    let token = readCookie(CART_COOKIE);
    if (!token) {
      token = crypto.randomUUID();
      writeCookie(CART_COOKIE, token, COOKIE_MAX_AGE_DAYS);
    }

    const { data: existingCart } = await supabase.from('cs_carts').select('*').eq('session_token', token).maybeSingle();

    if (existingCart) {
      setCartId(existingCart.id);
      return existingCart.id;
    }

    const { data: newCart, error } = await supabase
      .from('cs_carts')
      .insert({ session_token: token })
      .select('*')
      .single();

    if (error || !newCart) throw new Error(error?.message || 'Failed to create cart');
    setCartId(newCart.id);
    return newCart.id;
  }, [cartId]);

  const addItem = useCallback(
    async (variant: StoreProductVariant, product: StoreProduct, image: StoreProductImage | null, quantity: number = 1) => {
      const id = await ensureCart();

      const { data: existing } = await supabase
        .from('cs_cart_items')
        .select('*')
        .eq('cart_id', id)
        .eq('variant_id', variant.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('cs_cart_items')
          .update({ quantity: existing.quantity + quantity, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase.from('cs_cart_items').insert({
          cart_id: id,
          variant_id: variant.id,
          quantity,
          unit_price: variant.price,
        });
      }

      await loadCartItems(id);
      setDrawerOpen(true);
    },
    [ensureCart, loadCartItems]
  );

  const updateQuantity = useCallback(
    async (cartItemId: string, quantity: number) => {
      if (quantity < 1) return;
      await supabase.from('cs_cart_items').update({ quantity, updated_at: new Date().toISOString() }).eq('id', cartItemId);
      if (cartId) await loadCartItems(cartId);
    },
    [cartId, loadCartItems]
  );

  const removeItem = useCallback(
    async (cartItemId: string) => {
      await supabase.from('cs_cart_items').delete().eq('id', cartItemId);
      if (cartId) await loadCartItems(cartId);
    },
    [cartId, loadCartItems]
  );

  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0), [items]);

  const value: CartContextValue = {
    items,
    itemCount,
    subtotal,
    loading,
    isDrawerOpen,
    openDrawer: () => setDrawerOpen(true),
    closeDrawer: () => setDrawerOpen(false),
    addItem,
    updateQuantity,
    removeItem,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
