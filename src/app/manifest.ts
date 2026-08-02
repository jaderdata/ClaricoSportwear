import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Clarico Studio | Custom Jiu-Jitsu Apparel',
    short_name: 'Clarico Studio',
    description: 'High-conversion custom apparel and tournament merchandise for Jiu-Jitsu academies.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F7F5F0',
    theme_color: '#F7F5F0',
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
