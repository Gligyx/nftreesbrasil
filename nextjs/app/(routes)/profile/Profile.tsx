import React, { useContext, useEffect, useState } from 'react';
import { deleteUserFromDatabase, fetchUserObject, getAddress, setNewUsername } from '../../_lib/user-tools';
import "../../_styles/buttons.css";
import styles from "./Profile.module.css";
import { AuthContext } from '@/app/_sharedComponents/AuthProvider';


export default function Profile() {
  const { setIsAuthenticated } = useContext(AuthContext);
  const [address, setAddress] = useState("");
  const [username, setUsername] = useState<string | undefined>(undefined);
  const [role, setRole] = useState("");

  useEffect(() => {
    loadData();
  }, []);
  
  async function loadData() {
    const theAddress = await getAddress();
    if (theAddress === -1) {
      console.error("There was an error while fetching address. Probably MetaMask is not installed.");
      return;
    }

    const userObj = await fetchUserObject(theAddress);
    if (userObj === -1) {
      console.error("Error fetching user object (Profile)");
      return;
    }
    
    if (userObj.username) setUsername(userObj.username);
    setRole(userObj.role);
    setAddress(theAddress);
  }

  async function changeUsername() {
    if (!username) return;
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      console.error("Could not get JWT token");
      return;
    }
    const updateResult = await setNewUsername(address, username, token);
    if (updateResult) console.log("Success");
    else console.error("Could not set new username");
  }

  async function deleteUser() {
    if (!address) return;
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      console.error("Could not get JWT token");
      return;
    }
    const deleteResult = await deleteUserFromDatabase(address, token);
    if (deleteResult) {
      localStorage.removeItem('jwtToken');
      setIsAuthenticated(false);
    } else {
      console.error("Could not delete user.");
    }
  }


  return (
    <div>
      <h1>{"Profile"}</h1>
      <p>{"Your Ethereum address is: "}{address}</p>
      <p>{"Your username is: "}
        <input value={username} placeholder={"not-set"} onChange={(e) => setUsername(e.target.value)}></input>
        <button onClick={changeUsername} className="generalButton">SET</button>
      </p>
      <p>{"Your role: "}{role}</p>
      
      <button onClick={deleteUser} className="dangerButton">Delete Profile</button>
      <label>{"This will delete your data from the server, data that is saved on the blockchain will not be deleted."}</label>
    </div>
  )
}
