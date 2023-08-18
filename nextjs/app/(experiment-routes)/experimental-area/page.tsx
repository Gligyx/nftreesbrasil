'use client'
import { useContext } from "react";
import LoginScreen from "@/app/_sharedComponents/LoginScreen";
import { AuthContext } from "@/app/_sharedComponents/AuthProvider";
import AuthenticatedNav from "@/app/_sharedComponents/AuthenticatedNav";
import styles from "./experimental-area.module.css";


export default function ExperimentalAreaOne() {
  const { isAuthenticated, setIsAuthenticated } = useContext(AuthContext);
  
  // This component is either shows an authenticated main block and a nav, or a login screen
  return (
    <div className={styles.experimentalCssClass}>
      {isAuthenticated ? 
        <>
          <AuthenticatedNav />
          <main id={styles.main}>
            <p>This is the   Number One Experimental Area</p>
            <p>{"You are logged in"}</p>
          </main>
        </>
      : 
        <LoginScreen />
      }
    </div>
  )
}