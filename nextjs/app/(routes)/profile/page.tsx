'use client'
import React from 'react';
import { useContext } from "react";
import { AuthContext } from "../../_sharedComponents/AuthProvider";
import LoginScreen from "../../_sharedComponents/LoginScreen";
import Profile from './Profile';
import "../../_styles/main.css";



export default function ProfilePage() {
  const { isAuthenticated, setIsAuthenticated } = useContext(AuthContext);

  
  return (
    <>    
    {isAuthenticated?
      <Profile />
    :
      <LoginScreen />
    }
    </>
  )
}
