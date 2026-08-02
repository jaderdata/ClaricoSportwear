import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Product {
  id: string;
  created_at: string;
  slug: string;
  name: string;
  category: string;
  gildan_model: string;
  print_technology: string;
  description: string;
  fabric_details: string;
  colors: string[];
  estimated_days: number;
  price_starting_at: number;
  image_url: string;
  back_image_url?: string;
  is_featured: boolean;
}

export interface QuoteRequest {
  id: string;
  created_at: string;
  protocol: string;
  full_name: string;
  academy_name: string;
  email: string;
  whatsapp: string;
  quantity: number;
  event_name?: string | null;
  discount_code?: string | null;
  notes?: string | null;
  logo_urls?: string[];
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  segment?: 'SPORTS' | 'CUSTOM' | 'BUSINESS';
}

export interface QuoteRequestInput {
  full_name: string;
  academy_name: string;
  email: string;
  whatsapp: string;
  quantity: number;
  event_name?: string;
  discount_code?: string;
  notes?: string;
  logo_urls?: string[];
  segment?: 'SPORTS' | 'CUSTOM' | 'BUSINESS';
}

export interface DiscountCode {
  id: string;
  code: string;
  discount_percent: number;
  is_active: boolean;
}

export interface PartnerAcademy {
  id: string;
  name: string;
  subtitle?: string;
  logo_url?: string;
  initials?: string;
}

export const DEFAULT_PARTNER_ACADEMIES: PartnerAcademy[] = [
  {
    id: 'acad-1',
    name: 'Gracie Barra',
    subtitle: 'Official Team & Academy Gear',
    initials: 'GB',
    logo_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=200',
  },
  {
    id: 'acad-2',
    name: 'Alliance BJJ',
    subtitle: 'Championship Event Shirts',
    initials: 'ALL',
    logo_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=200',
  },
  {
    id: 'acad-3',
    name: 'Atos Jiu-Jitsu',
    subtitle: 'Tournament & Staff Apparel',
    initials: 'ATOS',
    logo_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=200',
  },
  {
    id: 'acad-4',
    name: 'Checkmat Team',
    subtitle: 'Custom Academy Collection',
    initials: 'CHK',
    logo_url: 'https://images.unsplash.com/photo-1517438476312-10d79c077509?auto=format&fit=crop&q=80&w=200',
  },
  {
    id: 'acad-5',
    name: 'GF Team HQ',
    subtitle: 'Competition & Seminar Tees',
    initials: 'GFT',
    logo_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=200',
  },
  {
    id: 'acad-6',
    name: 'Zenith BJJ',
    subtitle: 'Gym Merch & Kids Program',
    initials: 'ZNT',
    logo_url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=200',
  },
];
