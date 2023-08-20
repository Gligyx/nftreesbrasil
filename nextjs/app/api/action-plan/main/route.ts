export const dynamic = 'force-dynamic' 
import { NextRequest, NextResponse } from "next/server";
import { FGStorage } from '@co2-storage/js-api';
import fs from 'fs';
import path from 'path';
import conn from "@/app/_lib/db";
const { createHash } = require('crypto');
import { chainName, fgStorage } from "@/app/_lib/co2Conn";
import { createActionPlanId, createProjectId } from "@/app/_lib/actionPlanTools";
import { createSignableObject } from "@/app/_lib/signature-tools-server";
import { createActionPlanSignatureMessage } from "@/app/_lib/signatureMessages";


export async function GET(request: NextRequest) {
  try {
    // Initialize SSE (Server Sent Events)
    let responseStream = new TransformStream();
    const writer = responseStream.writable.getWriter();
    const encoder = new TextEncoder();
    const cacheFolder = "./cache";
    let closed = false;
    
    
    // Will copy-paste elements here to the actual workflow
    const everything = async () => {
      
      // Tell the front end to start sending files
      const documentName = `Document-${Date.now()}`;                            // This has to be the name of the document
      const imageName = `Image-${Date.now()}`;                                  // This has to be the name of the image
      writer.write(encoder.encode("data: " + JSON.stringify({
        startFileUpload: true,
        documentName,
        imageName
      }) + "\n\n"));
      
    
      await waitForFile(cacheFolder, documentName + ".done");
      await waitForFile(cacheFolder, imageName + ".done");
  
      // Get the metadata file. It's in the file that signals that the file upload is done (or that there were no files attached)
      const rawText = fs.readFileSync(`${cacheFolder}/${documentName}.done`, { encoding: 'utf8', flag: 'r' });
      const projectObject = JSON.parse(rawText);
  
      writer.write(encoder.encode("data: " + JSON.stringify({
        status: "preparing_asset",
      }) + "\n\n"));
  
      let documentsArray = [];
      let imagesArray = [];
      if (projectObject.documentCount) {                                                     // When we would upgrade to multiple images and documents, here we would need a loop
        documentsArray.push({
          name: `${documentName}`,
          content: fs.createReadStream(`${cacheFolder}/${documentName}`)                     // Document read stream
        })
      }
      if (projectObject.imageCount) {
        imagesArray.push({
          name: `${imageName}`,
          content: fs.createReadStream(`${cacheFolder}/${imageName}`)                        // Image read stream
        })         
      }
  
      // Create ProjectId
      const projectId: ProjectId = createProjectId(projectObject);
      console.log("ProjectId: ", projectId);
  
      // Probably query database here
      // ask for previous elements
      let nonce = 0;
      let ancestor = null;
      // if we hashed everything, we could make the ProjectOwner sign that hash
      // problem though: you can't hash this object, because it contains reference to images. It won't work.
      
      // Create signable hash
      
      const preparedObjectForSigning = {
        project_id: projectId,
        //action_plan_id: actionPlanId,                 // This field can't be part of hash, because this is the hash
        nonce: nonce,
        ancestor: ancestor,
        project_name: projectObject.title,
        description: projectObject.description,
        documents: documentsArray,
        images: imagesArray,
        timestamp: Date.now(),
      }
      
      const signableObject: SignableActionPlan = await createSignableObject(preparedObjectForSigning) as SignableActionPlan;
      console.log("Signable Object: ", signableObject)
      
      // Ask user to sign
      writer.write(encoder.encode("data: " + JSON.stringify({
        sendSignature: true,
        projectId: projectId,
        message: createActionPlanSignatureMessage(signableObject),
      }) + "\n\n"));

      await waitForFile(cacheFolder, projectId + ".done");

      const rawSignature = fs.readFileSync(`${cacheFolder}/${projectId}.done`, { encoding: 'utf8', flag: 'r' });
      const signature = JSON.parse(rawSignature).signature;
  
      const asset = {
        project_id: projectId,
        action_plan_id: createActionPlanId(signableObject),
        nonce: nonce,
        ancestor: ancestor,
        project_name: projectObject.title,
        description: projectObject.description,
        documents: documentsArray,
        images: imagesArray,
        timestamp: Date.now(),  
        project_owner_signature: signature
      }

      console.log("Signed ActionPlan asset: ", asset)
      
      let addAssetResponse = fgStorage.addAsset(
        asset,
        {},
        chainName,
        (status: any) => {
          console.dir(status, { depth: null })
        }
      );
  
      if (addAssetResponse.error != null) {
        console.error(addAssetResponse.error);
        await new Promise(reject => setTimeout(reject, 300));
        // exit
      }
  
      console.dir(addAssetResponse.result, { depth: null });
  
      await new Promise(resolve => setTimeout(resolve, 1000));
  
      // CO2.Storage Exit
  
  
      writer.write(encoder.encode("data: " + JSON.stringify({
        done: true,
        message: "This connection can be closed."
      }) + "\n\n"));
      writer.write(encoder.encode("data: " + JSON.stringify({fieldA: "32", fieldB: "42"}) + "\n\n"));
  
  
      //writer.write(encoder.encode("data: " + JSON.stringify({error: "Error message (200)"}) + "\n\n"));
      writer.close();
      closed = true;
      console.log("close")
    }
    everything();
  
  
  
  
    return new Response(responseStream.readable, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "text/event-stream; charset=utf-8",
        "Connection": "keep-alive",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
        "Content-Encoding": "none",
      },
    });
    
  } catch (error) {
    console.error("There was an error while creating ActionPlan (/action-plan/main) ", error);
    return NextResponse.json({
      error: error
    }, {
      status: 500
    })
  }
}


async function waitForFile(folderPath: string, fileName: string) {
  return new Promise<void>((resolve) => {
    const filePath = `${folderPath}/${fileName}`;
    const interval = setInterval(() => {
      if (fs.existsSync(filePath)) {
        clearInterval(interval);
        console.log(`File ${fileName} found!`);
        resolve();
      } else {
        console.log(`File ${fileName} not found yet. Waiting...`);
      }
    }, 1000); // Check every 1 second
  });
}