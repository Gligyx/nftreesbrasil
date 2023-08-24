'use client'
import { startCommentCreation } from '@/app/_lib/commentCreation';
import { getAddress } from '@/app/_lib/user-tools';
import { AuthContext } from '@/app/_sharedComponents/AuthProvider';
import { useContext, useRef, useState } from 'react';
import { Id, toast } from 'react-toastify';
import "@/app/_styles/buttons.css";

interface Props {
  actionPlan: ActionPlan,
  cid: string
}


export default function Comment({ actionPlan, cid }: Props) {
  const { isAuthenticated } = useContext(AuthContext);
  const toastId = useRef<Id | null>(null);
  const [comment, setComment] = useState("");

  async function send() {
    if (comment.length === 0) {
      toast.error("Comment field shouldn't be empty");
      return;
    }

    const fetched_address = await getAddress();
    if (fetched_address === -1) {
      toast.error("Could not connect to MetaMask!");
      return;
    };
    const address: EthAddress = fetched_address;

    startCommentCreation(toastId, {
      projectId: actionPlan.project_id,
      actionPlanId: actionPlan.action_plan_id,
      actionPlanCID: cid,
      comment: comment,
      actionPlanSigner: actionPlan.project_owner_address,
      evaluatorAddress: address
    });
  }


  return (
    <div>
      <textarea 
        value={comment} 
        onChange={(e) => setComment(e.target.value)}
      />

      <button className="generalButton" onClick={() => send()}>
        {"Comment"}
      </button>
    </div>
  )
}
