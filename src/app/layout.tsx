import type {
  Metadata,
} from 'next'

import './globals.css'

import {
  AuthProvider,
} from '@/components/layout/AuthProvider'

import PlatformNavigationGate from '@/components/platform/PlatformNavigationGate'

import PwaServiceWorker from '@/components/pwa/PwaServiceWorker'

import {
  siteConfig,
} from '@/lib/data/site'

export const metadata: Metadata = {
  title:
    siteConfig.title,

  description:
    siteConfig.description,

  keywords:
    siteConfig.keywords,

  metadataBase:
    new URL(
      siteConfig.url,
    ),

  manifest:
    '/manifest.webmanifest',

  icons: {
    icon:
      '/favicon-edudata-ia.png',

    apple:
      '/api/pwa/icon/192',
  },

  appleWebApp: {
    capable:
      true,

    title:
      'Agenda EDI',

    statusBarStyle:
      'black-translucent',
  },

  openGraph: {
    title:
      siteConfig.title,

    description:
      siteConfig.description,

    url:
      siteConfig.url,

    siteName:
      siteConfig.name,

    locale:
      'pt_BR',

    type:
      'website',
  },

  twitter: {
    card:
      'summary_large_image',

    title:
      siteConfig.title,

    description:
      siteConfig.description,
  },

  robots: {
    index:
      true,

    follow:
      true,
  },
}

export default function RootLayout({
  children,
}: {
  children:
    React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>
        <PwaServiceWorker />

        <AuthProvider>
          <PlatformNavigationGate />

          {children}
        </AuthProvider>
      </body>
    </html>
  )
}