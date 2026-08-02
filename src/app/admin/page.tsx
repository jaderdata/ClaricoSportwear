import AdminDashboardClient from './AdminDashboardClient';

// Auth-gated dashboard reading live Supabase data — never statically prerendered.
export const dynamic = 'force-dynamic';

export default function AdminPage() {
  return <AdminDashboardClient />;
}
