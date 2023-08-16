import Link from 'next/link';
import React, { useContext } from 'react';
import { AuthContext } from './AuthProvider';
import "../_styles/navigation.css";
import { getLoginMessage, loginWithSignature, signMessage } from '../_lib/signature-tools-client';


export default function NavWithLogin() {
  const { isAuthenticated, setIsAuthenticated } = useContext(AuthContext);

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
    <nav>
      <ul id="navUl">
        <Link href={'/experimental-area'}   className="navElement">First Experiment</Link>
        <Link href={'/experimental-area-2'} className="navElement">Second Experiment</Link>
        <Link href={'/experimental-area-3'} className="navElement">Third Experiment</Link>
        <Link href={'/profile'} className="navElement">Profile</Link>
        <button onClick={login} className="navElement">Login</button>
      </ul>
    </nav>
  )
}
