import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Email Tracker | bits&bytes',
  description: 'Internal email tracking tool',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
