import type { Metadata, Viewport } from "next";
import { Inter_Tight } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/cart/CartProvider";
import { CartDrawer } from "@/components/cart/CartDrawer";

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#F7F5F0",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://claricostudio.com"),
  title: {
    default: "Clarico Studio | Premium Custom Apparel",
    template: "%s | Clarico Studio"
  },
  description: "Premium custom sports apparel for Jiu-Jitsu academies, fight teams, and sports events. No minimum order, Next Level 3600 adult & 3310 youth blanks, high-definition DTF printing, and fast 3-5 day turnaround.",
  keywords: [
    "custom apparel studio",
    "Jiu-Jitsu custom shirts",
    "BJJ team apparel",
    "business uniforms custom",
    "no minimum custom shirts",
    "Next Level 3600 custom print",
    "Next Level 3310 youth tee",
    "DTF printing fast turnaround",
    "custom team apparel",
    "personalized t-shirts no minimum",
    "sports team apparel",
    "custom business uniforms"
  ],
  authors: [{ name: "Clarico Studio", url: "https://claricostudio.com" }],
  creator: "Clarico Studio",
  publisher: "Clarico Studio",
  category: "Custom Apparel & Printing",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Clarico Studio | Premium Custom Apparel",
    description: "Premium custom apparel for sports teams, individuals, and businesses. No minimum order, fast turnaround, Next Level blanks and DTF printing.",
    url: "https://claricostudio.com",
    siteName: "Clarico Studio",
    images: [
      {
        url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=1200",
        width: 1200,
        height: 630,
        alt: "Clarico Studio Premium Custom Apparel",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Clarico Studio | Premium Custom Apparel",
    description: "Custom apparel for teams, individuals, and businesses. No minimum, fast turnaround, premium Next Level + DTF.",
    images: ["https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=1200"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/favicon.ico" }
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  // Rich JSON-LD Structured Schemas for Google & Generative Engine Optimization (GEO)
  const jsonLdOrganization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Clarico Studio",
    "url": "https://claricostudio.com",
    "logo": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=400",
    "description": "Premium custom apparel studio for sports teams, individuals, and businesses. No minimum order, Next Level quality, fast DTF printing.",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+1-407-633-9166",
      "contactType": "customer service",
      "areaServed": "US",
      "availableLanguage": "English"
    },
    "sameAs": [
      "https://instagram.com/claricostudio"
    ]
  };

  const jsonLdFaq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is the minimum order quantity for custom apparel?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Clarico Studio has no minimum order requirements. You can order as few as 1 piece for a personal gift, or bulk runs of 500+ shirts for teams and businesses."
        }
      },
      {
        "@type": "Question",
        "name": "What blank shirt models and printing methods are used?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We use Next Level 3600 (adult, sizes S–2XL) and Next Level 3310 (youth, sizes XS–XL) combed ring-spun cotton tees, printed with high-definition Direct-to-Film (DTF) technology for crisp, vibrant, durable prints."
        }
      },
      {
        "@type": "Question",
        "name": "How long does turnaround and shipping take?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Standard production turnaround takes 3 to 5 business days, with live tracking via custom protocol code."
        }
      },
      {
        "@type": "Question",
        "name": "Do you serve businesses and non-sports customers?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. We serve three segments: Sports (academies, teams, events), Custom (personal apparel, gifts, occasions), and Business (uniforms, staff apparel, branded team clothing). All with the same quality, speed, and no minimum order."
        }
      }
    ]
  };

  return (
    <html
      lang="en"
      className={`${interTight.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLdOrganization, jsonLdFaq]) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-paper text-ink selection:bg-accent selection:text-paper font-sans">
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
