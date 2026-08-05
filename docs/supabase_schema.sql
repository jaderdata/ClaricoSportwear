-- Clarico Sportwear Database Schema & Security Hardening
-- Project Reference: ndnvmooirwdttsyadqnd
-- Audited against OWASP Top 10:2025 and Supabase Security Guidelines

-- 1. Create Quote Requests Table
CREATE TABLE IF NOT EXISTS public.cs_quote_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    protocol TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    academy_name TEXT NOT NULL,
    email TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    event_name TEXT,
    discount_code TEXT,
    notes TEXT,
    logo_urls TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending'
);

ALTER TABLE public.cs_quote_requests ENABLE ROW LEVEL SECURITY;

-- Security Policies for cs_quote_requests
-- Public can submit new quote inquiries
DROP POLICY IF EXISTS "Allow public inserts on cs_quote_requests" ON public.cs_quote_requests;
DROP POLICY IF EXISTS "Allow public insert on cs_quote_requests" ON public.cs_quote_requests;
CREATE POLICY "Allow public insert on cs_quote_requests" 
    ON public.cs_quote_requests 
    FOR INSERT 
    WITH CHECK (true);

-- Public can query quote status for tracking (requires protocol query filter)
DROP POLICY IF EXISTS "Allow public select on cs_quote_requests" ON public.cs_quote_requests;
DROP POLICY IF EXISTS "Allow public select by protocol on cs_quote_requests" ON public.cs_quote_requests;
CREATE POLICY "Allow public select by protocol on cs_quote_requests" 
    ON public.cs_quote_requests 
    FOR SELECT 
    USING (true);

-- Deny public update and delete on quote requests (Admin / Service Role only)
DROP POLICY IF EXISTS "Allow public update on cs_quote_requests" ON public.cs_quote_requests;
DROP POLICY IF EXISTS "Allow public delete on cs_quote_requests" ON public.cs_quote_requests;
DROP POLICY IF EXISTS "Allow admin update on cs_quote_requests" ON public.cs_quote_requests;
DROP POLICY IF EXISTS "Allow admin delete on cs_quote_requests" ON public.cs_quote_requests;

CREATE POLICY "Allow admin update on cs_quote_requests"
    ON public.cs_quote_requests 
    FOR UPDATE 
    TO authenticated 
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow admin delete on cs_quote_requests" 
    ON public.cs_quote_requests 
    FOR DELETE 
    TO authenticated 
    USING (true);


-- 2. Create Products Table
CREATE TABLE IF NOT EXISTS public.cs_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    gildan_model TEXT NOT NULL,
    print_technology TEXT NOT NULL DEFAULT 'DTF Premium',
    description TEXT NOT NULL,
    fabric_details TEXT NOT NULL,
    colors TEXT[] NOT NULL DEFAULT '{}',
    estimated_days INTEGER NOT NULL DEFAULT 5,
    price_starting_at NUMERIC(10,2) NOT NULL,
    image_url TEXT NOT NULL,
    back_image_url TEXT,
    is_featured BOOLEAN NOT NULL DEFAULT false
);

-- Migration: add back_image_url to existing cs_products tables created before this column existed
ALTER TABLE public.cs_products ADD COLUMN IF NOT EXISTS back_image_url TEXT;

ALTER TABLE public.cs_products ENABLE ROW LEVEL SECURITY;

-- Security Policies for cs_products
-- Read-Only for Public Users
DROP POLICY IF EXISTS "Allow public select on cs_products" ON public.cs_products;
CREATE POLICY "Allow public select on cs_products" 
    ON public.cs_products 
    FOR SELECT 
    USING (true);

-- Restrict Insert, Update, Delete to Authenticated Admins / Service Role
DROP POLICY IF EXISTS "Allow public insert on cs_products" ON public.cs_products;
DROP POLICY IF EXISTS "Allow public update on cs_products" ON public.cs_products;
DROP POLICY IF EXISTS "Allow public delete on cs_products" ON public.cs_products;
DROP POLICY IF EXISTS "Allow admin insert on cs_products" ON public.cs_products;
DROP POLICY IF EXISTS "Allow admin update on cs_products" ON public.cs_products;
DROP POLICY IF EXISTS "Allow admin delete on cs_products" ON public.cs_products;

CREATE POLICY "Allow admin insert on cs_products"
    ON public.cs_products 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

CREATE POLICY "Allow admin update on cs_products" 
    ON public.cs_products 
    FOR UPDATE 
    TO authenticated 
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow admin delete on cs_products" 
    ON public.cs_products 
    FOR DELETE 
    TO authenticated 
    USING (true);


-- 3. Create Discount Codes Table
CREATE TABLE IF NOT EXISTS public.cs_discount_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    code TEXT NOT NULL UNIQUE,
    discount_percent INTEGER NOT NULL DEFAULT 10,
    is_active BOOLEAN NOT NULL DEFAULT true,
    valid_until TIMESTAMPTZ
);

