import type { MetadataRoute } from 'next';

/** Manifesto do PWA instalável (docs/adr/0002). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Margem',
    short_name: 'Margem',
    description: 'Licitações de alimentos e custo de compra, com o número que importa.',
    start_url: '/painel',
    display: 'standalone',
    background_color: '#F7F8FA',
    theme_color: '#0B1220',
    lang: 'pt-BR',
    icons: [
      { src: '/icones/icone-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icones/icone-512.png', sizes: '512x512', type: 'image/png' },
      {
        src: '/icones/icone-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
