import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NFTrees Brasil',
  description: 'App where you can purchase hypercerts to support reforestation projects.',
}

interface ChildrenProps {
  children: React.ReactNode
}


export default function RootLayout({ children }: ChildrenProps) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
