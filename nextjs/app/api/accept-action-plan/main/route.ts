export const dynamic = 'force-dynamic' 
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import postgres from "@/app/_lib/db";
import { chainName, fgStorage } from "@/app/_lib/co2Conn";
import { createAcceptedActionPlanId, createActionPlanId, createProjectId } from "@/app/_lib/idTools";
import { createAcceptedAPSignatureMessage, createActionPlanSignatureMessage } from "@/app/_lib/signatureMessages";
import { projectConfig } from "@/config";
import { HypercertClient, formatHypercertData, TransferRestrictions } from '@hypercerts-org/sdk';
import { ethers, BigNumberish } from 'ethers';    // old ethers (v5)


export async function GET(request: NextRequest) {
  try {
    // Initialize SSE (Server Sent Events)
    let responseStream = new TransformStream();
    const writer = responseStream.writable.getWriter();
    const encoder = new TextEncoder();
    
    // This will keep running after the GET function returned
    executeAcceptActionPlanWorkflow(writer, encoder);
  
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

async function executeAcceptActionPlanWorkflow(writer: WritableStreamDefaultWriter<any>, encoder: TextEncoder) {
  try {
    if (!process.env.CACHE_FOLDER) throw "Cache folder is not specified!";
    const cacheFolder = process.env.CACHE_FOLDER;

    const uploadResult = await getData(writer, encoder, cacheFolder);                    // Get data from front end (mainly the comment)
    if (uploadResult === -1) throw "There was an error in data upload";
    const acceptObject: AcceptedActionPlanUploadObjReady = uploadResult;

    const validationUrl = `${projectConfig.serverAddress}/api/co2/validate-signed-asset?signer=${acceptObject.actionPlanSigner}&assetId=${acceptObject.actionPlanId}`;
    console.log(validationUrl)
    const signatureValid = (await (await fetch(validationUrl)).json()).signatureValid;
    if (!signatureValid) {
      writer.write(encoder.encode("data: " + JSON.stringify({ signatureError: true }) + "\n\n"));
      throw "The signature for the ActionPlan is not valid!";
    }
  
    const preparedAsset = prepareAsset(acceptObject);
    if (preparedAsset === -2) throw "Error while creating preparedAsset";

    const signableObject: SignableAcceptedActionPlan = preparedAsset;
    const acceptedId: AcceptedActionPlanId = createAcceptedActionPlanId(signableObject.action_plan_id);

    writer.write(encoder.encode("data: " + JSON.stringify({                               // Ask user to sign
      sendSignature: true,
      acceptedId: acceptedId,
      message: createAcceptedAPSignatureMessage(signableObject),
    }) + "\n\n"));

    await waitForFile(cacheFolder, acceptedId + ".done");
    
    const rawSignature = fs.readFileSync(`${cacheFolder}${acceptedId}.done`, { encoding: 'utf8', flag: 'r' });
    fs.unlinkSync(`${process.env.CACHE_FOLDER}${acceptedId}.done`);                                                 // Delete the file so it does not collide with 2nd attempt
    const signature = JSON.parse(rawSignature).signature;
    writer.write(encoder.encode("data: " + JSON.stringify({ signatureReceived: true, }) + "\n\n"));                 // Signature Received Signal

    const asset: AcceptedActionPlan = {
      ...signableObject,
      evaluator_signature: signature
    }

    console.log("Signed Comment asset: ", asset);

    await createAsset(writer, encoder, asset, acceptObject.actionPlanSigner, acceptObject.acceptedApName, acceptedId)

  } catch (error) {
    console.error("There was an error while executing the main workflow (AcceptActionPlan): ", error);

    writer.write(encoder.encode("data: " + JSON.stringify({
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
    const acceptedApName = `AcceptedAP-${Date.now()}`;                      // This will be the name of the temporary file

    writer.write(encoder.encode("data: " + JSON.stringify({
      sendData: true,
      acceptedApName
    }) + "\n\n"));

    await waitForFile(cacheFolder, acceptedApName + ".done");

    // Get the metadata file. 
    const rawText = fs.readFileSync(`${cacheFolder}/${acceptedApName}.done`, { encoding: 'utf8', flag: 'r' });
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

function prepareAsset(acceptObject: AcceptedActionPlanUploadObj) {
  try {

    const assetToHash = {
      project_id: acceptObject.projectId,
      action_plan_id: acceptObject.actionPlanId,
      action_plan_cid: acceptObject.actionPlanCID,
      accepted_by: acceptObject.acceptedBy,   // evaluator_address
      timestamp: Date.now()
    }
  
    return assetToHash;

  } catch (error) {
    console.error("There as an error while preparing asset (Comment): ", error);
    return -2;
  }
}

async function createAsset(
  writer: WritableStreamDefaultWriter<any>, 
  encoder: TextEncoder, 
  asset: AcceptedActionPlan, 
  projectOwner: EthAddress,
  acceptedApName: string, 
  acceptedApId: AcceptedActionPlanId
) {
  try {
    if (!postgres) throw "Could not connect to database.";
    const checkCo2ExistsQuery = `SELECT * FROM projects WHERE project_id = '${asset.project_id}'`;
    const checkCo2ExistsResult = await postgres.query(checkCo2ExistsQuery);
    if (checkCo2ExistsResult.rowCount !== 1) throw "Error querying database!";
    if (checkCo2ExistsResult.rows[0].accepted_action_plan) {
      console.warn("A CO2.Storage asset already exists. We will skip this part, and check if the Hypercert exists or not.");
      createHypercert(writer, encoder, asset, projectOwner);
      return;
    }
    
    console.log('chainName: ', chainName)
    const iterableAsset = Object.keys(asset as AcceptedActionPlan).map((property) => {
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
        name: acceptedApId,
        description: "AcceptedActionPlan asset, an associated hypercert should exist for this",
        template: "bafyreifmyr7xxzuihviowr4blj4ksqqe4zdfpny6efbrtjimjptlvhf3qa",
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
          if (!postgres) throw "Could not connect to PostgreSQL database!";
          const insertActionPlanQuery = `UPDATE projects (accepted_action_plan) VALUES (${asset.action_plan_id}) WHERE project_id = '${asset.project_id}'`;
          const insertActionPlanResult = await postgres.query(insertActionPlanQuery);
          if (insertActionPlanResult.rowCount !== 1) throw "Error saving new entry to database.";

          cleanUp(acceptedApName, acceptedApId);
          
          await createHypercert(writer, encoder, asset, projectOwner);
        }
      },
      chainName,
      (status: any) => {
        console.log("CO2.Storage status: ", status)
      }
    );
    if (addAssetResponse.error) throw "Error while uploading asset to CO2.Storage " + addAssetResponse.error

    return addAssetResponse.result.block;
    
  } catch (error) {
    console.error("There was an error while creating assets on CO2.Storage: ", error);
    return -4;
  }
}

async function createHypercert(writer: WritableStreamDefaultWriter<any>, encoder: TextEncoder, asset: AcceptedActionPlan, projectOwner: EthAddress) {
  try {
    if (!postgres) throw "Could not connect to database.";
    const hypercertExistsQuery = `SELECT * FROM projects WHERE project_id = '${asset.project_id}'`;
    const hypercertExistsResult = await postgres.query(hypercertExistsQuery);
    if (hypercertExistsResult.rowCount !== 1) throw "Error querying PostgreSQL database";
    if (hypercertExistsResult.rows[0].hypercert_created) {
      console.warn("Hypercert already exists!");
      writer.write(encoder.encode("data: " + JSON.stringify({ hypercertExists: true, }) + "\n\n"));        // Hypercert Exists Signal
      writer.close();
      return;
    }

    writer.write(encoder.encode("data: " + JSON.stringify({ createHypercertStart: true, }) + "\n\n"));     // Hypercert Creation started Signal

    const address = process.env.ADDRESS;
    const privKey = process.env.PK;
    const nftStorageToken = process.env.NFT_STORAGE_API_KEY;
    const web3StorageToken = process.env.WEB3_STORAGE_API_KEY;
    if (!address) throw "No address provided in .env";
    if (!privKey) throw "No private key!";
    if (!nftStorageToken) throw "No NFT Storage API key provided in .env!";
    if (!web3StorageToken) throw "No Web3 Storage API key provided in .env!";

    const provider = new ethers.providers.JsonRpcProvider(`https://goerli.infura.io/v3/${process.env.INFURA_API_KEY}`)
    const wallet = new ethers.Wallet(privKey, provider);

    // Create client for Hypercert, owner will be the address that is attached to this
    const client = new HypercertClient({
      chainId: process.env.NETWORK === "goerli" ? 5 : 100,
      operator: wallet,
      nftStorageToken,
      web3StorageToken
    });

    // Validate and format Hypercert metadata
    const { data: metadata, valid, errors} = formatHypercertData({
      name: `NFTreesBrazil Hypercert for ${asset.project_id}`,
      description: `This is a hypercert associated with _${asset.project_id}_ on NFTreesBrazil. \
      The accepted ActionPlan is _${asset.action_plan_id}_. The ActionPlan was accepted by the Validator with address _${asset.accepted_by}_.`,
      external_url: `${projectConfig.serverAddress}/projects/${asset.project_id}`,
      image: `${projectConfig.serverAddress}/favicon.ico`,
      contributors: [ projectOwner ], 
      workTimeframeEnd: 0, 
      workTimeframeStart: Date.now()/1000, 
      impactTimeframeStart: 0, 
      impactTimeframeEnd: 0, 
      workScope: ["Reforestation"], 
      impactScope: ["all"], 
      rights: [], 
      version: "0.0.1",
      excludedImpactScope: [], 
      excludedRights: [],
      excludedWorkScope: [], 
    })
    // Check on errors
    if (!valid) {
      return console.error(errors);
    }
    if (!metadata) throw "Metadata is null"
    
    // Set the total amount of units available
    const totalUnits: BigNumberish = 777
    
    
    // Define the transfer restriction
    const transferRestrictions: TransferRestrictions = TransferRestrictions.FromCreatorOnly
    

    // Mint your Hypercert!
    const tx = await client.mintClaim(
      metadata,
      totalUnits,
      transferRestrictions,
    );
    
    const claimsBefore = await client.indexer.fractionsByOwner(address);
    const origClaimCount = claimsBefore.claimTokens.length;
    let currentClaimCount = origClaimCount;

    do {
      const claimsCurrent = await client.indexer.fractionsByOwner(address);
      currentClaimCount = claimsCurrent.claimTokens.length;
      await sleep(5000);
    } while (origClaimCount === currentClaimCount)

    if (!postgres) throw "Could not connect to database!";
    const insertHypercertQuery = `UPDATE projects (hypercert_created) VALUES (TRUE) WHERE project_id = '${asset.project_id}'`;
    const insertHypercertResult = await postgres.query(insertHypercertQuery);
    if (insertHypercertResult.rowCount !== 1) throw "Error writing value to database! (Hypercert creation)";

    writer.write(encoder.encode("data: " + JSON.stringify({
      done: true,
      message: "This connection can be closed.",
      actionPlanId: asset.action_plan_id
    }) + "\n\n"));

    writer.close();



  } catch (error) {
    console.error("There was an error, while trying to create the Hypercert: ", error);
    return -7;
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

function cleanUp(acceptedApName: string, acceptedApId: AcceptedActionPlanId) {
  try {
    fs.unlinkSync(`${process.env.CACHE_FOLDER}${acceptedApName}.done`);
    fs.unlinkSync(`${process.env.CACHE_FOLDER}${acceptedApId}.done`);
  } catch (error) {
    console.error("There was an error while deleting temporary files: ", error);
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}