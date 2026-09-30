import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import '../styles/precision.css';
import '../styles/site.css';

/* One stylesheet of tokens read out of the Figma library, and one that
   builds the page from them. The ten stylesheets the old site ran on are
   still in the repository but no longer loaded: that page was dark, glass
   and soft-cornered, and this system is none of those things. */

export const metadata: Metadata = {
  metadataBase: new URL('https://lesreg.com'),
  title: 'Lesreg — softwarehus',
  description: 'Vi bygger systemerne der driver forretningen. Ét hus tegner det, bygger det og passer det bagefter.',
  openGraph: {
    title: 'Lesreg — softwarehus',
    description: 'Vi bygger systemerne der driver forretningen.',
    url: 'https://lesreg.com', siteName: 'Lesreg', locale: 'da_DK', type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#f4f3f0',
  width: 'device-width', initialScale: 1, viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }){
  return (
    <html lang="da" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
