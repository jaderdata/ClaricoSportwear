'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-browser';
import Link from 'next/link';

export default function AdminLoginClient() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setAuthError(error.message);
      setIsSubmitting(false);
      return;
    }

    router.push('/admin');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-(--border-subtle) shadow-2xl space-y-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-red-600 to-rose-700 text-white flex items-center justify-center mx-auto shadow-xl font-black text-2xl font-mono">
          C
        </div>
        <div>
          <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-red-500 block mb-1">Restricted Area</span>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Clarico Admin Login</h1>
          <p className="text-xs text-slate-400 mt-1">Sign in to manage academy quote leads & catalog.</p>
        </div>
        <form onSubmit={handleLogin} noValidate className="space-y-4">
          <div>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Admin email"
              className="w-full touch-target px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm"
            />
          </div>
          <div>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full touch-target px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm"
            />
          </div>
          {authError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
              <span>{authError}</span>
            </div>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full touch-target py-3.5 rounded-xl bg-linear-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-sm uppercase tracking-wider shadow-lg flex items-center justify-center cursor-pointer disabled:opacity-60"
          >
            {isSubmitting ? 'Authenticating…' : 'Sign In'}
          </button>
        </form>
        <div className="pt-4 border-t border-slate-800/80">
          <Link href="/" className="text-xs text-slate-400 hover:text-white transition-colors">
            ← Return to Public Site
          </Link>
        </div>
      </div>
    </div>
  );
}
