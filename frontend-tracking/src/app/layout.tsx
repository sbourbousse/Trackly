import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Trackly - Suivi de livraison',
  description: 'Suivez votre livraison en temps réel',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  )
}
