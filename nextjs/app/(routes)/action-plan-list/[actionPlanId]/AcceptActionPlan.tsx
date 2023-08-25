'use client'
import { startCommentCreation } from '@/app/_lib/commentCreation';
import { getAddress } from '@/app/_lib/user-tools';
import { AuthContext } from '@/app/_sharedComponents/AuthProvider';
import { useContext, useRef, useState } from 'react';
import { Id, toast } from 'react-toastify';
import "@/app/_styles/buttons.css";
import { startHypercertCreation } from '@/app/_lib/hypercertCreation';

interface Props {
  actionPlan: ActionPlan,
  cid: string
}


export default function AcceptActionPlan({ actionPlan, cid}: Props) {
  const toastId = useRef<Id | null>(null);


  
  async function accept() {
    const fetched_address = await getAddress();
    if (fetched_address === -1) {
      toast.error("Could not connect to MetaMask!");
      return;
    };
    const address: EthAddress = fetched_address;

    startHypercertCreation(toastId, {
      projectId: actionPlan.project_id,
      actionPlanId: actionPlan.action_plan_id,
      actionPlanCID: cid,
      acceptedBy: address,  // evaluator_address
      actionPlanSigner: actionPlan.project_owner_address,
      timestamp: null,
    });
  }


  return (
    <div>
      <button className="generalButton" onClick={() => accept()}>
        {"Accept"}
      </button>
    </div>
  )
}
