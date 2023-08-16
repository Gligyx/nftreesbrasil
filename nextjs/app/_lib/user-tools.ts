'use client'
import { projectConfig } from "@/config";
import { Signer } from "ethers";
import { ethers } from "ethers";

interface Window {
  ethereum?: any;
}


export async function registerUser(address: EthAddress) {
  // wont abstract this code here
}

export async function getAddress() {
  try {
    // Get the address of the user from MetaMask
    const win: Window & typeof globalThis = window;
    const accounts = await win.ethereum.request({ method: 'eth_requestAccounts'});
    const signer: Signer = await new ethers.BrowserProvider(win.ethereum).getSigner();
    const address = await signer.getAddress();
    return address;
  } catch (error) {
    console.error("There was an error while trying to get the address for the current user: ", error);
    return -1;
  }
}

export async function fetchUserObject(address: EthAddress) {
  try {
    const url = `${projectConfig.serverAddress}/api/get-user-object?address=${encodeURIComponent(address)}`;
    const result = await fetch(url, { method: 'GET'});
    const jsonResult = await result.json();

    return jsonResult;
    
  } catch (error) {
    console.error("There was an error while trying to fetch the user object from the server: ", error);
    return -1;
  }
}

export async function setNewUsername(address: EthAddress, username: Username, jwtToken: jwtToken) {
  try {
    const url = `${projectConfig.serverAddress}/api/update-username`;
    const result = await fetch(url, { 
      method: 'POST', 
      body: JSON.stringify({ 
        address: address,
        new_username: username,
        jwt_token: jwtToken
      })
    });
    const jsonResult = await result.json();

    if (jsonResult.success) return true;
    else return false;
    
  } catch (error) {
    console.error("There was an error while changing username: ", error);
    return false;
  }
}

export async function deleteUserFromDatabase(address: EthAddress, jwtToken: jwtToken) {
  try {
    const url = `${projectConfig.serverAddress}/api/delete-user`;
    const result = await fetch(url, {
      method: 'DELETE',
      body: JSON.stringify({
        address: address,
        jwt_token: jwtToken
      })
    });
    const jsonResult = await result.json();

    if (jsonResult.success) return true;
    else return false;

  } catch (error) {
    console.error("There was an error while deleting the user from the database: ", error);
    return false;
  }
}