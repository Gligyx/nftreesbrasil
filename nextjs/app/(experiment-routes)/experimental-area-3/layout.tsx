'use client'
import AuthProvider from "../../_sharedComponents/AuthProvider";
import styles from "./experimental-area-3.module.css";

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