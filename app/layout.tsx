export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import { DM_Sans, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Providers from '@/components/providers';
import { Toaster } from '@/components/ui/sonner';
import { ChunkLoadErrorHandler } from '@/components/chunk-load-error-handler';

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? 'http://localhost:3000'),
  title: 'LernAI – Deine KI-Lernapp',
  description: 'Fotografiere deine Schulunterlagen und lerne mit KI-generierten Zusammenfassungen und Quizfragen.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  openGraph: {
    title: 'LernAI – Deine KI-Lernapp',
    description: 'Fotografiere deine Schulunterlagen und lerne mit KI-generierten Zusammenfassungen und Quizfragen.',
    images: [{ url: '/og-image.png' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning className={`${dmSans.variable} ${jakarta.variable} ${jetbrains.variable}`}>
      <head>
        <script src="https://apps.abacus.ai/chatllm/appllm-lib.js" />
      </head>
      <body className="font-sans min-h-screen">
        <Providers>
          {children}
          <Toaster />
          <ChunkLoadErrorHandler />
        </Providers>
      </body>
    </html>
  );
}
