import React from "react"
import type { Metadata, Viewport } from 'next'
import { DM_Sans, Playfair_Display } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { CartProvider } from '@/components/barbsy/cart-context'
import { WhatsAppButton } from '@/components/barbsy/whatsapp-button'
import { PageLoadingBar } from '@/components/barbsy/page-loading-bar'
import { AuthProvider } from '@/components/auth-provider'
import './globals.css'

const dmSans = DM_Sans({ 
  subsets: ["latin"],
  variable: '--font-dm-sans',
  weight: ['300', '400', '500', '600']
});

const playfairDisplay = Playfair_Display({ 
  subsets: ["latin"],
  variable: '--font-playfair',
  weight: ['400', '500', '600', '700']
});

export const metadata: Metadata = {
  title: 'Barbsy — Natural Skincare',
  description: 'Premium natural skincare and body care products. Glow gently with Barbsy.',
  generator: 'v0.app',
  keywords: ['skincare', 'natural', 'organic', 'beauty', 'body care', 'cruelty-free'],
  icons: {
    icon: '/icon.svg',
  },
}

export const viewport: Viewport = {
  themeColor: '#F7F4EF',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${playfairDisplay.variable} font-sans antialiased`}>
        <AuthProvider>
          <CartProvider>
            <PageLoadingBar />
            {children}
            <WhatsAppButton />
          </CartProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
