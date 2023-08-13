import styles from "./experimental-area.module.css";

interface ChildrenProps {
  children: React.ReactNode
}


export default function ExperimentalLayout({ children }: ChildrenProps) {
  return (
    <html lang="en">
      <body className={styles.experimentalCssClass}>{children}</body>
    </html>
  )
}
