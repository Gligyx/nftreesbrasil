'use client'
import React from 'react';
import { useContext } from "react";
import { AuthContext } from "@/app/_sharedComponents/AuthProvider";
import LoginScreen from "@/app/_sharedComponents/LoginScreen";
import "@/app/_styles/main.css";



export default function ProfilePage() {
  const { isAuthenticated } = useContext(AuthContext);

  
  return (
    <>    
    {isAuthenticated?
      <p>belépett felhasználó</p>
    :
      <LoginScreen />
    }
    </>
  )
}
