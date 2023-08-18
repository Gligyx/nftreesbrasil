import { projectConfig } from "@/config"
import React from "react";
import { Id, toast } from "react-toastify";

// move function here
export async function startActionPlanCreation(toastId: React.MutableRefObject<Id | null>) {
  // Start SSE connection (Server Sent Events)
  const eventSource = new EventSource(`${projectConfig.serverAddress}/api/create-action-plan`);

  
  toastId.current = toast("Creating new ActionPlan...", {
    autoClose: false,
    closeButton: false
  });
  

  // Handle all non-error messages
  eventSource.onmessage = (event) => {
    const message = JSON.parse(event.data);
    console.log("The Message: ", message);

    // Server said 32
    if (message.fieldA === "32") {
      console.log('a');
      // probably do transfer start, or something
      toast.update(toastId.current as Id, {
        render: "Something happened",
        type: toast.TYPE.INFO,
        autoClose: false
      });

      eventSource.close()
    }


    // Server said b    
    if (message.something === 'b') {
      console.log('b');
      toast.update(toastId.current as Id, {
        render: "Something else happened",
        type: toast.TYPE.INFO,
      });
    }
  }

  // Handle error messages
  eventSource.onerror = (error) => {
    console.error('SSE connection error:', error)

    toast.update(toastId.current as Id, {
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