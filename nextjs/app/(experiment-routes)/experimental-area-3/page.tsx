'use client'
import { useContext } from "react";
import { AuthContext } from "@/app/_sharedComponents/AuthProvider";
import AuthenticatedNav from "@/app/_sharedComponents/AuthenticatedNav";
import NavWithLogin from "@/app/_sharedComponents/NavWithLogin";


export default function ExperimentalAreaThree() {
  const { isAuthenticated } = useContext(AuthContext);


  /** Different Nav will load, based on isAuthenticated 
   *  Other content is the same
  */
  return (
    <>
      {isAuthenticated ?
        <AuthenticatedNav />
      :
        <NavWithLogin />
      }  

      <main>
        <h2>{"This is experimental area Three"}</h2>
        <p>{"This text is always visible. Not just when you are logged in."}</p>
      </main>

    </>
  )
}
