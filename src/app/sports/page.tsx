import { Metadata } from 'next';
import SportsPageClient from './SportsPageClient';

export const metadata: Metadata = {
  title: 'Sports Apparel | Jiu-Jitsu, MMA & Team Apparel',
  description: 'Custom premium apparel for Jiu-Jitsu academies, MMA gyms, wrestling teams, and sporting events. No minimum order, fast turnaround, Gildan + DTF printing.',
  alternates: { canonical: '/sports' },
  openGraph: {
    title: 'Sports Apparel | Clarico Studio',
    description: 'Premium custom sports apparel for Jiu-Jitsu academies and sports teams. No minimum order.',
    url: 'https://claricostudio.com/sports',
  },
};

export default function SportsPage() {
  return <SportsPageClient />;
}
