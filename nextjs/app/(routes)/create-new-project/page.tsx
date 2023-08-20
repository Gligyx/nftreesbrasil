'use client'
import React, { useEffect, useRef, useState } from 'react';
import { useContext } from "react";
import { AuthContext } from "@/app/_sharedComponents/AuthProvider";
import LoginScreen from "@/app/_sharedComponents/LoginScreen";
import { startActionPlanCreation } from '@/app/_lib/actionPlanCreation';
import { Id, toast } from 'react-toastify';
import "@/app/_styles/main.css";
import { getAddress } from '@/app/_lib/user-tools';


export default function ProfilePage() {
  const { isAuthenticated } = useContext(AuthContext);
  const toastId = React.useRef<Id | null>(null);
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const documentsRef = useRef(null);
  const imagesRef = useRef(null);

  async function fileUploadHandler() {
    console.log("fileUploadHandler...");
  }

  async function imageUploadHandler() {
    console.log("image upload handler");
  }

  async function submit() {
    if (title.length === 0) {
      console.error("No title is specified!");
      return;
    }
    if (description.length === 0) {
      console.error("No description is specified!");
      return;
    }

    const address = await getAddress();
    if (address === -1) toast.error("Could not connect to MetaMask!");
    let projectId = "Project-da4402c101f5";

    startActionPlanCreation(toastId, {
      projectId: projectId || null,
      title,
      description,
      documentsRef,
      imagesRef,
      projectOwner: address as EthAddress
    });
  }



  return (
    <>    
    {isAuthenticated?
      <div>

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
          <input type={'file'} onChange={fileUploadHandler} ref={documentsRef} />
        </div>

        <div>
          <p>{"Images"}</p>
          <input type={'file'} onChange={imageUploadHandler} ref={imagesRef} />
        </div>

        <button onClick={() => submit()}>Submit</button>

      </div>
    :
      <LoginScreen />
    }
    </>
  )
}
