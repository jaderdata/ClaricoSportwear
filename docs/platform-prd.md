# PRD – Premium Customization Platform for Jiu-Jitsu Academies

## 1. Product Vision

Develop a premium web platform focused on customizing t-shirts and products for jiu-jitsu academies and sports events. The initial goal is not to create a complete e-commerce, but a high-level commercial tool that conveys credibility, facilitates the order request process, and increases the conversion rate during in-person visits to academies.

The platform must be built from the beginning with a scalable architecture, allowing future evolution to serve companies, schools, sports teams, and other segments without needing to rebuild the system.

### Platform Language

- **Language:** American English (en-US) — 100% of customer-facing content.
- Includes: UI, button text, product descriptions, categories, forms, transactional emails, error messages, SEO (meta tags, titles).
- Source Code: variables, components, and comments also in English.
- Internal documentation (this PRD, agents, docs) remains in Portuguese. *(Note: This rule has been updated per the translation request, and all docs are now in English).*

## 2. Main Objective

Create the best digital experience for academies wanting to produce custom clothing quickly, with high quality, and without bureaucracy.

The system should act as an extension of the sales team, allowing any academy to view models, send their visual identity, and request a quote in a few minutes.

## 3. Value Proposition

The brand communication should revolve around four main pillars:

### Fast Production

- Extremely fast delivery.
- Simplified process.
- Clear communication regarding deadlines.

### No Minimum Order

- A single shirt or hundreds.
- The client buys exactly what they need.

### Total Customization

- Every project is unique.
- The academy can create exclusive products using their visual identity.

### Premium Quality

- Use of high-quality materials and printing.
- Initial products:
  - Gildan 3600
  - Gildan 64000 Softstyle
- Printing:
  - Premium DTF

## 4. Target Audience

### Phase 1

- Jiu-Jitsu Academies
- Event organizers
- Instructors
- Competition teams

### Phase 2

Expand to:

- Companies
- Schools
- CrossFit
- Muay Thai
- Wrestling
- General Gyms
- Corporate events

## 5. Commercial Objective

During in-person visits:

- The sales rep hands out an event flyer along with a 3D-printed wristband containing an NFC chip programmed with the platform link.
- By tapping their phone to the wristband, the client instantly accesses the platform.

> **Note:** NFC is just a physical commercial presentation accessory. There is no technical integration with the platform — the chip simply contains the website URL.

Inside, they can:

- Get to know the company;
- View models;
- Choose inspirations;
- Request a quote;
- Upload their logo;
- Start a custom project.

The platform must sell professionalism before the very first contact.

## 6. Visual Identity

The design must convey a premium perception.

### References

- Nike
- Apple
- Gymshark
- Ares Fightwear
- VHTS
- Shoyoroll

### Characteristics

- Lots of whitespace;
- Strong typography;
- Smooth animations;
- Modern appearance;
- Extremely fast navigation;
- Minimalist interface.

The goal is for the user to feel they are using an internationally established brand.

## 6.1 Mobile-First Requirements

> The first impression for most clients will be via mobile (accessed via the NFC wristband). The mobile experience must be flawless.

### Approach

- **Mobile-first:** The design must be created for mobile by default and progressively enhanced for larger screens.
- Every page, component, and interaction must work perfectly on 360px screens before considering desktop.

### Breakpoints

| Name | Width | Usage |
|------|-------|-------|
| Mobile | ≤ 768px | **Default** — primary design |
| Tablet | 769px – 1024px | Intermediate adaptation |
| Desktop | > 1024px | Expanded experience |

### Touch Rules

- **Minimum touch targets:** 48px × 48px (buttons, links, interactive icons)
- **Spacing between clickable elements:** Minimum 8px
- **Forms:** Inputs with a minimum height of 48px, labels always visible
- **Gestures:** Swipe support on product image galleries

### Mobile Performance

| Metric | Goal | Condition |
|--------|------|-----------|
| Largest Contentful Paint (LCP) | < 2.5s | 4G / average device |
| First Input Delay (FID) | < 100ms | 4G / average device |
| Cumulative Layout Shift (CLS) | < 0.1 | All pages |
| Time to Interactive (TTI) | < 3.5s | 4G / average device |

### Mandatory Optimizations

- Responsive images with `srcset` and modern formats (WebP/AVIF)
- Lazy loading for below-the-fold images
- Fonts with `font-display: swap`
- Route-based bundle splitting (automatic Next.js)

## 7. Platform Structure

### Home

Main banner with an impactful message.

- Example: "Premium Custom Apparel for Jiu-Jitsu Academies"
- Subtitle: Fast Turnaround • No Minimum Order • Fully Customizable

Buttons:

- Browse Collection
- Request a Quote

### How It Works

Simple four-step flow:

1. Choose a model.
2. Send your logo.
3. Receive the custom artwork.
4. Approval and production.

### Catalog

Categories:

- Academy Collection
- Event Collection
- Oversized
- Competition Shirts
- Women's Collection
- Kids Collection
- Hoodies
- Accessories

Each product must contain:

- Professional images;
- Description;
- Fabric;
- Model used;
- Available colors;
- Estimated timeframe;
- "Customize This Design" button.

### Product Page

Each product will have:

- Image gallery;
- Full description;
- Shirt specifications;
- Print type;
- Customization information;
- Quote request button.

### Quote Request

Fields:

- Name
- Academy
- Email
- WhatsApp
- Quantity
- Event
- Logo upload (see spec below)
- Discount Code (optional field with real-time validation)
- Notes

#### Logo Upload Specification

