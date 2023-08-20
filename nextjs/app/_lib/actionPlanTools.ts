import { createHash } from "crypto";

export function createProjectId(projectObject: object): ProjectId {
  const sha256Hex: string = createHash('sha256').update(JSON.stringify(projectObject)).digest('hex');
  const projectIdHex = sha256Hex.slice(sha256Hex.length-12, sha256Hex.length);
  
  return `Project-${projectIdHex}`;
}

export function createActionPlanId(signableObject: object): ActionPlanId {
  const sha256Hex: string = createHash('sha256').update(JSON.stringify(signableObject)).digest('hex');
  const actionPlanIdHex = sha256Hex.slice(sha256Hex.length-12, sha256Hex.length);

  return `ActionPlan-${actionPlanIdHex}`;
}