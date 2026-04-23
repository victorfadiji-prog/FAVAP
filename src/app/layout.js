import './globals.css';
import { Toaster } from 'react-hot-toast';
import ThemeInitializer from '@/components/ThemeInitializer';

export const metadata = {
  title: 'FAVAP — Connect, Share, Stream, Build',
  description: 'A unified social platform combining messaging, social feed, video streaming, and communities.',
  keywords: 'social media, messaging, video streaming, communities, chat',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body>
        <ThemeInitializer />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius)',
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
