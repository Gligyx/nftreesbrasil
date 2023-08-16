import Link from 'next/link';
import React, { useContext } from 'react';
import { AuthContext } from './AuthProvider';
import "../_styles/navigation.css";


export default function AuthenticatedNav() {
  const { isAuthenticated, setIsAuthenticated } = useContext(AuthContext);

  function logout() {
    localStorage.removeItem('jwtToken');
    setIsAuthenticated(false);
  }


  return (
    <nav>
      <ul id="navUl">
        <Link href={'/experimental-area'}   className="navElement">First Experiment</Link>
        <Link href={'/experimental-area-2'} className="navElement">Second Experiment</Link>
        <Link href={'/experimental-area-3'} className="navElement">Third Experiment</Link>
        <Link href={'/profile'} className="navElement">Profile</Link>
        <button onClick={logout} className="navElement">Log Out</button>
      </ul>
    </nav>
  )
}
