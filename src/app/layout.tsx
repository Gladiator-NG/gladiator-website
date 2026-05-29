import type { Metadata, Viewport } from 'next';
import QueryProvider from '@/context/QueryProvider';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: 'Gladiator',
  title: {
    default: 'Gladiator | Private Charters & Waterfront Stays',
    template: '%s | Gladiator',
  },
  description:
    'Private yacht charters, tailored boat transfers, and secluded waterfront stays in Lagos, curated by Gladiator.',
  manifest: '/site.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Gladiator',
    statusBarStyle: 'default',
  },
  openGraph: {
    siteName: 'Gladiator',
    type: 'website',
    title: 'Gladiator | Private Charters & Waterfront Stays',
    description:
      'Private yacht charters, tailored boat transfers, and secluded waterfront stays in Lagos, curated by Gladiator.',
    images: ['/gladiator_icon.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gladiator | Private Charters & Waterfront Stays',
    description:
      'Private yacht charters, tailored boat transfers, and secluded waterfront stays in Lagos, curated by Gladiator.',
    images: ['/gladiator_icon.png'],
  },
  icons: {
    shortcut: '/favicon.ico',
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#2f8cca',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
