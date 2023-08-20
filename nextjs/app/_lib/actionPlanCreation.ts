import { projectConfig } from "@/config"
import React from "react";
import { Id, toast } from "react-toastify";
import { getAddress } from "./user-tools";
import { signMessage } from "./signature-tools-client";

// move function here
export async function startActionPlanCreation(toastId: ToastId, uploadObj: ActionPlanUploadObj) {
  // Start SSE connection (Server Sent Events)
  const eventSource = new EventSource(`${projectConfig.serverAddress}/api/action-plan/main`);

  // Notify the user that the process has started
  toastId.current = toast.info("Creating new ActionPlan...", {
    autoClose: false,
    closeButton: false
  });
  
  // Handle all non-error messages
  eventSource.onmessage = async (event) => {
    const message = JSON.parse(event.data);
    console.log("The Message: ", message);
    

    // Server asked for data (name, desc, and optional files)
    if (message.startFileUpload) {
      uploadData({
        title: uploadObj.title,
        description: uploadObj.description,
        documentsRef: uploadObj.documentsRef,
        imagesRef: uploadObj.imagesRef,
        documentName: message.documentName,
        imageName: message.imageName,
        projectOwner: uploadObj.projectOwner as EthAddress
      });

      toast.update(toastId.current as Id, {
        render: "Uploading data...",
        type: toast.TYPE.INFO,
        autoClose: false
      });
    }

    if (message.status === "preparing_asset") {
      toast.update(toastId.current as Id, {
        render: "Preparing asset...",
        type: toast.TYPE.INFO,
        autoClose: false
      });
    }

    if (message.sendSignature) {
      toast.update(toastId.current as Id, {
        render: "Please sign the ActionPlan asset!",
        type: toast.TYPE.INFO,
        autoClose: false
      });

      const signedMessage = await signMessage(message.message);

      if (!signedMessage) {
        toast.update(toastId.current as Id, {
          render: "Error when generating signature. Please try again!",
          type: toast.TYPE.ERROR,
          autoClose: 5000
        })
        return;
      }
      
      sendSignature(signedMessage, message.projectId);
    }
    
    
    // Server said: close connection    
    if (message.done) {
      console.log('Closing connection...');
      toast.update(toastId.current as Id, {
        render: "Done.",
        type: toast.TYPE.INFO,
      });
      eventSource.close();
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


async function uploadData(uploadObj: ActionPlanUploadObjReady) {
  console.log("Data upload is starting...");
  try {
    const url = `${projectConfig.serverAddress}/api/action-plan/data-upload`;
  
    // These elements will be always added
    const formData = new FormData();
    formData.append('title', uploadObj.title);
    formData.append('description', uploadObj.description);
    formData.append('owner', uploadObj.projectOwner);
    
    // documentName is a placeholder, in case there is no document, so the signaling process can go on
    if (uploadObj.documentsRef?.current?.files?.length === 0) formData.append('documentName', uploadObj.documentName);    // If no file, upload placeholder name
    else if (uploadObj.documentsRef && uploadObj.documentsRef.current && uploadObj.documentsRef.current.files)
      formData.append('documents', uploadObj.documentsRef.current.files[0], uploadObj.documentName);                      // else upload file
    
    // imageName is a placeholder, in case there is no document, so the signaling process can go on
    if (uploadObj.imagesRef?.current?.files?.length === 0) formData.append('imageName', uploadObj.imageName);             // If no file, upload placeholder name
    else if (uploadObj.imagesRef && uploadObj.imagesRef.current && uploadObj.imagesRef.current.files)
      formData.append('images', uploadObj.imagesRef.current.files[0], uploadObj.imageName);                               // else upload file
    
    const response = await fetch(url, {
      method: 'POST',
      body: formData
    });

    // Will not wait for actual file upload, the API route will exit early
    if (response.ok) console.log("File upload started.");
    else throw "There was an error while uploading data"
    
  } catch (error) {
    console.error("There was an error while creating new ActionPlan: ", error);
  }
}

async function sendSignature(signedMessage: string, projectId: ProjectId) {
  try {
    const url = `${projectConfig.serverAddress}/api/action-plan/send-signature`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        signature: signedMessage,
        projectId: projectId
      })
    });

    if (response.ok) console.log("Signature sent!");
    else throw "There was an error while sending signature";

  } catch (error) {
    console.error("There was an error while tring to send signed ActionPlan to server: ", error);
  }
}