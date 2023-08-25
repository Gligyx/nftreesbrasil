import { projectConfig } from "@/config"
import { Id, toast } from "react-toastify";
import { signMessage } from "./signature-tools-client";


// This will also create an AcceptedActionPlan asset on CO2.Storage
export async function startHypercertCreation(toastId: ToastId, uploadObj: AcceptedActionPlanUploadObj) {
  // Start SSE connection (Server Sent Events)
  const eventSource = new EventSource(`${projectConfig.serverAddress}/api/accept-action-plan/main`);

  // Notify the user that the process has started
  toastId.current = toast.info("Accepting ActionPlan...", {
    autoClose: false,
    closeButton: false
  });

  // Handle all non-error messages
  eventSource.onmessage = async (event) => {
    const message = JSON.parse(event.data);
    console.log("The Message: ", message);

    // Server asked for data
    if (message.sendData) {
      uploadData({
        acceptedApName: message.acceptedApName,
        projectId: uploadObj.projectId,
        actionPlanId: uploadObj.actionPlanId,
        actionPlanCID: uploadObj.actionPlanCID,
        acceptedBy: uploadObj.acceptedBy,  // evaluator_address
        actionPlanSigner: uploadObj.actionPlanSigner,
        timestamp: uploadObj.timestamp,
      });

      toast.update(toastId.current as Id, {
        render: "Uploading data to server...",
        type: toast.TYPE.INFO,
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
        render: "Please sign the AcceptActionPlan asset!",
        type: toast.TYPE.INFO,
        autoClose: false
      });

      const signedMessage = await signMessage(message.message);

      if (!signedMessage) {
        toast.update(toastId.current as Id, {
          render: "Error when generating signature. Please try again!",
          type: toast.TYPE.ERROR,
          autoClose: 5000
        });
        eventSource.close();
        return;
      }
      
      sendSignature(signedMessage, message.acceptedId);
    }

    if (message.signatureReceived) {
      toast.update(toastId.current as Id, {
        render: "Signature received",
        type: toast.TYPE.INFO,
      });
    }

    if (message.status === "upload_started") {
      toast.update(toastId.current as Id, {
        render: "Uploading data to CO2.Storage...",
        type: toast.TYPE.INFO,
      });
    }

    if (message.uploadFinished) {
      toast.update(toastId.current as Id, {
        render: "Data was uploaded to CO2.Storage",
        type: toast.TYPE.INFO,
      });
    }

    if (message.assetCreationStarted) {
      toast.update(toastId.current as Id, {
        render: "Creating asset on CO2.Storage...",
        type: toast.TYPE.INFO,
      });
    }
    
    if (message.assetCreationFinished) {
      toast.update(toastId.current as Id, {
        render: "The asset was created on CO2.Storage",
        type: toast.TYPE.INFO,
      });
    }

    if (message.createHypercertStart) {
      toast.update(toastId.current as Id, {
        render: "Creating hypercert...",
        type: toast.TYPE.INFO,
      });
    }

    if (message.signatureError) {
      toast.update(toastId.current as Id, {
        render: "The signature of the ActionPlan is not valid!",
        type: toast.TYPE.ERROR,
      });
      eventSource.close();
    }

    if (message.hypercertExists) {
      toast.update(toastId.current as Id, {
        render: "Hypercert for this asset already exists!",
        type: toast.TYPE.INFO,
      });
      eventSource.close();
    }

    // Server said: close connection    
    if (message.done) {
      console.log('Closing connection...');
      toast.update(toastId.current as Id, {
        render: "Hypercert created! This project is now live!",
        type: toast.TYPE.SUCCESS,
        autoClose: 5000
      });
      eventSource.close();

      // Refresh
    }

    // Server sent error message
    if (message.error) {
      toast.update(toastId.current as Id, {
        render: "There was an error while accepting the Action Plan",
        type: toast.TYPE.ERROR,
      });
      console.error("There was an error while accepting the ActionPlan: ", message.error)
      eventSource.close();
    }
  }

  // Handle error messages
  eventSource.onerror = (error) => {
    console.error('SSE connection error:', error)

    toast.update(toastId.current as Id, {
      render: "An error occurred during SSE connection",
      type: toast.TYPE.ERROR
    });
    eventSource.close();
  }
}

async function uploadData(uploadObj: AcceptedActionPlanUploadObjReady) {
  console.log("Data upload is starting...");
  try {
    const url = `${projectConfig.serverAddress}/api/accept-action-plan/data-upload`;
  
    const formData = new FormData();
    formData.append('accepted-ap-name', uploadObj.acceptedApName);
    formData.append('project-id', uploadObj.projectId);
    formData.append('action-plan-id', uploadObj.actionPlanId);
    formData.append('action-plan-cid', uploadObj.actionPlanCID);
    formData.append('accepted-by', uploadObj.acceptedBy);
    formData.append('project-owner-address', uploadObj.actionPlanSigner);
    
    const response = await fetch(url, {
      method: 'POST',
      body: formData
    });

    // Will not wait for actual file upload, the API route will exit early
    if (response.ok) console.log("File upload started.");
    else throw "There was an error while uploading data"
    
  } catch (error) {
    console.error("There was an error while creating AcceptedActionPlan: ", error);
  }
}

async function sendSignature(signedMessage: string, acceptedApId: AcceptedActionPlanId) {
  try {
    const url = `${projectConfig.serverAddress}/api/accept-action-plan/send-signature`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        signature: signedMessage,
        acceptedActionPlanId: acceptedApId
      })
    });

    if (response.ok) console.log("Signature sent!");
    else throw "There was an error while sending signature";

  } catch (error) {
    console.error("There was an error while tring to send signed AcceptedActionPlan to server: ", error);
  }
}