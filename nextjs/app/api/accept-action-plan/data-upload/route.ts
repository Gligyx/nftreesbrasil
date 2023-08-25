export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import fs from 'fs';


export async function POST(request: NextRequest) {  
  try {
    const formData = await request.formData();
    if (!process.env.CACHE_FOLDER) throw "No cache folder specified! Check .env!";
    const cacheFolder = process.env.CACHE_FOLDER;
  
    const acceptedApName = formData.get('accepted-ap-name') as string;                         // Temporary name
    const projectId = formData.get('project-id') as ProjectId;
    const actionPlanId = formData.get('action-plan-id') as ActionPlanId;
    const actionPlanCid = formData.get('action-plan-cid') as string;
    const validator = formData.get('accepted-by') as EthAddress;
    const actionPlanSigner = formData.get('project-owner-address') as EthAddress;
  
    const commentObject: AcceptedActionPlanUploadObjReady = {                                  // Information that will be saved to AcceptedAP-[timestamp]
      acceptedApName: acceptedApName,
      projectId: projectId,
      actionPlanId: actionPlanId,
      actionPlanCID: actionPlanCid,
      acceptedBy: validator,  // evaluator_address
      actionPlanSigner: actionPlanSigner,
      timestamp: null,
    }
  
    fs.writeFileSync(cacheFolder + acceptedApName + ".done", JSON.stringify(commentObject));   // We signal to main that we are done
  
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