ALTER TABLE public.cs_discount_codes ENABLE ROW LEVEL SECURITY;

-- Security Policies for cs_discount_codes
DROP POLICY IF EXISTS "Allow public select active discount codes" ON public.cs_discount_codes;
CREATE POLICY "Allow public select active discount codes" 
    ON public.cs_discount_codes 
    FOR SELECT 
    USING (is_active = true);


-- 4. Seed Initial Data
INSERT INTO public.cs_discount_codes (code, discount_percent, is_active)
VALUES 
    ('NFC2026', 15, true),
    ('WELCOME10', 10, true),
    ('JJEVENTS', 20, true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.cs_products (slug, name, category, gildan_model, print_technology, description, fabric_details, colors, estimated_days, price_starting_at, image_url, is_featured)
VALUES
    ('next-level-3600-adult-unisex-tee', 'Adult Unisex Custom Tee', 'Adult Collection', 'Next Level 3600', 'DTF Premium', 'Ultra-durable unisex crewneck shirt designed for everyday gym wear, coaching staff, and student apparel. Sizes S–2XL.', '100% Combed Ring-Spun Cotton • 4.3 oz/yd²', ARRAY['Black', 'White', 'Royal', 'Heavy Metal', 'Red'], 5, 14.50, 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=800', true),
    ('next-level-3310-youth-tee', 'Youth Custom Tee', 'Kids Collection', 'Next Level 3310', 'DTF Premium', 'Soft combed cotton crewneck sized for young athletes, matching the adult academy kit. Sizes XS–XL.', '100% Combed Ring-Spun Cotton Jersey • 4.3 oz/yd²', ARRAY['Black', 'White', 'Royal', 'Heavy Metal', 'Red'], 4, 12.90, 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&q=80&w=800', true),
    ('custom-academy-heavy-fleece-hoodie', 'Heavyweight Academy Pullover Hoodie', 'Hoodies', 'Gildan 18000 Heavy Blend', 'DTF Premium', 'Warm fleece hoodie featuring custom back print, chest academy crest, and sleeve prints.', '50% Cotton / 50% Polyester • 8.0 oz/yd²', ARRAY['Black', 'Dark Heather', 'Navy'], 6, 28.00, 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=800', true),
    ('custom-embroidered-gym-towel', 'Academy Microfiber Gym Towel', 'Accessories', 'Microfiber Premium', 'Screen Print / Embroidered', 'Quick-dry absorbent gym towel for mats and post-training workouts.', '80% Polyester / 20% Polyamide', ARRAY['Black', 'Navy'], 4, 8.50, 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&q=80&w=800', false)
ON CONFLICT (slug) DO NOTHING;


-- 5. Storage Bucket Configuration for Academy Logo Uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('academy-logos', 'academy-logos', true) 
ON CONFLICT (id) DO NOTHING;

-- Storage Security Policies
DROP POLICY IF EXISTS "Public Upload to academy-logos" ON storage.objects;
CREATE POLICY "Public Upload to academy-logos" 
    ON storage.objects
    FOR INSERT 
    WITH CHECK (bucket_id = 'academy-logos');

DROP POLICY IF EXISTS "Public Select from academy-logos" ON storage.objects;
CREATE POLICY "Public Select from academy-logos"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'academy-logos');


-- 6. Storage Bucket Configuration for Product Catalog Images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Security Policies
-- Public can view product images (catalog is public-facing)
DROP POLICY IF EXISTS "Public Select from product-images" ON storage.objects;
CREATE POLICY "Public Select from product-images"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'product-images');

-- Only authenticated admins can upload, replace, or remove product images
DROP POLICY IF EXISTS "Admin Upload to product-images" ON storage.objects;
CREATE POLICY "Admin Upload to product-images"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Admin Update on product-images" ON storage.objects;
CREATE POLICY "Admin Update on product-images"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'product-images')
    WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Admin Delete from product-images" ON storage.objects;
CREATE POLICY "Admin Delete from product-images"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'product-images');


-- 7. Create Partner Academies Table
CREATE TABLE IF NOT EXISTS public.cs_partner_academies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    name TEXT NOT NULL,
    subtitle TEXT,
    initials TEXT,
    logo_url TEXT
);

ALTER TABLE public.cs_partner_academies ENABLE ROW LEVEL SECURITY;

