import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Toaster } from 'sonner';
import { CustomCursor } from '@/components/shared/custom-cursor';
import { PageLoadingBar } from '@/components/shared/page-loading-bar';
import { ScrollRevealProvider } from '@/components/shared/scroll-reveal-provider';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#1E40AF',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    default: 'SPD Logistics — Premium Transport & Logistics Management',
    template: '%s | SPD Logistics',
  },
  description:
    'SPD Logistics — Super Pak Data Goods Transport Co. Established 1996. Dedicated commercial fleet transport, consignment tracking, bilty management, and warehouse solutions across Pakistan.',
  keywords: [
    'logistics',
    'transport',
    'shipping',
    'tracking',
    'consignment',
    'bilty',
    'freight',
    'SPD Logistics',
    'Super Pak Data',
  ],
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SPD Logistics',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.__spd_deferredPrompt = null;
              window.addEventListener('beforeinstallprompt', function(e) {
                e.preventDefault();
                window.__spd_deferredPrompt = e;
                window.dispatchEvent(new CustomEvent('spd-pwa-ready'));
                console.log('[SPD PWA] Global beforeinstallprompt captured.');
              });
              if ('serviceWorker' in navigator) {
                if (document.readyState === 'complete') {
                  navigator.serviceWorker.register('/sw.js');
                } else {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js');
                  });
                }
              }
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange={false}
        >
          <PageLoadingBar />
          <CustomCursor />
          <ScrollRevealProvider>{children}</ScrollRevealProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              classNames: {
                toast:
                  'bg-card text-card-foreground border-border shadow-lg',
                title: 'font-semibold',
                description: 'text-muted-foreground',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
