'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QuoteRequest, Product, PartnerAcademy, DEFAULT_PARTNER_ACADEMIES } from '@/lib/supabase';
import { supabase } from '@/lib/supabase-browser';
import Link from 'next/link';

const MOCK_QUOTES: QuoteRequest[] = [
  {
    id: 'mock-1',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    protocol: 'CS-2026-8942',
    full_name: 'Prof. Rafael Silva',
    academy_name: 'Gracie Barra Downtown',
    email: 'rafael@gbdowntown.com',
    whatsapp: '+1 (555) 019-2834',
    quantity: 45,
    event_name: 'State Championship 2026',
    discount_code: 'WELCOME10',
    notes: 'Need 30 Next Level 3600 tees with gold back printing and 15 hoodies with academy chest crest.',
    logo_urls: ['gb_downtown_logo_vector.ai', 'sponsor_banner.pdf'],
    status: 'pending'
  },
  {
    id: 'mock-2',
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    protocol: 'CS-2026-3190',
    full_name: 'Coach Marcus Vance',
    academy_name: 'Alliance BJJ HQ',
    email: 'marcus@alliancebjj.com',
    whatsapp: '+1 (555) 234-5678',
    quantity: 120,
    event_name: 'Summer Seminar Series',
    discount_code: 'WELCOME10',
    notes: 'Next Level 3600 event shirts for tournament spectator giveaway.',
    logo_urls: ['alliance_shield_hd.png'],
    status: 'under_review'
  },
  {
    id: 'mock-3',
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    protocol: 'CS-2026-1044',
    full_name: 'Elena Rostova',
    academy_name: 'Atos Jiu-Jitsu Team',
    email: 'elena@atosjiujitsu.com',
    whatsapp: '+1 (555) 876-5432',
    quantity: 25,
    event_name: 'Women BJJ Camp',
    discount_code: undefined,
    notes: 'Next Level 3600 tees for the women\'s squad in black and white.',
    logo_urls: ['atos_womens_team.eps'],
    status: 'approved'
  }
];

const FALLBACK_PRODUCTS: Product[] = [
  {
    id: '1',
    created_at: new Date().toISOString(),
    slug: 'next-level-3600-adult-unisex-tee',
    name: 'Adult Unisex Custom Tee',
    category: 'Adult Collection',
    gildan_model: 'Next Level 3600',
    print_technology: 'DTF Premium',
    description: 'Ultra-durable unisex crewneck shirt designed for everyday gym wear, coaching staff, and student apparel. Sizes S–2XL.',
    fabric_details: '100% Combed Ring-Spun Cotton • 4.3 oz/yd²',
    colors: ['Black', 'White', 'Royal', 'Heavy Metal', 'Red'],
    estimated_days: 5,
    price_starting_at: 14.50,
    image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=800',
    is_featured: true
  },
  {
    id: '2',
    created_at: new Date().toISOString(),
    slug: 'next-level-3310-youth-tee',
    name: 'Youth Custom Tee',
    category: 'Kids Collection',
    gildan_model: 'Next Level 3310',
    print_technology: 'DTF Premium',
    description: 'Soft combed cotton crewneck sized for young athletes, matching the adult academy kit. Sizes XS–XL.',
    fabric_details: '100% Combed Ring-Spun Cotton Jersey • 4.3 oz/yd²',
    colors: ['Black', 'White', 'Royal', 'Heavy Metal', 'Red'],
    estimated_days: 4,
    price_starting_at: 12.90,
    image_url: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&q=80&w=800',
    is_featured: true
  }
];

