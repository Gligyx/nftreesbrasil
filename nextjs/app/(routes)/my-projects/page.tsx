'use client'
import React, { useContext } from 'react';
import { AuthContext } from "@/app/_sharedComponents/AuthProvider";
import LoginScreen from '@/app/_sharedComponents/LoginScreen';
import "@/app/_styles/main.css";


export default function MyProjectsPage() {
  const { isAuthenticated } = useContext(AuthContext);


  return (
    <>
      {isAuthenticated? 
        <div>
          My Projects
        </div>
      :
        <LoginScreen />
      }
    </>
  )
}
