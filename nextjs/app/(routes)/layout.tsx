'use client'
import AuthProvider from "../_sharedComponents/AuthProvider";

interface ChildrenProps {
  children: React.ReactNode
}

/**
 * This component provides AuthProvider, and it contains the <html> and <body> tags
 * The underlying layouts, inside the folders, are not rendering the <html> and <body> DOM elements,
 * and they will already have AuthProvider, so they can do conditional <nav> rendering.
 * page.tsx will do conditional content rendering (without the <nav>)
 */
export default function LayoutWithAuthProvider({ children }: ChildrenProps) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}