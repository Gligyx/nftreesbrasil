'use client'
import React, { useState } from 'react';
import { useContext } from "react";
import { AuthContext } from "@/app/_sharedComponents/AuthProvider";
import LoginScreen from "@/app/_sharedComponents/LoginScreen";
import "@/app/_styles/main.css";


export default function ProfilePage() {
  const { isAuthenticated } = useContext(AuthContext);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  
  async function fileUploadHandler() {
    console.log("fileUploadHandler...");
  }

  async function imageUploadHandler() {
    console.log("image upload handler");
  }

  async function submit() {

  }


  return (
    <>    
    {isAuthenticated?
      <div>
        Export as many components as possible, don't work here!

        <div>
          <p>{"Name of the Project: "}</p>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div>
          <p>{"Description: "}</p>
          <input value={description} onChange={((e) => setDescription(e.target.value))} />
        </div>

        <div>
          <p>{"Documents"}</p>
          <input type={'file'} onChange={fileUploadHandler} />
        </div>

        <div>
          <p>{"Images"}</p>
          <input type={'file'} onChange={imageUploadHandler} />
        </div>

        <button onClick={submit}>Submit</button>

      </div>
    :
      <LoginScreen />
    }
    </>
  )
}
