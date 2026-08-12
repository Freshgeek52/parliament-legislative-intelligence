import type { AppProps } from 'next/app';
import { Toaster } from 'react-hot-toast';
import { LanguageProvider } from '../lib/i18n';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <LanguageProvider>
      <Component {...pageProps} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#1e293b',
            color: '#fff',
            fontSize: '14px',
          },
        }}
      />
    </LanguageProvider>
  );
}
