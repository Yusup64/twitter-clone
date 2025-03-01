import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Twitter Clone',
    short_name: 'Twitter',
    description: 'A feature-rich Twitter clone application',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1DA1F2',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/favicon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
        purpose: 'maskable',
      },

      {
        src: '/icons/web-app-manifest-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/web-app-manifest-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
