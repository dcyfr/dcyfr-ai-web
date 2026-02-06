import type { Metadata } from 'next';
import { Navbar } from '@/components/layout';
import { Footer } from '@/components/layout';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'DCYFR Web Template',
    template: '%s | DCYFR Web',
  },
  description: 'Production-ready full-stack Next.js web application template',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="relative flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
