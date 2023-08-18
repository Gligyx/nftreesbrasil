'use client'
import { useContext } from "react";
import { AuthContext } from "@/app/_sharedComponents/AuthProvider";
import LoginScreen from "@/app/_sharedComponents/LoginScreen";
import AuthenticatedNav from "@/app/_sharedComponents/AuthenticatedNav";
import styles from "./experimental-area-2.module.css";


export default function ExperimentalAreaTwo() {
  const { isAuthenticated } = useContext(AuthContext);

  // Same as experiment one
  return (
    <div className={styles.experimentalCssClass}>
      {isAuthenticated ? 
        <>
          <AuthenticatedNav />
          <main id={styles.main}>
            <p>This is the Second Experimental Area</p>
          </main>
        </>
      : 
        <LoginScreen />
      }
    </div>
  )
}