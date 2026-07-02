import type { Metadata } from 'next'
import { siteConfig } from '@/lib/data/site'

export const metadata: Metadata = {
  title: siteConfig.title,

  description: siteConfig.description,

  keywords: siteConfig.keywords,

  metadataBase: new URL(siteConfig.url),

  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    locale: 'pt_BR',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: siteConfig.title,
    description: siteConfig.description,
  },

  robots: {
    index: true,
    follow: true,
  },
}