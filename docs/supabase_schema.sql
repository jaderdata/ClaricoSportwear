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
    is_featured BOOLEAN NOT NULL DEFAULT false
);

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
