import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'
import { VitePWA } from 'vite-plugin-pwa'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    nitro(),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    VitePWA({
      registerType: 'autoUpdate',
      includeManifestIcons: false,
      manifest: {
        id: '/',
        name: 'Minha Rotina',
        short_name: 'Minha Rotina',
        description:
          'Organize e acompanhe a rotina diária da família com autonomia e motivação.',
        lang: 'pt-BR',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        theme_color: '#5B5CE2',
        background_color: '#F8FAFC',
        categories: ['productivity', 'lifestyle'],
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globDirectory: process.env.VERCEL
          ? '.vercel/output/static'
          : '.output/public',
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,woff,woff2,jpg,jpeg,webp}',
        ],
        globIgnores: ['**/push-sw.js', '**/splash/**'],
        importScripts: ['push-sw.js'],
        navigateFallback: '/',
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        enabled: true,
        suppressWarnings: true,
      },
    }),
  ],
})

export default config
