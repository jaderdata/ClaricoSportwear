import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { buildCanonicalListingInput } from '@/lib/publishing/build-input';
import { effectiveDescription, effectivePrice, effectiveTitle } from '@/lib/publishing/types';

// Read-only preview (Phase 4 STEP 25) — shows exactly what a marketplace connector would
// receive, without publishing anything. Useful for catching mapping issues before real API
// credentials exist, and afterward for double-checking a listing before it goes out.
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated. Log into /admin first.' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const variantId = body?.variantId as string | undefined;
  if (!variantId) {
    return NextResponse.json({ error: 'variantId is required.' }, { status: 400 });
  }

  const input = await buildCanonicalListingInput(supabase, variantId);
  if (!input) {
    return NextResponse.json({ error: 'Variant or product not found.' }, { status: 404 });
  }

  return NextResponse.json({
    input,
    effective: {
      title: effectiveTitle(input),
      description: effectiveDescription(input),
      price: effectivePrice(input),
    },
  });
}
