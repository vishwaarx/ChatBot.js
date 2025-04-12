import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'HR/IT FAQ Chatbot',
  description: 'A chatbot for HR and IT related questions',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
