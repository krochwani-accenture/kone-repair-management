import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Kone Repair Management',
  description: 'Excel upload for repair offerings and pricing management',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <meta name="emotion-insertion-point" content="emotion-insertion-point" />
      </head>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
