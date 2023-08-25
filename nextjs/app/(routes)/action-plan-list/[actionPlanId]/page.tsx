//'use client'
//import React, { useEffect, useState } from 'react';
//import { toast } from 'react-toastify';
import "@/app/_styles/main.css";
import { projectConfig } from '@/config';
import Image from "next/image";
import Comment from "./Comment";
import AcceptActionPlan from "./AcceptActionPlan";

interface Props {
  params: {
    actionPlanId: ActionPlanId
  }
}

async function fetchActionPlan(id: ActionPlanId) {
  console.log("Fetching ActionPlan asset...");
  const response = await fetch(`${projectConfig.serverAddress}/api/co2/get-action-plan?id=${id}`);
  const json = await response.json();

  if (json.error) return null;

  const asset: ActionPlan = json.asset;

  return asset;
}

async function fetchCid(id: ActionPlanId) {
  const response = await fetch(`${projectConfig.serverAddress}/api/co2/get-action-plan?id=${id}`);
  const json = await response.json();
  
  if (json.error) return null;

  const cid: string = json.assetCID;

  return cid;
}


export default async function ActionPlanPage({ params }: Props) {
  const actionPlan: ActionPlan | null = await fetchActionPlan(params.actionPlanId);
  const actionCID: string | null = await fetchCid(params.actionPlanId);

  if (actionPlan === null || actionCID === null) return <p>Error</p>
  
  return (
    <>
      {actionPlan && <>
        <h1>{actionPlan.project_name}</h1>
        
        {/* <p>
          {"Description: "}
          {actionPlan.description}
        </p>*/}

        <p>
          {"ActionPlanId: "}
          {actionPlan.action_plan_id}
        </p>

        <p>
          {"Associated Project: "}
          {actionPlan.project_id}
        </p>
        
        <p>
          {"Created: "}
          {new Date(actionPlan.timestamp).toISOString()}
        </p>

        {/*<p>
          {"Documents"}
          <ul>
            {actionPlan.documents.map((document: DocumentElement, index: number) => (
              <li key={index}>{document.path}</li>
            ))}
          </ul>
        </p>

        <p>
          {"Images"}
          <ul>
            {actionPlan.images.map((image: ImageElement, index: number) => (
              <li key={index} style={{width: "25vw"}}>
                <Image 
                  src={`https://ipfs.io/ipfs/${image.cid}`}
                  alt={image.path}
                  fill
                  loading={'lazy'}
                />
              </li>
            ))}
          </ul>
        </p>*/}
        
        
          {actionCID && "validator" &&     
            <>
              <Comment actionPlan={actionPlan} cid={actionCID} />

              <AcceptActionPlan actionPlan={actionPlan} cid={actionCID} />
            </>
          }
        
        
      </>}
    </>
  )
}