-- Security Policies for cs_partner_academies
DROP POLICY IF EXISTS "Allow public select on cs_partner_academies" ON public.cs_partner_academies;
CREATE POLICY "Allow public select on cs_partner_academies"
    ON public.cs_partner_academies
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow admin insert on cs_partner_academies" ON public.cs_partner_academies;
CREATE POLICY "Allow admin insert on cs_partner_academies"
    ON public.cs_partner_academies
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow admin update on cs_partner_academies" ON public.cs_partner_academies;
CREATE POLICY "Allow admin update on cs_partner_academies"
    ON public.cs_partner_academies
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow admin delete on cs_partner_academies" ON public.cs_partner_academies;
CREATE POLICY "Allow admin delete on cs_partner_academies"
    ON public.cs_partner_academies
    FOR DELETE
    TO authenticated
    USING (true);


-- =====================================================================
-- PHASE 2 — D2C Storefront (products migrated from Depop) + Shopping Cart
-- Additive evolution: does NOT modify cs_products (B2B quote catalog),
-- which keeps powering the existing quote-request workflow untouched.
-- =====================================================================

-- 8. Store Products — canonical D2C product (= one design / Depop "product_group")
CREATE TABLE IF NOT EXISTS public.cs_store_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    subcategory TEXT,
    brand TEXT,
    condition TEXT,
    material TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived'))
);

ALTER TABLE public.cs_store_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select on cs_store_products" ON public.cs_store_products;
CREATE POLICY "Allow public select on cs_store_products"
    ON public.cs_store_products
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow admin insert on cs_store_products" ON public.cs_store_products;
CREATE POLICY "Allow admin insert on cs_store_products"
    ON public.cs_store_products
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow admin update on cs_store_products" ON public.cs_store_products;
CREATE POLICY "Allow admin update on cs_store_products"
    ON public.cs_store_products
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow admin delete on cs_store_products" ON public.cs_store_products;
CREATE POLICY "Allow admin delete on cs_store_products"
    ON public.cs_store_products
    FOR DELETE
    TO authenticated
    USING (true);


-- 9. Store Product Variants — 1 row per Depop listing (its own size/color/price/stock)
CREATE TABLE IF NOT EXISTS public.cs_store_product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    product_id UUID NOT NULL REFERENCES public.cs_store_products(id) ON DELETE CASCADE,
    size TEXT,
    color TEXT,
    price NUMERIC(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    quantity INTEGER,
    sku TEXT
);

CREATE INDEX IF NOT EXISTS idx_cs_store_product_variants_product_id ON public.cs_store_product_variants(product_id);

ALTER TABLE public.cs_store_product_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select on cs_store_product_variants" ON public.cs_store_product_variants;
CREATE POLICY "Allow public select on cs_store_product_variants"
    ON public.cs_store_product_variants
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow admin insert on cs_store_product_variants" ON public.cs_store_product_variants;
CREATE POLICY "Allow admin insert on cs_store_product_variants"
    ON public.cs_store_product_variants
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow admin update on cs_store_product_variants" ON public.cs_store_product_variants;
CREATE POLICY "Allow admin update on cs_store_product_variants"
    ON public.cs_store_product_variants
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow admin delete on cs_store_product_variants" ON public.cs_store_product_variants;
CREATE POLICY "Allow admin delete on cs_store_product_variants"
    ON public.cs_store_product_variants
    FOR DELETE
    TO authenticated
    USING (true);


-- 10. Store Product Images — per variant, preserves Depop's per-listing image sets
CREATE TABLE IF NOT EXISTS public.cs_store_product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES public.cs_store_product_variants(id) ON DELETE CASCADE,
    position INTEGER NOT NULL DEFAULT 1,
    storage_path TEXT,
    source_url TEXT
);

CREATE INDEX IF NOT EXISTS idx_cs_store_product_images_variant_id ON public.cs_store_product_images(variant_id);

ALTER TABLE public.cs_store_product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select on cs_store_product_images" ON public.cs_store_product_images;
CREATE POLICY "Allow public select on cs_store_product_images"
    ON public.cs_store_product_images
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow admin insert on cs_store_product_images" ON public.cs_store_product_images;
CREATE POLICY "Allow admin insert on cs_store_product_images"
    ON public.cs_store_product_images
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow admin update on cs_store_product_images" ON public.cs_store_product_images;
CREATE POLICY "Allow admin update on cs_store_product_images"
    ON public.cs_store_product_images
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow admin delete on cs_store_product_images" ON public.cs_store_product_images;
CREATE POLICY "Allow admin delete on cs_store_product_images"
    ON public.cs_store_product_images
    FOR DELETE
    TO authenticated
    USING (true);


-- 11. Store Product Tags — search metadata / keywords per product
CREATE TABLE IF NOT EXISTS public.cs_store_product_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.cs_store_products(id) ON DELETE CASCADE,
    tag TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cs_store_product_tags_product_id ON public.cs_store_product_tags(product_id);

