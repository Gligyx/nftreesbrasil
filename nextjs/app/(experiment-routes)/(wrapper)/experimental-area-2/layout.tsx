'use client'
import AuthProvider from "@/app/_sharedComponents/AuthProvider";
import styles from "./experimental-area-2.module.css";

interface ChildrenProps {
  children: React.ReactNode
}


export default function LayoutWithAuthProvider({ children }: ChildrenProps) {
  return (
    <html lang="en">
      <body className={styles.experimentalCssClass}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}