| Rule | Value |
|------|-------|
| Accepted formats | PNG, SVG, PDF, AI, EPS |
| Maximum size | 10 MB per file |
| Maximum quantity | Up to 3 files per request |
| Recommended minimum resolution | 300 DPI (show warning if below, but don't block) |

Behavior:

- **Drag & drop** or click to select a file
- **File preview** after upload (thumbnail for images, icon for AI/EPS/PDF)
- **Client-side validation:** Check format and size before sending. Display clear error message if invalid
- **Progress bar** during upload
- **Error messages:** Translated to English, specific (e.g., "File too large. Maximum size is 10 MB." instead of "Upload failed.")

After sending:

- Generate protocol;
- Send automatic email;
- Store request in the admin panel.

## 8. Admin Panel

Simple first version.

Features:

- View orders;
- Download uploaded files;
- Change status;
- Client history;
- Notes;
- Filter by academy;
- Quick search.

### Discount Coupon System

The panel must allow creating and managing discount coupons:

- **Create coupon:** Code, type (percentage or fixed amount), discount value, expiration date
- **Rules:** Single or multiple use, minimum quantity of pieces, total usage limit
- **Special types:** Referral coupon (linked to an academy), first-time purchase coupon
- **Monitoring:** View how many times each coupon was used, by whom, and total discount amount granted
- **Actions:** Enable, disable, edit, delete coupons

The quote form must have a "Discount Code" field where the client applies the coupon, with real-time validation.

Later evolve into a full CRM.

## 9. Competitive Advantages

The platform must continually highlight:

- ✓ Fast Turnaround
- ✓ No Minimum Order
- ✓ Premium Quality
- ✓ Fully Customizable
- ✓ Premium DTF Printing
- ✓ Professional Design

These advantages must appear at various points in the navigation, reinforcing the value proposition.

## 9.1 SEO Requirements

The platform must be built with SEO as a priority from the MVP.

### Technical SEO

- Server-Side Rendering (SSR) via Next.js for all public pages
- Dynamic meta tags per page (`title`, `description`, `og:image`, `og:title`)
- Automatically generated `sitemap.xml`
- Configured `robots.txt`
- Schema markup: `Product`, `Organization`, `BreadcrumbList`
- Friendly URLs without parameters (e.g., `/collection/academy` instead of `/collection?id=1`)
- Canonical URLs on all pages

### Content SEO

- Each product must have a unique title and description
- Descriptive alt text on all images
- Correct heading hierarchy (single `h1` per page)
- Each category functions as a rankable landing page

### Target Keywords

| Type | Examples |
|------|----------|
| Product | "custom jiu-jitsu shirts", "bjj academy t-shirts" |
| No minimum | "custom shirts no minimum order", "single custom tee" |
| Competition | "competition team shirts", "bjj tournament apparel" |
| Technical | "dtf printed martial arts clothing", "premium dtf printing" |

## 10. Technologies

### Frontend

- Next.js
- React
- Tailwind CSS
- Framer Motion

### Backend

- Supabase Authentication
- Supabase Database (PostgreSQL)
- Supabase Storage
- Supabase Realtime (for real-time status updates)

> **Justification:** Supabase was chosen over Firebase because it offers full PostgreSQL, essential for complex queries, reporting, and the marketplace model (V4). It also offers built-in auth, storage, and realtime, with lower lock-in risk and more predictable costs at scale.

### Hosting

- Vercel

### Notifications

- Resend or another transactional email service

### Architecture prepared for future integration with:

- Stripe
- Artwork approval system
- Client login
- Exclusive academy area

## 10.1 Testing Strategy

### E2E (End-to-End) Tests

Tool: **Playwright**

Critical flows that must have E2E coverage from the MVP:

| Flow | What to test |
|------|--------------|
| Catalog navigation | Home → Category → Product → Quote button |
| Quote form | Full completion, field validation, logo upload, successful submission |
| Logo upload | Valid formats accepted, invalid formats rejected, file > 10MB rejected, preview displayed |
| Discount coupon | Valid code applied, invalid code rejected, expired code rejected |
| Responsiveness | All flows above executed in mobile viewport (375px) and desktop (1440px) |
| Admin panel | Login, view orders, change status, download file |

### Performance Tests

Tool: **Lighthouse CI** integrated into the deployment pipeline (Vercel)

| Metric | Minimum Threshold |
|--------|-------------------|
| Performance Score | ≥ 90 |
| Accessibility Score | ≥ 90 |
| Best Practices Score | ≥ 90 |
| SEO Score | ≥ 95 |

> Deployments failing to meet thresholds should generate an alert (do not block in MVP, block from V2).

### Visual Tests

Tool: **Percy** or snapshot testing via Playwright

- Capture screenshots of main pages (Home, Catalog, Product, Form) on mobile and desktop
- Compare with baseline on each PR to detect visual regressions
- Difference threshold: < 0.1% of changed pixels without manual approval

## 11. Roadmap

### MVP

- Home
- Catalog
- Products
- Quote Form
- Logo Upload
- Admin Panel

### Version 2

- Client Login
- Order History
- Online Artwork Approval
- Academy Dashboard
- Discount Coupon System (generation, validation, referral)
- Academy Referral Program

### Version 3

- Automatic Logo Preview on Product
- Customization Editor
- Online Payment Integration
- Production Tracking
- Exclusive Event Area

### Version 4

Full Marketplace.

Each academy will have its own storefront within the platform.

The academy can sell its own custom products to students using the company's infrastructure, turning the platform into a customization ecosystem.

## 12. Long-Term Vision

The platform should not be perceived as a simple t-shirt catalog.

It must evolve into the main sports customization hub, connecting academies, events, athletes, and eventually companies in a single digital environment.

The experience must convey professionalism, speed, simplicity, and excellence at all touchpoints.

The ultimate goal is for the brand to be recognized as the leading reference in premium customization for the jiu-jitsu market, offering a complete solution from visual identity creation to product production and delivery.
