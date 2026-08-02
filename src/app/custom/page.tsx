import { Metadata } from 'next';
import CustomPageClient from './CustomPageClient';

export const metadata: Metadata = {
  title: 'Custom Apparel | No Minimum · Personal Shirts & Gifts',
  description: 'Turn any idea into premium custom apparel. Birthdays, events, gifts, reunions — order as few as 1 shirt. Upload your design, photo, or idea and we handle the rest.',
  alternates: { canonical: '/custom' },
  openGraph: {
    title: 'Custom Apparel | Clarico Studio',
    description: 'Create custom apparel for personal use, gifts, and special occasions. No minimum order.',
    url: 'https://claricostudio.com/custom',
  },
};

export default function CustomPage() {
  return <CustomPageClient />;
}
