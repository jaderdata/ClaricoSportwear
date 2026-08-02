import { Metadata } from 'next';
import SportsPageClient from './SportsPageClient';

export const metadata: Metadata = {
  title: 'Jiu-Jitsu Apparel | Custom Academy & Team Apparel',
  description: 'Custom premium apparel focused 100% on Jiu-Jitsu academies, teams, and championship events. No minimum order, fast turnaround, Next Level blanks + DTF printing.',
  alternates: { canonical: '/sports' },
  openGraph: {
    title: 'Jiu-Jitsu Apparel | Clarico Studio',
    description: 'Premium custom apparel focused 100% on Jiu-Jitsu academies and teams. No minimum order.',
    url: 'https://claricostudio.com/sports',
  },
};

export default function SportsPage() {
  return <SportsPageClient />;
}
