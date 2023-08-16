'use client'
import AuthProvider from "../../_sharedComponents/AuthProvider";

interface ChildrenProps {
  children: React.ReactNode
}


export default function WrapperLayout({ children }: ChildrenProps) {
  return (
    <div id="wrapper">

        {children}
    
    </div>
  )
}