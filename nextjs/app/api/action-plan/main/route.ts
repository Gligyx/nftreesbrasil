export const dynamic = 'force-dynamic' 
import { NextRequest, NextResponse } from "next/server";
import fs from 'fs';
import conn from "@/app/_lib/db";
import { chainName, fgStorage } from "@/app/_lib/co2Conn";
import { createActionPlanId, createProjectId } from "@/app/_lib/idTools";
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

    const [projectObject, documentsArray, imagesArray] = await getData(writer, encoder, cacheFolder);           // Get data from front end (title, desc, possible documents and possible images)
    const dataCid = await createDataAsset(projectObject, documentsArray, imagesArray);                          // At this point, documents and images can be represented as CIDs (all data, including desc)
    const preparedAsset = await prepareAsset(projectObject, dataCid);                                           // Same as signableObject, but can be -2
    if (preparedAsset === -2) throw "Error while creating assetToHash"
    const signableObject: SignableActionPlan = preparedAsset;                                                   // You can already run JSON.stringify on this
    const actionPlanId: ActionPlanId = createActionPlanId(signableObject);
    
    // Ask user to sign
    writer.write(encoder.encode("data: " + JSON.stringify({
      sendSignature: true,
      actionPlanId: actionPlanId,
      message: createActionPlanSignatureMessage(signableObject),
    }) + "\n\n"));

    await waitForFile(cacheFolder, actionPlanId + ".done");

    const rawSignature = fs.readFileSync(`${cacheFolder}/${actionPlanId}.done`, { encoding: 'utf8', flag: 'r' });
    const signature = JSON.parse(rawSignature).signature;

    writer.write(encoder.encode("data: " + JSON.stringify({ signatureReceived: true, }) + "\n\n"));             // Signature Received Signal

    const asset: ActionPlan = {                                                                                 // Signed, ready asset
      ... signableObject,
      action_plan_id: actionPlanId,
      project_owner_signature: signature
    }

    console.log("Signed ActionPlan asset: ", asset)
    
    await createAsset(writer, encoder, asset, projectObject.address, documentsArray, imagesArray);    
    
  } catch (error) {
    console.error("There was an error while executing the main workflow (ActionPlan creation): ", error);

    writer.write(encoder.encode("data: " + JSON.stringify({
      done: true,
      message: JSON.stringify({
        error: error
      })
    }) + "\n\n"));

    writer.close();
  }
}


async function getData(writer: WritableStreamDefaultWriter<any>, encoder: TextEncoder, cacheFolder: string) {
  // Tell the front end to start sending files
  const documentName = `Document-${Date.now()}`;                                         // This has to be the name of the document
  const imageName = `Image-${Date.now()}`;                                               // This has to be the name of the image
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
      path: `${documentName}`,                                                           // Path is actually name
      content: fs.createReadStream(`${cacheFolder}/${documentName}`),                    // Document read stream
    })
  }
  if (projectObject.imageCount) {
    imagesArray.push({
      path: `${imageName}`,                                                              // Path is actually name
      content: fs.createReadStream(`${cacheFolder}/${imageName}`)                        // Image read stream
    })         
  }

  return [projectObject, documentsArray, imagesArray]
}

async function createDataAsset(projectObject: InitProjectObject, documentsArray: [], imagesArray: []) {
  try {
    const assetElements = [
      {
        name: "description",
        value: projectObject.description
      },{
        name: "documents",
        value: documentsArray
      },{
        name: "images",
        value: imagesArray
      }
    ];

    let addDataResponse = await fgStorage.addAsset(
      assetElements,
      {
        parent: null,
        name: `Data-${projectObject.projectId}-${projectObject.timestamp}`,
        description: "Data that will be linked to ActionPlan",
        template: "bafyreigupsaaglpj2pjlb7gndljgzuejssaooyqnrw5sl5mfzhckxmnhwa",
        filesUploadStart: () => {
          console.log("Upload started")
        },
        filesUploadEnd: () => {
            console.log("Upload finished")
        },
        createAssetStart: () => {
            console.log("Creating asset")
        },
        createAssetEnd: () => {
            console.log("Asset created")
        }
      },
      chainName,
      (status: any) => {
        console.log("Data upload status (CO2.Storage): ", status);
      }
    );

    if (addDataResponse.error) throw addDataResponse.error;

    console.log("Data asset creation response: ", addDataResponse.result);

    return addDataResponse.result.block;
    
  } catch (error) {
    console.error("There was an error while creating the data asset: ", error);
    return -5;
  }
}