export default function AdminDashboard() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'quotes' | 'products' | 'academies'>('quotes');

  const [quotes, setQuotes] = useState<QuoteRequest[]>(MOCK_QUOTES);
  const [products, setProducts] = useState<Product[]>(FALLBACK_PRODUCTS);
  const [academies, setAcademies] = useState<PartnerAcademy[]>(DEFAULT_PARTNER_ACADEMIES);
  const [loading, setLoading] = useState<boolean>(true);

  // Academy Form State
  const [addAcademyModalOpen, setAddAcademyModalOpen] = useState<boolean>(false);
  const [editingAcademyId, setEditingAcademyId] = useState<string | null>(null);
  const [newAcadName, setNewAcadName] = useState('');
  const [newAcadSubtitle, setNewAcadSubtitle] = useState('');
  const [newAcadInitials, setNewAcadInitials] = useState('');
  const [newAcadLogo, setNewAcadLogo] = useState('');
  const [academyError, setAcademyError] = useState('');

  const fetchAcademies = () => {
    try {
      const saved = localStorage.getItem('clarico_partner_academies');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAcademies(parsed);
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }
    setAcademies(DEFAULT_PARTNER_ACADEMIES);
  };

  const saveAcademiesToStorage = (updated: PartnerAcademy[]) => {
    setAcademies(updated);
    try {
      localStorage.setItem('clarico_partner_academies', JSON.stringify(updated));
      window.dispatchEvent(new Event('clarico_academies_updated'));
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenAddAcademy = () => {
    setEditingAcademyId(null);
    setNewAcadName('');
    setNewAcadSubtitle('');
    setNewAcadInitials('');
    setNewAcadLogo('');
    setAcademyError('');
    setAddAcademyModalOpen(true);
  };

  const handleOpenEditAcademy = (acad: PartnerAcademy) => {
    setEditingAcademyId(acad.id);
    setNewAcadName(acad.name);
    setNewAcadSubtitle(acad.subtitle || '');
    setNewAcadInitials(acad.initials || '');
    setNewAcadLogo(acad.logo_url || '');
    setAcademyError('');
    setAddAcademyModalOpen(true);
  };

  const handleAcademyLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setAcademyError('A imagem deve ter menos de 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setNewAcadLogo(event.target.result as string);
        setAcademyError('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteAcademy = (id: string) => {
    if (!confirm('Tem certeza que deseja remover esta academia parceira?')) return;
    const updated = academies.filter(a => a.id !== id);
    saveAcademiesToStorage(updated);
  };

  const handleSubmitAcademy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAcadName.trim()) {
      setAcademyError('Por favor insira o nome da academia.');
      return;
    }

    if (editingAcademyId) {
      const updated = academies.map(a =>
        a.id === editingAcademyId
          ? {
              ...a,
              name: newAcadName.trim(),
              subtitle: newAcadSubtitle.trim() || 'Custom Academy Apparel',
              initials: newAcadInitials.trim().toUpperCase() || newAcadName.substring(0, 3).toUpperCase(),
              logo_url: newAcadLogo.trim(),
            }
          : a
      );
      saveAcademiesToStorage(updated);
    } else {
      const newAcad: PartnerAcademy = {
        id: `acad-${Date.now()}`,
        name: newAcadName.trim(),
        subtitle: newAcadSubtitle.trim() || 'Custom Academy Apparel',
        initials: newAcadInitials.trim().toUpperCase() || newAcadName.substring(0, 3).toUpperCase(),
        logo_url: newAcadLogo.trim(),
      };
      saveAcademiesToStorage([newAcad, ...academies]);
    }

    setAddAcademyModalOpen(false);
  };

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedQuote, setSelectedQuote] = useState<QuoteRequest | null>(null);

  // Product Form Modal State (shared between Add and Edit)
  const [addProductModalOpen, setAddProductModalOpen] = useState<boolean>(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Adult Collection');
  const [newProdGildan, setNewProdGildan] = useState('Next Level 3600');
  const [newProdPrice, setNewProdPrice] = useState('14.50');
  const [newProdDays, setNewProdDays] = useState('5');
  const [newProdImage, setNewProdImage] = useState('');
  const [newProdBackImage, setNewProdBackImage] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdColors, setNewProdColors] = useState('Black, White, Royal, Heavy Metal, Red');
  const [newProdFeatured, setNewProdFeatured] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [productError, setProductError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState('');
  const [isUploadingBackImage, setIsUploadingBackImage] = useState(false);
  const [backImageUploadError, setBackImageUploadError] = useState('');

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('cs_quote_requests').select('*').order('created_at', { ascending: false });
      if (data && data.length > 0) setQuotes(data as QuoteRequest[]);
    } catch (err) {
      console.error('Error fetching quotes:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data } = await supabase.from('cs_products').select('*').order('created_at', { ascending: false });
      if (data && data.length > 0) setProducts(data as Product[]);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  useEffect(() => {
    // Fetching on mount requires setState inside this effect (no data-fetching library in use)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchQuotes();
    fetchProducts();
    fetchAcademies();

    const { data: authListener } = supabase.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_OUT') {
        router.push('/admin/login');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  const handleUpdateStatus = async (quoteId: string, newStatus: QuoteRequest['status']) => {
    try {
      await supabase.from('cs_quote_requests').update({ status: newStatus }).eq('id', quoteId);
      setQuotes(prev => prev.map(q => (q.id === quoteId ? { ...q, status: newStatus } : q)));
      if (selectedQuote?.id === quoteId) {
        setSelectedQuote(prev => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const resetProductForm = () => {
    setEditingProductId(null);
    setNewProdName('');
    setNewProdCategory('Adult Collection');
    setNewProdGildan('Next Level 3600');
    setNewProdPrice('14.50');
    setNewProdDays('5');
    setNewProdImage('');
    setNewProdBackImage('');
    setNewProdDesc('');
    setNewProdColors('Black, White, Royal, Heavy Metal, Red');
    setNewProdFeatured(false);
    setImageUploadError('');
    setBackImageUploadError('');
  };

  const openAddProductModal = () => {
    resetProductForm();
    setProductError('');
    setAddProductModalOpen(true);
  };

  const openEditProductModal = (prod: Product) => {
    setEditingProductId(prod.id);
    setNewProdName(prod.name);
    setNewProdCategory(prod.category);
    setNewProdGildan(prod.gildan_model);
    setNewProdPrice(String(prod.price_starting_at));
    setNewProdDays(String(prod.estimated_days));
    setNewProdImage(prod.image_url);
    setNewProdBackImage(prod.back_image_url || '');
    setNewProdDesc(prod.description);
    setNewProdColors(prod.colors.join(', '));
    setNewProdFeatured(prod.is_featured);
    setProductError('');
    setImageUploadError('');
    setBackImageUploadError('');
    setAddProductModalOpen(true);
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setImageUploadError('');
    setIsUploadingImage(true);

    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `front_${Date.now()}_${cleanFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(storagePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      setIsUploadingImage(false);
      setImageUploadError(uploadError.message);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(storagePath);
    setNewProdImage(publicUrlData.publicUrl);
    setIsUploadingImage(false);
  };

  const handleBackImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setBackImageUploadError('');
    setIsUploadingBackImage(true);

    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `back_${Date.now()}_${cleanFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(storagePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      setIsUploadingBackImage(false);
      setBackImageUploadError(uploadError.message);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(storagePath);
    setNewProdBackImage(publicUrlData.publicUrl);
    setIsUploadingBackImage(false);
  };

  // Add / Edit Product Handler
  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductError('');

    if (!newProdImage) {
      setProductError('Please upload a product image before saving.');
      return;
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setProductError(`No authenticated session found on the browser client (${userError?.message || 'no user'}). Try logging out and back in.`);
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    let jwtRole = 'unknown';
    let jwtExp = 'unknown';
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        jwtRole = payload.role;
        jwtExp = new Date(payload.exp * 1000).toISOString();
      } catch {
        jwtRole = 'decode-failed';
      }
    }

    if (editingProductId) {
      const { data: existingRow, error: existErr } = await supabase
        .from('cs_products')
        .select('id')
        .eq('id', editingProductId)
        .maybeSingle();
      if (existErr || !existingRow) {
        setProductError(`Diagnostic: no row found for id "${editingProductId}" via a plain SELECT (logged in as ${user.email}, jwt role: ${jwtRole}, exp: ${jwtExp}). ${existErr?.message || ''}`);
        return;
      }
    }

    const diagSuffix = ` [diag: user=${user.email}, jwt role=${jwtRole}, exp=${jwtExp}]`;

    setIsSavingProduct(true);

    const colorsArray = newProdColors.split(',').map(c => c.trim()).filter(Boolean);

    const prodFields = {
      name: newProdName,
      category: newProdCategory,
      gildan_model: newProdGildan,
      description: newProdDesc || 'Premium custom academy apparel with high-definition DTF print.',
      colors: colorsArray,
      estimated_days: Number(newProdDays),
      price_starting_at: Number(newProdPrice),
      image_url: newProdImage,
      back_image_url: newProdBackImage || null,
      is_featured: newProdFeatured
    };

    if (editingProductId) {
      const { data, error } = await supabase
        .from('cs_products')
        .update(prodFields)
        .eq('id', editingProductId)
        .select('*')
        .single();
      setIsSavingProduct(false);

      if (error) {
        setProductError(`${error.message}${error.code ? ` (code: ${error.code})` : ''}${error.details ? ` — ${error.details}` : ''}${diagSuffix}`);
        return;
      }

      setProducts(prev => prev.map(p => (p.id === editingProductId ? (data as Product) : p)));
    } else {
      const slug = newProdName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4);
      const { data, error } = await supabase
        .from('cs_products')
        .insert({ ...prodFields, slug, print_technology: 'DTF Premium', fabric_details: '100% Ring Spun Cotton' })
        .select('*')
        .single();
      setIsSavingProduct(false);

      if (error) {
        setProductError(`${error.message}${error.code ? ` (code: ${error.code})` : ''}${error.details ? ` — ${error.details}` : ''}${diagSuffix}`);
        return;
      }

      setProducts(prev => [data as Product, ...prev]);
    }

    setAddProductModalOpen(false);
    resetProductForm();
  };

  // Delete Product Handler
  const handleDeleteProduct = async (prodId: string) => {
    if (!confirm('Are you sure you want to delete this product from the catalog?')) return;

    setDeleteError('');
    const { error } = await supabase.from('cs_products').delete().eq('id', prodId);
    if (error) {
      setDeleteError(error.message);
      return;
    }
    setProducts(prev => prev.filter(p => p.id !== prodId));
  };

  const handleOpenWhatsApp = (quote: QuoteRequest) => {
    const cleanPhone = quote.whatsapp.replace(/[^\d+]/g, '');
    const message = encodeURIComponent(
      `Hello ${quote.full_name}! 👋 This is Clarico Studio responding to your custom quote request [${quote.protocol}] for ${quote.academy_name}. We have reviewed your artwork and quantity of ${quote.quantity} pieces. How can we proceed?`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch =
      quote.protocol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.academy_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex flex-col font-sans">
      
      {/* Admin Top Header */}
      <header className="glass-panel border-b border-(--border-subtle) sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            <div className="flex items-center gap-4">
              <Link href="/" className="touch-target px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors font-bold text-xs">
                ← Back
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-red-600 to-rose-700 flex items-center justify-center shadow-lg font-black text-white text-xl font-mono">
                  C
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-extrabold tracking-wider text-white uppercase block leading-none">CLARICO ADMIN</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 uppercase">
                      Authenticated
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 block mt-1">Management Portal</span>
                </div>
              </div>
            </div>

            {/* Tab Switcher */}
            <div className="hidden md:flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
              <button
                onClick={() => setActiveTab('quotes')}
                className={`px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeTab === 'quotes' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Quotes & Leads
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeTab === 'products' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Catalog & Products
              </button>
              <button
                onClick={() => setActiveTab('academies')}
                className={`px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeTab === 'academies' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Academias Parceiras ({academies.length})
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => { fetchQuotes(); fetchProducts(); fetchAcademies(); }}
                className="touch-target px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <span className="hidden sm:inline">Refresh Data</span>
              </button>
              <button
                onClick={handleLogout}
                className="touch-target px-4 py-2 rounded-xl bg-red-600/10 hover:bg-red-600 border border-red-500/30 text-red-400 hover:text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Logout
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="md:hidden flex border-t border-slate-800 px-4 py-2 gap-2">
          <button
            onClick={() => setActiveTab('quotes')}
            className={`flex-1 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-colors ${
              activeTab === 'quotes' ? 'bg-red-600 text-white' : 'bg-slate-900 text-slate-400'
            }`}
          >
            Quotes ({quotes.length})
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`flex-1 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-colors ${
              activeTab === 'products' ? 'bg-red-600 text-white' : 'bg-slate-900 text-slate-400'
            }`}
          >
            Catalog ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('academies')}
            className={`flex-1 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-colors ${
              activeTab === 'academies' ? 'bg-red-600 text-white' : 'bg-slate-900 text-slate-400'
            }`}
          >
            Academias ({academies.length})
          </button>
        </div>
      </header>

      {/* Main Admin Dashboard Body */}
      <main className="grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* TAB 1: QUOTES & LEADS */}
        {activeTab === 'quotes' && (
          <div className="space-y-8">
            {/* KPI Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-card p-5 rounded-2xl border border-slate-800">
                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">Total Quotes</div>
                <div className="text-3xl font-black text-white">{quotes.length}</div>
                <span className="text-[10px] text-slate-500 mt-1 block">Lifetime inquiries</span>
              </div>
              <div className="glass-card p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5">
                <div className="text-xs font-extrabold uppercase tracking-wider text-amber-400 mb-2">Pending Action</div>
                <div className="text-3xl font-black text-amber-400">{quotes.filter(q => q.status === 'pending').length}</div>
                <span className="text-[10px] text-slate-400 mt-1 block">Awaiting response</span>
              </div>
              <div className="glass-card p-5 rounded-2xl border border-blue-500/30 bg-blue-500/5">
                <div className="text-xs font-extrabold uppercase tracking-wider text-blue-400 mb-2">Under Review</div>
                <div className="text-3xl font-black text-blue-400">{quotes.filter(q => q.status === 'under_review').length}</div>
                <span className="text-[10px] text-slate-400 mt-1 block">Art & pricing in progress</span>
              </div>
              <div className="glass-card p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
                <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 mb-2">Approved Leads</div>
                <div className="text-3xl font-black text-emerald-400">{quotes.filter(q => q.status === 'approved').length}</div>
                <span className="text-[10px] text-slate-400 mt-1 block">Sent to production</span>
              </div>
            </div>

            {/* Filter Toolbar */}
            <div className="glass-panel p-4 rounded-2xl border border-(--border-subtle) flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="w-full md:w-96">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search protocol, academy, applicant..."
                  className="w-full touch-target px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-xs"
                />
              </div>
              <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
                {['all', 'pending', 'under_review', 'approved', 'rejected'].map(st => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                      statusFilter === st ? 'bg-red-600 text-white shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Quotes Table */}
            <div className="glass-card rounded-2xl overflow-hidden border border-(--border-subtle)">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900/90 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-800">
                      <th className="py-4 px-6">Protocol</th>
                      <th className="py-4 px-6">Academy / Contact</th>
                      <th className="py-4 px-6">Qty / Event</th>
                      <th className="py-4 px-6">Discount</th>
                      <th className="py-4 px-6">Date</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">Loading quote requests…</td>
                      </tr>
                    ) : filteredQuotes.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">No quote requests match your filter criteria.</td>
                      </tr>
                    ) : (
                      filteredQuotes.map(quote => (
                        <tr key={quote.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-4 px-6 font-mono font-bold text-red-400">{quote.protocol}</td>
                          <td className="py-4 px-6">
                            <div className="font-bold text-white text-sm">{quote.academy_name}</div>
                            <div className="text-slate-400 text-xs">{quote.full_name}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{quote.email}</div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="font-extrabold text-amber-400">{quote.quantity} pcs</span>
                            {quote.event_name && <div className="text-[10px] text-slate-400 truncate max-w-40 mt-0.5">{quote.event_name}</div>}
                          </td>
                          <td className="py-4 px-6">
                            {quote.discount_code ? (
                              <span className="px-2 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[10px] font-bold">
                                {quote.discount_code}
                              </span>
                            ) : <span className="text-slate-600">—</span>}
                          </td>
                          <td className="py-4 px-6 text-slate-400 text-[11px]">
                            {new Date(quote.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-4 px-6">
                            <select
                              value={quote.status}
                              onChange={e => handleUpdateStatus(quote.id, e.target.value as QuoteRequest['status'])}
                              className={`touch-target px-3 py-1.5 rounded-lg text-xs font-bold border focus:outline-none cursor-pointer ${
                                quote.status === 'pending'
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                  : quote.status === 'under_review'
                                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                  : quote.status === 'approved'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : 'bg-red-500/10 text-red-400 border-red-500/30'
                              }`}
                            >
                              <option value="pending" className="bg-slate-900 text-amber-400">Pending</option>
                              <option value="under_review" className="bg-slate-900 text-blue-400">Under Review</option>
                              <option value="approved" className="bg-slate-900 text-emerald-400">Approved</option>
                              <option value="rejected" className="bg-slate-900 text-red-400">Rejected</option>
                            </select>
                          </td>
                          <td className="py-4 px-6 text-right space-x-2">
                            <button
                              onClick={() => setSelectedQuote(quote)}
                              className="touch-target px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                            >
                              Details
                            </button>
                            <button
                              onClick={() => handleOpenWhatsApp(quote)}
                              className="touch-target px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 text-xs font-bold transition-colors cursor-pointer"
                            >
                              WhatsApp
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CATALOG & PRODUCT MANAGER */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-(--border-subtle)">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-red-500 block mb-1">Live Catalog Control</span>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Apparel & Product Manager</h2>
                <p className="text-xs text-slate-400 mt-1">Manage Next Level blank tees, starting prices, estimated days, and featured items.</p>
              </div>
              <button
                onClick={openAddProductModal}
                className="touch-target px-6 py-3 rounded-xl bg-linear-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg cursor-pointer"
              >
                + Add New Product
              </button>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
                Failed to delete product: {deleteError}
              </div>
            )}

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(prod => (
                <div key={prod.id} className="glass-card rounded-2xl overflow-hidden border border-(--border-subtle) flex flex-col justify-between group">
                  <div className="relative h-48 bg-slate-900 overflow-hidden">
                    <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-slate-950/80 text-amber-400 text-[10px] font-extrabold border border-slate-800">
                      {prod.gildan_model}
                    </div>
                    {prod.is_featured && (
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-red-600 text-white text-[10px] font-extrabold uppercase">
                        Popular
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-slate-400">{prod.category}</span>
                      <h3 className="text-base font-extrabold text-white uppercase tracking-tight">{prod.name}</h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{prod.description}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Starting at</span>
                        <span className="text-base font-black text-amber-400">${Number(prod.price_starting_at).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditProductModal(prod)}
                          className="touch-target px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                          title="Edit Product"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="touch-target px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                          title="Delete Product"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ACADEMIAS PARCEIRAS TAB ── */}
        {activeTab === 'academies' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
              <div>
                <h2 className="text-xl font-extrabold text-white uppercase tracking-wide">Academias Parceiras ({academies.length})</h2>
                <p className="text-xs text-slate-400 mt-1">Gerencie os nomes e logos das academias exibidas no carrossel da homepage do site.</p>
              </div>
              <button
                onClick={handleOpenAddAcademy}
                className="touch-target px-5 py-2.5 rounded-xl bg-linear-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer"
              >
                + Adicionar Nova Academia
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {academies.map((acad) => (
                <div key={acad.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex items-center justify-between gap-4 hover:border-slate-700 transition-all">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="size-12 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0 font-black text-rose-500 text-sm">
                      {acad.logo_url ? (
                        <img src={acad.logo_url} alt={acad.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{acad.initials || acad.name.substring(0, 3)}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-white text-base truncate">{acad.name}</h3>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{acad.subtitle || 'Parceiro Oficial'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleOpenEditAcademy(acad)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteAcademy(acad.id)}
                      className="px-3 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/30 text-red-400 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Quote Details Modal */}
      {selectedQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl glass-panel rounded-2xl overflow-hidden border border-(--border-subtle) shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs text-slate-400 uppercase font-bold tracking-widest block">Quote Inquiry Detail</span>
                <h3 className="text-2xl font-black font-mono text-red-500">{selectedQuote.protocol}</h3>
              </div>
              <button onClick={() => setSelectedQuote(null)} className="touch-target w-8 h-8 rounded-full bg-slate-900 text-slate-400 hover:text-white cursor-pointer flex items-center justify-center font-bold">✕</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block mb-1">Academy Name:</span>
                <span className="text-sm font-bold text-white">{selectedQuote.academy_name}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block mb-1">Applicant Name:</span>
                <span className="text-sm font-bold text-white">{selectedQuote.full_name}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block mb-1">Email Contact:</span>
                <span className="text-sm font-bold text-white">{selectedQuote.email}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block mb-1">WhatsApp Phone:</span>
                <span className="text-sm font-bold text-emerald-400">{selectedQuote.whatsapp}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block mb-1">Requested Quantity:</span>
                <span className="text-sm font-black text-amber-400">{selectedQuote.quantity} pieces</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block mb-1">Discount Code:</span>
                <span className="text-sm font-mono font-bold text-amber-300">{selectedQuote.discount_code || 'None'}</span>
              </div>
            </div>
            {selectedQuote.notes && (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Placement Notes & Instructions:</span>
                <p className="text-xs text-slate-200 leading-relaxed">{selectedQuote.notes}</p>
              </div>
            )}
            {selectedQuote.logo_urls && selectedQuote.logo_urls.length > 0 && (
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Uploaded Logo Attachments:</span>
                <div className="space-y-2">
                  {selectedQuote.logo_urls.map((file, i) => {
                    const isUrl = file.startsWith('http');
                    const fileName = isUrl ? file.split('/').pop() || file : file;
                    return (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                        <div className="flex items-center gap-2 text-slate-200 overflow-hidden">
                          <span className="font-mono text-red-500 font-bold">[FILE]</span>
                          <span className="font-mono truncate max-w-xs">{fileName}</span>
                        </div>
                        {isUrl ? (
                          <a href={file} target="_blank" rel="noopener noreferrer" className="touch-target px-3 py-1 rounded bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white font-bold text-[10px] uppercase transition-colors shrink-0">Open Logo</a>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-bold uppercase shrink-0">Ready for DTF Vectoring</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row gap-3">
              <button onClick={() => handleOpenWhatsApp(selectedQuote)} className="flex-1 touch-target py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer">
                Contact Gym on WhatsApp
              </button>
              <button onClick={() => setSelectedQuote(null)} className="touch-target px-6 py-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Product Modal */}
      {addProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-xl glass-panel rounded-2xl overflow-hidden border border-(--border-subtle) shadow-2xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xl font-black text-white uppercase tracking-tight">
                {editingProductId ? 'Edit Catalog Product' : 'Add New Catalog Product'}
              </h3>
              <button onClick={() => { setAddProductModalOpen(false); resetProductForm(); }} className="touch-target w-8 h-8 rounded-full bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmitProduct} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={newProdName}
                  onChange={e => setNewProdName(e.target.value)}
                  placeholder="e.g. Championship Heavyweight Tee"
                  className="w-full touch-target px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Category</label>
                  <select
                    value={newProdCategory}
                    onChange={e => setNewProdCategory(e.target.value)}
                    className="w-full touch-target px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                  >
                    <option value="Adult Collection">Adult Collection</option>
                    <option value="Kids Collection">Kids Collection</option>
                    <option value="Hoodies">Hoodies</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Garment Model</label>
                  <input
                    type="text"
                    required
                    value={newProdGildan}
                    onChange={e => setNewProdGildan(e.target.value)}
                    placeholder="Next Level 3600"
                    className="w-full touch-target px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Starting Price ($USD)</label>
                  <input
                    type="number"
                    step="0.10"
                    required
                    value={newProdPrice}
                    onChange={e => setNewProdPrice(e.target.value)}
                    className="w-full touch-target px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Est. Lead Time (Days)</label>
                  <input
                    type="number"
                    required
                    value={newProdDays}
                    onChange={e => setNewProdDays(e.target.value)}
                    className="w-full touch-target px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                  />
                </div>
              </div>

              {/* Front and Back Product Images (Front Mandatory, Back Optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">
                    Foto da Frente <span className="text-red-500">* (Obrigatório)</span>
                  </label>
                  <div className="flex items-center gap-3">
                    {newProdImage && (
                      <img
                        src={newProdImage}
                        alt="Front preview"
                        className="w-14 h-14 rounded-xl object-cover border border-slate-800 shrink-0"
                      />
                    )}
                    <div className="border border-dashed border-slate-700 hover:border-red-500 rounded-xl px-3 py-2.5 text-center transition-colors cursor-pointer flex-1 bg-slate-900/50">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="hidden"
                        id="product-front-image-input"
                      />
                      <label htmlFor="product-front-image-input" className="cursor-pointer block text-slate-300 text-xs">
                        {isUploadingImage ? 'Enviando…' : newProdImage ? 'Substituir Foto' : '📁 Selecionar Foto Frente'}
                      </label>
                    </div>
                  </div>
                  {imageUploadError && (
                    <div className="mt-1.5 p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] font-semibold">
                      {imageUploadError}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">
                    Foto das Costas <span className="text-slate-500 font-normal">(Opcional)</span>
                  </label>
                  <div className="flex items-center gap-3">
                    {newProdBackImage && (
                      <img
                        src={newProdBackImage}
                        alt="Back preview"
                        className="w-14 h-14 rounded-xl object-cover border border-slate-800 shrink-0"
                      />
                    )}
                    <div className="border border-dashed border-slate-700 hover:border-red-500 rounded-xl px-3 py-2.5 text-center transition-colors cursor-pointer flex-1 bg-slate-900/50">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBackImageFileChange}
                        className="hidden"
                        id="product-back-image-input"
                      />
                      <label htmlFor="product-back-image-input" className="cursor-pointer block text-slate-300 text-xs">
                        {isUploadingBackImage ? 'Enviando…' : newProdBackImage ? 'Substituir Foto' : '📁 Selecionar Foto Costas'}
                      </label>
                    </div>
                  </div>
                  {backImageUploadError && (
                    <div className="mt-1.5 p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] font-semibold">
                      {backImageUploadError}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1">Available Colors (Comma separated)</label>
                <input
                  type="text"
                  value={newProdColors}
                  onChange={e => setNewProdColors(e.target.value)}
                  className="w-full touch-target px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newProdDesc}
                  onChange={e => setNewProdDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="featured-check"
                  checked={newProdFeatured}
                  onChange={e => setNewProdFeatured(e.target.checked)}
                  className="w-4 h-4 rounded text-red-600 bg-slate-900 border-slate-800"
                />
                <label htmlFor="featured-check" className="font-bold text-white uppercase text-xs">
                  Mark as Popular / Featured Badge
                </label>
              </div>

              {productError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
                  {productError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSavingProduct || isUploadingImage}
                className="w-full touch-target py-3 rounded-xl bg-linear-to-r from-red-600 to-rose-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg cursor-pointer"
              >
                {isSavingProduct
                  ? 'Saving Product...'
                  : editingProductId
                  ? 'Save Changes'
                  : 'Publish Product to Live Catalog'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Academy Modal */}
      {addAcademyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0f111a] border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-5 animate-reveal">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="font-extrabold text-white uppercase text-base tracking-wider">
                {editingAcademyId ? 'Editar Academia Parceira' : 'Adicionar Academia Parceira'}
              </h3>
              <button
                type="button"
                onClick={() => setAddAcademyModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitAcademy} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-300 uppercase text-xs mb-1">Nome da Academia *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Gracie Barra, Alliance BJJ..."
                  value={newAcadName}
                  onChange={(e) => setNewAcadName(e.target.value)}
                  className="w-full touch-target px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:border-red-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase text-xs mb-1">Subtítulo / Descrição</label>
                <input
                  type="text"
                  placeholder="Ex: Official Team Apparel, Tournament Merch..."
                  value={newAcadSubtitle}
                  onChange={(e) => setNewAcadSubtitle(e.target.value)}
                  className="w-full touch-target px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:border-red-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase text-xs mb-1">Sigla / Iniciais (opcional)</label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="Ex: GB, ALL, ATOS..."
                  value={newAcadInitials}
                  onChange={(e) => setNewAcadInitials(e.target.value)}
                  className="w-full touch-target px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:border-red-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase text-xs mb-1.5">Logo da Academia (Imagem)</label>

                {/* Computer File Upload Box */}
                <div className="border-2 border-dashed border-slate-700 hover:border-red-500 rounded-xl p-4 text-center transition-colors bg-slate-900/60 mb-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAcademyLogoFileUpload}
                    className="hidden"
                    id="academy-logo-file-input"
                  />
                  <label htmlFor="academy-logo-file-input" className="cursor-pointer block">
                    {newAcadLogo ? (
                      <div className="flex items-center justify-center gap-3">
                        <img src={newAcadLogo} alt="Preview" className="size-12 rounded-xl object-cover border border-slate-700 bg-black shrink-0" />
                        <div className="text-left">
                          <span className="text-xs font-bold text-emerald-400 block">✓ Imagem Selecionada</span>
                          <span className="text-[11px] text-slate-400">Clique para carregar outro arquivo do computador</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1 py-1">
                        <div className="text-2xl">📁</div>
                        <span className="text-xs font-bold text-white block">Clique para enviar imagem do seu Computador</span>
                        <span className="text-[11px] text-slate-400 block">PNG, JPG, SVG ou WEBP até 5MB</span>
                      </div>
                    )}
                  </label>
                </div>

                {/* Alternative URL Input */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ou cole a URL da imagem (https://...)"
                    value={newAcadLogo}
                    onChange={(e) => setNewAcadLogo(e.target.value)}
                    className="w-full touch-target px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-red-500 outline-none pr-16"
                  />
                  {newAcadLogo && (
                    <button
                      type="button"
                      onClick={() => setNewAcadLogo('')}
                      className="absolute right-2 top-1.5 text-xs font-bold text-slate-400 hover:text-red-400 px-2 py-1 rounded bg-slate-800"
                    >
                      Limpar
                    </button>
                  )}
                </div>
              </div>

              {academyError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
                  {academyError}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAddAcademyModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs uppercase cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-linear-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg cursor-pointer"
                >
                  {editingAcademyId ? 'Salvar Alterações' : 'Adicionar Academia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
