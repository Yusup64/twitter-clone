import { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Twitter Clone',
  description: '一个功能丰富的 Twitter 克隆应用',
  applicationName: 'Twitter Clone',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Twitter Clone',
  },
  formatDetection: {
    telephone: false,
  },
  manifest: '/manifest.json',
  icons: {
    apple: '/icons/icon-192x192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#1DA1F2',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};