async function prepareAsset(projectObject: InitProjectObject, dataCid: DataObjCid) {
  try {
    // Create ProjectId, if this is a new project (a project might be associated with multiple ActionPlans)
    const projectId: ProjectId = projectObject.projectId || createProjectId(projectObject);
    console.log("ProjectId: ", projectId);
  
    if (!conn) throw "Could not connect to database";
    const sameProjectQuery = `SELECT * FROM action_plans WHERE project_id = '${projectId}' AND project_owner = '${projectObject.address}'`;
    const queryResult = await conn.query(sameProjectQuery);
    let nonce = queryResult.rowCount;
    const getNonceQuery = `SELECT * FROM action_plans WHERE nonce = ${nonce-1}`;
    const getNonceResult = await conn.query(getNonceQuery);
    let ancestor = null;
    if (getNonceResult.rowCount) ancestor = getNonceResult.rows[0]["action_plan_id"];

    console.log("Nonce: ", nonce)
    console.log("Ancestor: ", ancestor)
    
    const assetToHash = {
      project_id: projectId,
      //action_plan_id: actionPlanId,                 // This field can't be part of hash, because this is the hash
      nonce: nonce,
      ancestor: ancestor,
      project_name: projectObject.title,
      data: dataCid,
      timestamp: Date.now(),
      project_owner_address: projectObject.address
    }
  
    return assetToHash;
    
  } catch (error) {
    console.error("There was an error while preparing asset (ActionPlan): ", error);
    return -2;
  }
}

async function createAsset(writer: WritableStreamDefaultWriter<any>, encoder: TextEncoder, asset: ActionPlan, projectOwner: EthAddress, documentsArray: [], imagesArray: []) {
  try {
    console.log('chainName: ', chainName)
    const iterableAsset = Object.keys(asset as ActionPlan).map((property) => {
      return {
        name: property,
        value: (asset as any)[property]
      }
    })
    console.log("The Asset: ", iterableAsset)

    let addAssetResponse = await fgStorage.addAsset(
      iterableAsset,
      {
        parent: null,
        name: asset.action_plan_id,
        description: "ActionPlan asset, that needs to be accepted by a Validator",
        template: "bafyreig6d4crklazqqso33z5vbnioedhregjlapvq5grwtsw6tdy75avpu",
        filesUploadStart: () => {
          writer.write(encoder.encode("data: " + JSON.stringify({ uploadStarted: true, }) + "\n\n"));             // Upload Started Signal
          console.log("Upload started");
        },
        filesUploadEnd: () => {
          writer.write(encoder.encode("data: " + JSON.stringify({ uploadFinished: true, }) + "\n\n"));            // Upload Finished Signal  
          console.log("Upload finished");
        },
        createAssetStart: () => {
          writer.write(encoder.encode("data: " + JSON.stringify({ assetCreationStarted: true, }) + "\n\n"));      // Asset Creation Started Signal
          console.log("Creating asset");
        },
        createAssetEnd: async () => {
          writer.write(encoder.encode("data: " + JSON.stringify({ assetCreationFinished: true, }) + "\n\n"));     // Asset Creation Ended Signal
          console.log("Asset created");

          // Update database
          if (!conn) throw "Could not connect to database.";
          const updateDatabase = `INSERT INTO action_plans (project_id, action_plan_id, project_owner, nonce) VALUES (
            '${asset.project_id}',
            '${asset.action_plan_id}',
            '${projectOwner}',
            ${asset.nonce}
          )`;
          const updateResult = await conn.query(updateDatabase);
          if (updateResult.rowCount !== 1) throw "Error saving new entry to database.";

          cleanUp(asset.action_plan_id, documentsArray, imagesArray);
          
          writer.write(encoder.encode("data: " + JSON.stringify({
            done: true,
            message: "This connection can be closed.",
            actionPlanId: asset.action_plan_id
          }) + "\n\n"));
          
          writer.close();
        }
      },
      chainName,
      (status: any) => {
        console.log("CO2.Storage status: ", status)
      }
    );

    if (addAssetResponse.error) throw "Error while uploading asset to CO2.Storage " + addAssetResponse.error
  console.log("Response from CO2.Storage: ", addAssetResponse.result);

    return addAssetResponse.result.block;

    
  } catch (error) {
    console.error("There was an error while creating assets on CO2.Storage: ", error);
    return -4;
  }
}

async function waitForFile(folderPath: string, fileName: string) {
  return new Promise<void>((resolve, reject) => {
    let counter = 0;
    const MAX = 86400;
    const filePath = `${folderPath}/${fileName}`;
    const interval = setInterval(() => {
      if (fs.existsSync(filePath)) {
        clearInterval(interval);
        console.log(`File ${fileName} found!`);
        resolve();
      } else {
        counter++;
        if (counter > MAX) {
          clearInterval(interval);
          reject("1 day passed and still no file");
        }
      }
    }, 1000); // Check every 1 second
  });
}

function cleanUp(actionPlanId: ActionPlanId, documetsArray: [], imagesArray: []) {
  try {
    fs.unlinkSync(`${process.env.CACHE_FOLDER}${actionPlanId}.done`);
    documetsArray.map((fileEntry: FileEntry) => {
      fs.unlinkSync(`${process.env.CACHE_FOLDER}${fileEntry.path}`);
      fs.unlinkSync(`${process.env.CACHE_FOLDER}${fileEntry.path}.done`);
    });
    imagesArray.map((fileEntry: FileEntry) => {
      fs.unlinkSync(`${process.env.CACHE_FOLDER}${fileEntry.path}`);
      fs.unlinkSync(`${process.env.CACHE_FOLDER}${fileEntry.path}.done`);
    });
  } catch (error) {
    console.error("There was an error while deleting temporary files: ", error);
  }
}