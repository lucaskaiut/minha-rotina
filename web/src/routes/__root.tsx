import { useEffect } from 'react'
import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { AuthProvider } from '#/contexts/AuthContext'
import { PushProvider } from '#/contexts/PushContext'
import { ensureServiceWorkerRegistration } from '#/services/pwa'
import { appleSplashLinks } from '#/pwa/splash'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      {
        name: 'viewport',
        content:
          'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
      },
      {
        title: 'Minha Rotina — Gestão e Autonomia Familiar',
      },
      {
        name: 'description',
        content:
          'Plataforma onde mães organizam e acompanham a rotina diária das filhas com autonomia, disciplina e motivação.',
      },
      { name: 'theme-color', content: '#5B5CE2' },
      { name: 'mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
      { name: 'apple-mobile-web-app-title', content: 'Minha Rotina' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'manifest', href: '/manifest.webmanifest' },
      { rel: 'icon', type: 'image/png', href: '/icon.png' },
      { rel: 'shortcut icon', href: '/favicon.ico' },
      {
        rel: 'apple-touch-icon',
        sizes: '152x152',
        href: '/apple-touch-icon-152x152.png',
      },
      {
        rel: 'apple-touch-icon',
        sizes: '167x167',
        href: '/apple-touch-icon-167x167.png',
      },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/apple-touch-icon-180x180.png',
      },
      ...appleSplashLinks(),
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&display=swap',
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void ensureServiceWorkerRegistration()
  }, [])

  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body className="bg-[#F8FAFC] text-[#111827] antialiased selection:bg-[#EEF0FF] selection:text-[#4A4BCF]">
        <AuthProvider>
          <PushProvider>{children}</PushProvider>
        </AuthProvider>
        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
