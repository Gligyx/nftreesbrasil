export const dynamic = 'force-dynamic' 
import { NextRequest, NextResponse } from "next/server";
import fs from 'fs';
import { chainName, fgStorage } from "@/app/_lib/co2Conn";
import { createCommentId } from "@/app/_lib/idTools";
import { createCommentSignatureMessage } from "@/app/_lib/signatureMessages";
import { projectConfig } from "@/config";


export async function GET(request: NextRequest) {
  try {
    // Initialize SSE (Server Sent Events)
    let responseStream = new TransformStream();
    const writer = responseStream.writable.getWriter();
    const encoder = new TextEncoder();
    
    // This will keep running after the GET function returned
    executeCommentWorkflow(writer, encoder);
  
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

async function executeCommentWorkflow(writer: WritableStreamDefaultWriter<any>, encoder: TextEncoder) {
  try {
    if (!process.env.CACHE_FOLDER) throw "Cache folder is not specified!";
    const cacheFolder = process.env.CACHE_FOLDER;

    const uploadResult = await getData(writer, encoder, cacheFolder);                    // Get data from front end (mainly the comment)
    if (uploadResult === -1) throw "There was an error in data upload";
    const commentObject: CommentUploadObjReady = uploadResult;

    const validationUrl = `${projectConfig.serverAddress}/api/co2/validate-signed-asset?signer=${commentObject.actionPlanSigner}&assetId=${commentObject.actionPlanId}`;
    const signatureValid = (await (await fetch(validationUrl)).json()).signatureValid;
    if (!signatureValid) {
      writer.write(encoder.encode("data: " + JSON.stringify({ signatureError: true}) + "\n\n"));
      throw "The signature for the ActionPlan is not valid!";
    }
  
    const preparedAsset = await prepareAsset(commentObject);
    if (preparedAsset === -2) throw "Error while creating assetToHash";

    const signableObject: SignableComment = preparedAsset;
    const commentId: CommentId = createCommentId(signableObject);

    writer.write(encoder.encode("data: " + JSON.stringify({                               // Ask user to sign
      sendSignature: true,
      commentId: commentId,
      message: createCommentSignatureMessage(signableObject),
    }) + "\n\n"));

    await waitForFile(cacheFolder, commentId + ".done");

    const rawSignature = fs.readFileSync(`${cacheFolder}/${commentId}.done`, { encoding: 'utf8', flag: 'r' });
    const signature = JSON.parse(rawSignature).signature;
    writer.write(encoder.encode("data: " + JSON.stringify({ signatureReceived: true, }) + "\n\n"));                 // Signature Received Signal

    const asset: CommentOnActionPlan = {
      ...signableObject,
      comment_id: commentId,
      evaluator_signature: signature
    }

    console.log("Signed Comment asset: ", asset);

    await createAsset(writer, encoder, asset, commentObject.commentName)

  } catch (error) {
    console.error("There was an error while executing the main workflow (Comment creation): ", error);

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
  try {
    // Tell the front end to start sending files
    const commentName = `Comment-${Date.now()}`;                                          // This will be the name of the temporary file

    writer.write(encoder.encode("data: " + JSON.stringify({
      sendData: true,
      commentName
    }) + "\n\n"));

    await waitForFile(cacheFolder, commentName + ".done");

    // Get the metadata file. 
    const rawText = fs.readFileSync(`${cacheFolder}/${commentName}.done`, { encoding: 'utf8', flag: 'r' });
    const commentObject = JSON.parse(rawText);

    writer.write(encoder.encode("data: " + JSON.stringify({
      status: "preparing_asset",
    }) + "\n\n"));

    return commentObject;

  } catch (error) {
    console.error("There as an error while getting data from the front end: ", error);
    return -1;
  }
}

async function prepareAsset(commentObject: CommentUploadObj) {
  try {
    // This is very simple, but later, if we would process images and documents as well, it would be more complicated
    // Also, we decided that the comments won't be stored in database (SQL), because it is realtively easy to fetch them from CO2.Storage,
    // and this is not something that a Buyer would interact with (less important to cache)

    const assetToHash = {
      project_id: commentObject.projectId,
      action_plan_id: commentObject.actionPlanId,
      action_plan_cid: commentObject.actionPlanCID,
      comment: commentObject.comment,
      comment_obj: null,
      evaluator_address: commentObject.evaluatorAddress,
    }
  
    return assetToHash;

  } catch (error) {
    console.error("There as an error while preparing asset (Comment): ", error);
    return -2;
  }
}

async function createAsset(writer: WritableStreamDefaultWriter<any>, encoder: TextEncoder, asset: CommentOnActionPlan, commentName: string) {
  try {
    console.log('chainName: ', chainName)
    const iterableAsset = Object.keys(asset as CommentOnActionPlan).map((property) => {
      return {
        name: property,
        value: (asset as any)[property]
      }
    })
    console.log("The Asset: ", iterableAsset);

    let addAssetResponse = await fgStorage.addAsset(
      iterableAsset,
      {
        parent: null,
        name: asset.comment_id,
        description: "Comment asset, an Evaluator (Validator) is commenting an ActionPlan",
        template: "bafyreibp7mxzqib2cr6d7xrtcmubcm3dffrnvu3jpp2tqujihvouadqgoa",
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

          cleanUp(commentName, asset.comment_id);

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

function cleanUp(commentName: string, commentId: CommentId) {
  try {
    fs.unlinkSync(`${process.env.CACHE_FOLDER}${commentName}.done`);
    fs.unlinkSync(`${process.env.CACHE_FOLDER}${commentId}.done`);
  } catch (error) {
    console.error("There was an error while deleting temporary files: ", error);
  }
}