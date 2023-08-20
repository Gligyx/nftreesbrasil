export const dynamic = 'force-dynamic' 
import { NextRequest, NextResponse } from "next/server";
import { FGStorage } from '@co2-storage/js-api';
import fs from 'fs';
import path from 'path';
import conn from "@/app/_lib/db";
const { createHash } = require('crypto');
import { chainName, fgStorage } from "@/app/_lib/co2Conn";
import { createProjectId } from "@/app/_lib/actionPlanTools";


export async function GET(request: NextRequest) {
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
    console.log("Metadata: ", projectObject);
    console.log("Document file: ", documentName);
    console.log("Image file: ", imageName);

    const filehash = await calculateFileHash(`${process.env.CACHE_FOLDER}${documentName}`);
    console.log("File hash: ", filehash)

    let documentsArray = [];
    let imagesArray = [];
    if (projectObject.documentCount) {                                                     // When we would upgrade to multiple images and documents, here we would need a loop
      documentsArray.push({
        path: `/${documentName}`,
        content: fs.createReadStream(`${cacheFolder}/${documentName}`)                     // Document read stream
      })
    }
    if (projectObject.documentCount) {
      imagesArray.push({
        path: `/${imageName}`,
        content: fs.createReadStream(`${cacheFolder}/${imageName}`)                        // Image read stream
      })         
    }

    // Create ProjectId
    const projectId: ProjectId = createProjectId(projectObject);
    console.log("ProjectId: ", `Project-${projectId}`);

    // Probably query database here
    // ask for previous elements
    let nonce = 0;
    let ancestor = null;
    const actionPlanId = "HASH EVERYTHING!!"
    // if we hashed everything, we could make the ProjectOwner sign that hash
    // problem though: you can't hash this object, because it contains reference to images. It won't work.

    // Create signable hash


    const asset = {
      project_id: projectId,
      action_plan_id: actionPlanId,
      nonce: nonce,
      ancestor: ancestor,
      project_name: projectObject.title,
      description: projectObject.description,
      documents: documentsArray,
      images: imagesArray,
      timestamp: Date.now(),  
      project_owner_signature: "SIG"
    }

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


async function calculateFileHash(filePath: string) {
  try { console.log("filePath: ", filePath)
    const hash = createHash('sha256');
    const stream = fs.createReadStream(filePath);
  
    return new Promise((resolve, reject) => {
      stream.on('data', (data) => {
        hash.update(data);
      });
  
      stream.on('end', () => {
        const fileHash = hash.digest('hex');
        resolve(fileHash);
      });
  
      stream.on('error', (error) => {
        reject(error);
      });
    });
  } catch (error) {
    console.error("Error hashing file: ", error);
  }
}