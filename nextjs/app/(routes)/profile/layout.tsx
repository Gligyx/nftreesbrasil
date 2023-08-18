'use client'
import { useContext } from "react";
import { AuthContext } from "../../_sharedComponents/AuthProvider";
import AuthenticatedNav from "@/app/_sharedComponents/AuthenticatedNav";
import UnauthenticatedNav from "@/app/_sharedComponents/UnauthenticatedNav";

interface ChildrenProps {
  children: React.ReactNode
}


export default function LayoutWithAuthProvider({ children }: ChildrenProps) {
  const { isAuthenticated, setIsAuthenticated } = useContext(AuthContext);

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