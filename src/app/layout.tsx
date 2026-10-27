import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Toaster } from 'sonner';
import { PageLoadingBar } from '@/components/shared/page-loading-bar';
import { ScrollRevealProvider } from '@/components/shared/scroll-reveal-provider';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#1E40AF',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
              try {
                var hasReset = localStorage.getItem('spd_production_clean_v1');
                if (!hasReset) {
                  localStorage.removeItem('spd_bilties');
                  localStorage.removeItem('spd_local_bilties');
                  localStorage.removeItem('spd_challans');
                  localStorage.removeItem('spd_local_challans');
                  localStorage.removeItem('spd_customers');
                  localStorage.removeItem('spd_local_customers');
                  localStorage.removeItem('spd_cash_books');
                  localStorage.removeItem('spd_local_cash_books');
                  localStorage.removeItem('spd_local_tracking');
                  localStorage.removeItem('spd_local_deleted_bilties');
                  localStorage.removeItem('spd_local_deleted_challans');
                  localStorage.removeItem('spd_local_deleted_customers');
                  localStorage.setItem('spd_bilties', JSON.stringify([]));
                  localStorage.setItem('spd_local_bilties', JSON.stringify([]));
                  localStorage.setItem('spd_challans', JSON.stringify([]));
                  localStorage.setItem('spd_local_challans', JSON.stringify([]));
                  localStorage.setItem('spd_customers', JSON.stringify([]));
                  localStorage.setItem('spd_local_customers', JSON.stringify([]));
                  localStorage.setItem('spd_cash_books', JSON.stringify([]));
                  localStorage.setItem('spd_local_cash_books', JSON.stringify([]));
                  localStorage.setItem('spd_production_clean_v1', 'true');
                }
              } catch (cleanErr) {}
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
