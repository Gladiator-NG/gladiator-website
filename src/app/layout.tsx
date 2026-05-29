import type { Metadata } from 'next';
import QueryProvider from '@/context/QueryProvider';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Gladiator | Private Charters & Waterfront Stays',
    template: '%s | Gladiator',
  },
  description:
    'Private yacht charters, tailored boat transfers, and secluded waterfront stays in Lagos, curated by Gladiator.',
  icons: {
    icon: [
      { url: '/brand/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/brand/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
  },
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
