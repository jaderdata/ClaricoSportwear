import { Metadata } from 'next';
import BusinessPageClient from './BusinessPageClient';

export const metadata: Metadata = {
  title: 'Business Apparel | Custom Uniforms & Team Shirts',
  description: 'Professional custom apparel and uniforms for restaurants, construction companies, gyms, retail teams, and any business. No minimum order, fast turnaround.',
  alternates: { canonical: '/business' },
  openGraph: {
    title: 'Business Apparel | Clarico Studio',
    description: 'Custom branded uniforms and apparel for businesses and corporate teams. No minimum order.',
    url: 'https://claricostudio.com/business',
  },
};

export default function BusinessPage() {
  return <BusinessPageClient />;
}
