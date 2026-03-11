import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import { SmoothScroll } from '@/components/smooth-scroll'
import { Toaster } from '@/components/ui/sonner'

import './globals.css'

const _geist = Geist({ subsets: ['latin'] })
const _geistMono = Geist_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Axerra | Enterprise Identity Automation Platform',
  description: 'Seamlessly automate identity lifecycle management with enterprise-grade SCIM integration. Secure, scalable identity automation for modern organizations.',
  generator: 'v0.app',
  icons: {
    icon: [
      { url: '/assets/favicons/favicon.ico' },
      { url: '/assets/favicons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/assets/favicons/favicon-32x32.png', sizes: '32x32', type: 'image/png' }
    ],
    apple: [
      { url: '/assets/favicons/apple-touch-icon.png' }
    ]
  },
  manifest: '/assets/favicons/site.webmanifest'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <SmoothScroll>
          {children}
        </SmoothScroll>
        <Toaster />
      </body>
    </html>
  )
}
