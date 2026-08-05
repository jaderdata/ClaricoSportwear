import ImportClient from './ImportClient';

// Admin-only migration tool — never statically prerendered.
export const dynamic = 'force-dynamic';

export default function ImportPage() {
  return <ImportClient />;
}
