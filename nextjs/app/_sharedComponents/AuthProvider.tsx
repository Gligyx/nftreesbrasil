'use client'
import { projectConfig } from '@/config';
import React, { createContext, useEffect, useState } from 'react';
import { getAddress } from '../_lib/user-tools';

interface ChildrenProps {
  children: React.ReactNode
}

export const AuthContext = createContext<{
  isAuthenticated: boolean,
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>
}>({ 
  isAuthenticated: false, 
  setIsAuthenticated: () => {} 
});


export default function AuthProvider({ children } : ChildrenProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');    
    if (token) {
      validateJWT(token);
    }
  }, []);
  
  async function validateJWT(token: jwtToken) {
    const url = `${projectConfig.serverAddress}/api/validate-jwt`;
    const address = await getAddress();
    if (address === -1) {
      console.error("Could not get the ethereum address of the user");
      return;
    }

    const rawResponse = await fetch(url, { 
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        token,
        address
      })
    });
    if (rawResponse.status === 200) {
      const response = await rawResponse.json();
      setIsAuthenticated(response);
    } else {
      console.error("Error during validation.");
      setIsAuthenticated(false);
    }
  }


  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}