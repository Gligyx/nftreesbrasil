import { NextRequest, NextResponse } from "next/server";
import fs from 'fs';

export async function POST(request: NextRequest) {  
  try {
    const formData = await request.formData();
    if (!process.env.CACHE_FOLDER) throw "No cache folder specified! Check .env!";
    const cacheFolder = process.env.CACHE_FOLDER;
  
    const commentName = formData.get('comment-name') as string;                                // Temporary comment name
    const projectId = formData.get('project-id') as ProjectId;                                 // Mandatory
    const actionPlanId = formData.get('action-plan-id') as ActionPlanId;                       // Mandatory
    const actionPlanCid = formData.get('action-plan-cid') as string;                           // Mandatory
    const comment = formData.get('comment') as string;                                         // Mandatory
    // We could handle optional data object, but we are not doing that yet
    const ownerAddress = formData.get('project-owner-address') as EthAddress;                  // Mandatory
    const validator = formData.get('validator-address') as EthAddress;                         // Mandatory
  
    const commentObject: CommentUploadObjReady = {                                             // Information that will be saved to Document-[timestamp].done
      commentName: commentName,
      projectId: projectId,
      actionPlanId: actionPlanId,
      actionPlanCID: actionPlanCid,
      comment: comment,
      actionPlanSigner: ownerAddress,
      evaluatorAddress: validator
    }

    // Currently we are not processing documents, that would be an enhancment. So we don't handle files here.
    // We don't create database entry for comment
  
    fs.writeFileSync(cacheFolder + commentName + ".done", JSON.stringify(commentObject));       // We signal to main that we are done
  
    return NextResponse.json({
      success: true,
      message: "Data upload started"
    });
    
  } catch (error) {
    console.error("Error in Comment data upload: ", error);
    return NextResponse.json({
      error: error
    }, {
      status: 500
    });
  }
}