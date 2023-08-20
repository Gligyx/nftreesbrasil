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
    
    // This will keep running after the GET function returned
    executeActionPlanWorkflow(writer, encoder);
  
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
    console.error("There was an error initializing SSE: ", error);
    return NextResponse.json({
      error: error
    }, {
      status: 500
    })
  }
}

// This is the function where almost all of the things related to ActionPlan asset creation are happening
async function executeActionPlanWorkflow(writer: WritableStreamDefaultWriter<any>, encoder: TextEncoder) {
  try {
    if (!process.env.CACHE_FOLDER) throw "Cache folder is not specified!";
    const cacheFolder = process.env.CACHE_FOLDER;
    let closed = false;

    // Get data from front end (title, desc, possible documents and possible images)
    const [projectObject, documentsArray, imagesArray] = await getData(writer, encoder, cacheFolder);
    const assetToHash = await prepareAsset(projectObject, documentsArray, imagesArray);
    
    const signableObject: SignableActionPlan = await createSignableObject(assetToHash) as SignableActionPlan;
    console.log("Signable Object: ", signableObject)
    
    // Ask user to sign
    writer.write(encoder.encode("data: " + JSON.stringify({
      sendSignature: true,
      projectId: projectObject.projectId,
      message: createActionPlanSignatureMessage(signableObject),
    }) + "\n\n"));

    await waitForFile(cacheFolder, projectObject.projectId + ".done");

    const rawSignature = fs.readFileSync(`${cacheFolder}/${projectObject.projectId}.done`, { encoding: 'utf8', flag: 'r' });
    const signature = JSON.parse(rawSignature).signature;

    const asset: ActionPlan = {
      ... assetToHash,
      action_plan_id: createActionPlanId(signableObject),
      project_owner_signature: signature
    }

    console.log("Signed ActionPlan asset: ", asset)
    
    await createAsset(writer, encoder, asset);

    writer.close();
    //closed = true;
    //writer.write(encoder.encode("data: " + JSON.stringify({error: "Error message (200)"}) + "\n\n"));
    console.log("close")
    
  } catch (error) {
    console.error("There was an error while executing the main workflow (ActionPlan creation): ", error);
  }
}


async function getData(writer: WritableStreamDefaultWriter<any>, encoder: TextEncoder, cacheFolder: string) {
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

  return [projectObject, documentsArray, imagesArray]
}

async function prepareAsset(projectObject: InitProjectObject, documentsArray: [], imagesArray: []) {
  // Create ProjectId
  const projectId: ProjectId = createProjectId(projectObject);
  console.log("ProjectId: ", projectId);

  // Probably query database here
  // ask for previous elements
  let nonce = 0;
  let ancestor = null;
  // if we hashed everything, we could make the ProjectOwner sign that hash
  
  
  const assetToHash = {
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

  return assetToHash;
}

async function createAsset(writer: WritableStreamDefaultWriter<any>, encoder: TextEncoder, asset: ActionPlan) {
  let addAssetResponse = fgStorage.addAsset(
    asset,
    {},
    chainName,
    (status: any) => {
      console.dir(status, { depth: null })
    }
  );

  if (addAssetResponse.error) throw "Error while uploading asset to CO2.Storage " + addAssetResponse.error
  console.dir(addAssetResponse.result, { depth: null });

  // CO2.Storage Exit

  writer.write(encoder.encode("data: " + JSON.stringify({
    done: true,
    message: "This connection can be closed."
  }) + "\n\n"));
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