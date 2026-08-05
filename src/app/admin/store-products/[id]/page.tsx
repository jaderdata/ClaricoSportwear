import StoreProductEditorClient from '../StoreProductEditorClient';

// Admin-only product editor — never statically prerendered.
export const dynamic = 'force-dynamic';

export default async function StoreProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StoreProductEditorClient productId={id === 'new' ? undefined : id} />;
}
