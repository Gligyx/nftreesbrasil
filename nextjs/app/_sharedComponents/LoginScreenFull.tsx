'use client'
import React, { useContext } from 'react';
import { AuthContext } from './AuthProvider';
import { getLoginMessage, loginWithSignature, signMessage } from "../_lib/signature-tools-client";
import styles from "./LoginScreen.module.css";


export default function LoginScreen() {
  const { setIsAuthenticated } = useContext(AuthContext);
  
  async function login() {
    const message = await getLoginMessage();
    if (message === -1) {
      console.error("getLoginMessage returned an error!");
      return;
    }

    const signature = await signMessage(message);
    if (!signature) {
      console.error("There was an error while generating the signature");
      return;
    }
    const jwtResponse = await loginWithSignature(signature);
    if (typeof jwtResponse === 'number') {
      console.error("Error in loginWithSignature component! code: ", jwtResponse);
      return;
    }
    
    // Set JWT token in Local Storage
    localStorage.setItem('jwtToken', jwtResponse)
    setIsAuthenticated(true);
  }


  return (
    <main id={styles.loginScreen}>
      <button onClick={login} id="loginButton">Login with MetaMask</button>
    </main>
  )
}