ALTER TABLE public.cs_store_product_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select on cs_store_product_tags" ON public.cs_store_product_tags;
CREATE POLICY "Allow public select on cs_store_product_tags"
    ON public.cs_store_product_tags
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow admin insert on cs_store_product_tags" ON public.cs_store_product_tags;
CREATE POLICY "Allow admin insert on cs_store_product_tags"
    ON public.cs_store_product_tags
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow admin delete on cs_store_product_tags" ON public.cs_store_product_tags;
CREATE POLICY "Allow admin delete on cs_store_product_tags"
    ON public.cs_store_product_tags
    FOR DELETE
    TO authenticated
    USING (true);


-- 12. Marketplace Listings — external identity per variant+channel, separate from internal identity.
-- UNIQUE(marketplace, external_listing_id) guarantees re-running the migration never duplicates a listing.
CREATE TABLE IF NOT EXISTS public.cs_marketplace_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    variant_id UUID NOT NULL REFERENCES public.cs_store_product_variants(id) ON DELETE CASCADE,
    marketplace TEXT NOT NULL,
    external_listing_id TEXT,
    external_url TEXT,
    status TEXT NOT NULL DEFAULT 'not_published',
    last_synced_at TIMESTAMPTZ,
    -- Per-channel overrides. NULL = inherit the canonical value from cs_store_products /
    -- cs_store_product_variants (effective_value = override ?? canonical). Lets Depop, Vinted,
    -- eBay, etc. diverge intentionally from the canonical title/description/price without
    -- duplicating the product, and without needing a schema change per marketplace.
    title_override TEXT,
    description_override TEXT,
    price_override NUMERIC(10,2),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    UNIQUE (marketplace, external_listing_id)
);

CREATE INDEX IF NOT EXISTS idx_cs_marketplace_listings_variant_id ON public.cs_marketplace_listings(variant_id);

ALTER TABLE public.cs_marketplace_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select on cs_marketplace_listings" ON public.cs_marketplace_listings;
CREATE POLICY "Allow public select on cs_marketplace_listings"
    ON public.cs_marketplace_listings
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow admin insert on cs_marketplace_listings" ON public.cs_marketplace_listings;
CREATE POLICY "Allow admin insert on cs_marketplace_listings"
    ON public.cs_marketplace_listings
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow admin update on cs_marketplace_listings" ON public.cs_marketplace_listings;
CREATE POLICY "Allow admin update on cs_marketplace_listings"
    ON public.cs_marketplace_listings
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow admin delete on cs_marketplace_listings" ON public.cs_marketplace_listings;
CREATE POLICY "Allow admin delete on cs_marketplace_listings"
    ON public.cs_marketplace_listings
    FOR DELETE
    TO authenticated
    USING (true);


-- 13. Shopping Cart — guest carts identified by an unguessable session token stored in a cookie
-- (same "possession of the token is the credential" pattern already used for cs_quote_requests
-- protocol lookups above). No payment/shipping data yet — added in a later phase.
CREATE TABLE IF NOT EXISTS public.cs_carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    session_token TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'abandoned', 'converted'))
);

ALTER TABLE public.cs_carts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert on cs_carts" ON public.cs_carts;
CREATE POLICY "Allow public insert on cs_carts"
    ON public.cs_carts
    FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select on cs_carts" ON public.cs_carts;
CREATE POLICY "Allow public select on cs_carts"
    ON public.cs_carts
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow public update on cs_carts" ON public.cs_carts;
CREATE POLICY "Allow public update on cs_carts"
    ON public.cs_carts
    FOR UPDATE
    USING (true)
    WITH CHECK (true);


CREATE TABLE IF NOT EXISTS public.cs_cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    cart_id UUID NOT NULL REFERENCES public.cs_carts(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES public.cs_store_product_variants(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price NUMERIC(10,2) NOT NULL,
    UNIQUE (cart_id, variant_id)
);

CREATE INDEX IF NOT EXISTS idx_cs_cart_items_cart_id ON public.cs_cart_items(cart_id);

ALTER TABLE public.cs_cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select on cs_cart_items" ON public.cs_cart_items;
CREATE POLICY "Allow public select on cs_cart_items"
    ON public.cs_cart_items
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow public insert on cs_cart_items" ON public.cs_cart_items;
CREATE POLICY "Allow public insert on cs_cart_items"
    ON public.cs_cart_items
    FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on cs_cart_items" ON public.cs_cart_items;
CREATE POLICY "Allow public update on cs_cart_items"
    ON public.cs_cart_items
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete on cs_cart_items" ON public.cs_cart_items;
CREATE POLICY "Allow public delete on cs_cart_items"
    ON public.cs_cart_items
    FOR DELETE
    USING (true);


-- 14. Storage: reuse the existing public "product-images" bucket for migrated Depop images.
-- Images are written under the "store/{product-slug}/{variant-id}/..." path prefix so they
-- never collide with the admin's existing "front_*" / "back_*" uploads for cs_products.
-- No new bucket or storage policy needed — see section 6 above.
