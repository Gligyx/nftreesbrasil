'use client'
import AuthProvider from "../../_sharedComponents/AuthProvider";

interface ChildrenProps {
  children: React.ReactNode
}


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