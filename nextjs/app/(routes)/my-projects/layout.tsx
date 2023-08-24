'use client'
import { useContext } from "react";
import { AuthContext } from "@/app/_sharedComponents/AuthProvider";
import AuthenticatedNav from "@/app/_sharedComponents/AuthenticatedNav";
import UnauthenticatedNav from "@/app/_sharedComponents/UnauthenticatedNav";

interface ChildrenProps {
  children: React.ReactNode
}


export default function ConditionalNavLayout({ children }: ChildrenProps) {
  const { isAuthenticated } = useContext(AuthContext);

  return (
    <>
    <header>
      {isAuthenticated? 
        <AuthenticatedNav />
      : 
        <UnauthenticatedNav />
      }
    </header>

    <main>
      {children}
    </main>
        
    </>
  )
}