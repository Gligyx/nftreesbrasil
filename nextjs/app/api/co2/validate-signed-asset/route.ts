export const dynamic = 'force-dynamic'
import { chainName, fgStorage } from "@/app/_lib/co2Conn";
import { createActionPlanSignatureMessage, createCommentSignatureMessage } from "@/app/_lib/signatureMessages";
import { ethers } from "ethers-new";
import { NextRequest, NextResponse } from "next/server";


export async function GET(request: NextRequest) {
  try {
    if (request.method !== 'GET') throw "Method not allowed";
    const signerAddress = request.nextUrl.searchParams.get('signer') as EthAddress;
    const assetId = request.nextUrl.searchParams.get('assetId') as string;
    if (!signerAddress) throw "No signer address provided!";
    if (!assetId) throw "No assetId provided!";

    // At this point, we can have multiple asset IDs, but we need to handle them differently

    const searchResponse = await fgStorage.search(chainName, null, null, null, null, assetId, null, null, null, null, process.env.ADDRESS);
    if (searchResponse.error) throw searchResponse.error;
  
    const assetResponse = await fgStorage.getAsset(searchResponse.result[0].cid);
    if (assetResponse.error) throw assetResponse.error;

    const resultObj: any = {};
    assetResponse.result.asset.map((line: object) => {
      const name = Object.keys(line)[0];
      const value = (line as any)[name];
      resultObj[name] = value;
    })

    if (assetId.includes("ActionPlan")) {
      // Treat it as ActionPlan
      const obj: SignableActionPlan = {
        project_id: resultObj.project_id,
        nonce: resultObj.nonce,
        ancestor: resultObj.ancestor,
        project_name: resultObj.project_name,
        data: resultObj.data,
        timestamp: resultObj.timestamp,
        project_owner_address: resultObj.project_owner_address
      }
      
      const message = createActionPlanSignatureMessage(obj);
      const isSigValid = verifyAssetSignature(resultObj.project_owner_signature, message, resultObj.project_owner_address);

      return NextResponse.json({ signatureValid: isSigValid });
    }

    if (assetId.includes("Comment")) {
      // Treat it as CommentOnActionPlan

      const obj: SignableComment = {
        project_id: resultObj.project_id,
        action_plan_id: resultObj.action_plan_id,
        action_plan_cid: resultObj.action_plan_cid,
        comment: resultObj.comment,
        comment_obj: resultObj.comment_obj,
        evaluator_address: resultObj.evaluator_address,
      }

      const message = createCommentSignatureMessage(obj);
      const isSigValid = verifyAssetSignature(resultObj.evaluator_signature, message, resultObj.evaluator_address);

      return NextResponse.json({ signatureValid: isSigValid });
    }

  } catch (error) {
    console.error("Error while validating signature! ", error);
    return NextResponse.json({
      success: false,
      signatureValid: false,
      error: error
    }, {
      status: 500
    })
  }
}



function verifyAssetSignature(signature: Signature, message: string, address: EthAddress) {
  try {    
    // Verify the signature
    const recoveredAddress = ethers.verifyMessage(message, signature);
    const verificationResult = recoveredAddress.toLocaleLowerCase() === address.toLocaleLowerCase();
    if (verificationResult) console.log("The signature is correct.")
    else console.log("The signature is not correct.");

    return verificationResult;
  } catch (error) {
    console.error("There was an error in the signature verification function: ", error);
    return false;
  }
}