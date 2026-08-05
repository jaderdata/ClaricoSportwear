import { Metadata } from 'next';
import ShopPageClient from './ShopPageClient';

export const metadata: Metadata = {
  title: 'Shop',
  description: 'Ready-to-ship individual pieces from Clarico Studio. Add to cart and check out directly, no quote required.',
  alternates: { canonical: '/shop' },
  openGraph: {
    title: 'Shop | Clarico Studio',
    description: 'Ready-to-ship individual pieces. Add to cart and check out directly.',
    url: 'https://claricostudio.com/shop',
  },
};

// Live storefront data — never statically prerendered.
export const dynamic = 'force-dynamic';

export default function ShopPage() {
  return <ShopPageClient />;
}
