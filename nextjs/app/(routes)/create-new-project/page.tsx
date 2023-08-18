'use client'
import React, { useEffect, useRef, useState } from 'react';
import { useContext } from "react";
import { AuthContext } from "@/app/_sharedComponents/AuthProvider";
import LoginScreen from "@/app/_sharedComponents/LoginScreen";
import { Id, toast } from 'react-toastify';
import "@/app/_styles/main.css";
import { projectConfig } from '@/config';


export default function ProfilePage() {
  const { isAuthenticated } = useContext(AuthContext);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
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

  }


async function startActionPlanCreation() {
  // Start SSE connection (Server Sent Events)
  const toastId = React.useRef<Id | null>(null);
  const eventSource = new EventSource(`${projectConfig.serverAddress}/api/create-action-plan`);

  
  toastId.current = toast("Creating new ActionPlan...", {
    autoClose: false,
    closeButton: false
  });
  

  // Handle all non-error messages
  eventSource.onmessage = (event) => {
    const message = JSON.parse(event.data);

    if (message.something === 'a') {
      console.log('a');
      // probably do transfer start, or something
      toast.update((toastId as unknown) as Id, {
        render: "Something happened",
        type: toast.TYPE.INFO,
        autoClose: false
      });
    }

    if (message.something === 'b') {
      console.log('b');
      toast.update((toastId as unknown) as Id, {
        render: "Something else happened",
        type: toast.TYPE.INFO,
      });
    }
  }

  // Handle error messages
  eventSource.onerror = (error) => {
    console.error('SSE connection error:', error)

    toast.update((toastId as unknown) as Id, {
      render: "An error occurred during SSE connection",
      type: toast.TYPE.ERROR
    })
  }
}

async function uploadData(title: string, description: string, documentsRef: Documents, imagesRef: Images) {
  try {
    const url = `${projectConfig.serverAddress}/api/create-action-plan`;
  
    // Add all the elements to a newly created form
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    if (documentsRef && documentsRef.current && documentsRef.current.files) 
      formData.append('documents', documentsRef.current.files[0]);
    if (imagesRef && imagesRef.current && imagesRef.current.files)
      formData.append('images', imagesRef.current.files[0]);
  
    const response = await fetch(url, {
      method: 'POST',
      body: formData
    });

    if (response.ok) console.log("File upload OK.");
    else throw "There was an error while uploading file"
    
  } catch (error) {
    console.error("There was an error while creating new ActionPlan: ", error);
  }
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
          <input type={'file'} onChange={fileUploadHandler} ref={documentsRef} />
        </div>

        <div>
          <p>{"Images"}</p>
          <input type={'file'} onChange={imageUploadHandler} ref={imagesRef} />
        </div>

        <button onClick={submit}>Submit</button>

      </div>
    :
      <LoginScreen />
    }
    </>
  )
}
