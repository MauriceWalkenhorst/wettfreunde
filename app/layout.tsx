import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import './globals.css'

export const metadata: Metadata = {
  title: 'Wettfreunde',
  description: 'Wette mit deinen Freunden.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={GeistSans.variable}>
      <body className="min-h-screen bg-zinc-50 font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
