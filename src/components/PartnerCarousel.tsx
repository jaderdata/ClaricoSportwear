'use client';

import React, { useEffect, useState } from 'react';
import { supabase, PartnerAcademy, DEFAULT_PARTNER_ACADEMIES } from '@/lib/supabase';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { ShieldCheck } from 'lucide-react';

export const PartnerCarousel: React.FC = () => {
  const [academies, setAcademies] = useState<PartnerAcademy[]>(DEFAULT_PARTNER_ACADEMIES);

  useEffect(() => {
    async function loadAcademies() {
      try {
        const { data } = await supabase.from('cs_partner_academies').select('*').order('created_at', { ascending: false });
        if (data && data.length > 0) {
          setAcademies(data as PartnerAcademy[]);
        } else {
          setAcademies(DEFAULT_PARTNER_ACADEMIES);
        }
      } catch (err) {
        console.error('Failed fetching partner academies from Supabase:', err);
        setAcademies(DEFAULT_PARTNER_ACADEMIES);
      }
    }
    loadAcademies();
  }, []);

  // Duplicate items for continuous seamless looping marquee
  const displayItems = academies.length > 0 ? [...academies, ...academies, ...academies, ...academies] : [];

  return (
    <Section id="partner-academies" border="top" className="py-14 sm:py-20 bg-paper/60 overflow-hidden">
      <Container className="mb-10 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="eyebrow mb-2 text-accent">Trusted by Champions</p>
          <h2 className="font-display text-h2 text-ink">Academies & Teams We Print For</h2>
        </div>
        <p className="text-sm text-ink-muted max-w-sm">
          From local academies to world championship teams — custom apparel built to withstand every roll.
        </p>
      </Container>

      {/* Infinite Scrolling Marquee */}
      <div className="relative w-full overflow-hidden py-4 select-none">
        {/* Left & Right Fade Gradients */}
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-linear-to-r from-paper to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-linear-to-l from-paper to-transparent z-10 pointer-events-none" />

        <div className="animate-marquee gap-6 px-4">
          {displayItems.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="bg-paper-raised border border-border/80 hover:border-accent/40 px-5 py-4 rounded-card flex items-center gap-4 min-w-65 sm:min-w-75 shrink-0 shadow-xs hover:shadow-md transition-all duration-300 group cursor-default"
            >
              <div className="size-12 rounded-full overflow-hidden bg-ink/5 border border-border shrink-0 flex items-center justify-center font-bold text-accent text-sm">
                {item.logo_url ? (
                  <img
                    src={item.logo_url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to initials avatar if image link fails
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : null}
                <span className="uppercase tracking-wider font-extrabold text-ink">
                  {item.initials || item.name.substring(0, 3)}
                </span>
              </div>

              <div className="overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-[15px] text-ink truncate group-hover:text-accent transition-colors">
                    {item.name}
                  </h3>
                  <ShieldCheck className="size-4 text-accent shrink-0" strokeWidth={2} />
                </div>
                <p className="text-xs text-ink-muted truncate mt-0.5">
                  {item.subtitle || 'Custom Team Apparel'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
};
