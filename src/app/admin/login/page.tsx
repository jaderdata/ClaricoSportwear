import AdminLoginClient from './AdminLoginClient';

// Auth page backed by a live Supabase client — never statically prerendered.
export const dynamic = 'force-dynamic';

export default function AdminLoginPage() {
  return <AdminLoginClient />;
}
