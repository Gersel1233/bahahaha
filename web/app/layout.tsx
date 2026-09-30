import type { Metadata, Viewport } from 'next';
import '../styles/styles.css';
import '../styles/lesreg.css';
import '../styles/bbh.css';
import '../styles/kunder.css';
import '../styles/telefon.css';
import '../styles/softwarehus.css';
import '../styles/kontakt.css';
import '../styles/mork.css';
import '../styles/dybde.css';

/* The stylesheets are imported in the order the hand-written page linked
   them, because a good deal of this design is one file correcting another —
   mork.css turns the page dark on top of the light one, dybde.css puts the
   room under all of it. Shuffle them and the site changes. */

export const metadata: Metadata = {
  metadataBase: new URL('https://lesreg.com'),
  title: 'Lesreg — softwarehus',
  description: 'Vi bygger systemerne der driver forretningen. Ét hus tegner det, bygger det og passer det bagefter.',
  openGraph: {
    title: 'Lesreg — softwarehus',
    description: 'Vi bygger systemerne der driver forretningen.',
    url: 'https://lesreg.com',
    siteName: 'Lesreg',
    locale: 'da_DK',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#0c0e11',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }){
  return (
    <html lang="da" className="site-ready">
      <body>{children}</body>
    </html>
  );
}
