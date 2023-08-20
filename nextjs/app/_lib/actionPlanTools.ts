import { createHash } from "crypto";

export function createProjectId(projectObject: object): ProjectId {
  const sha256Hex: string = createHash('sha256').update(JSON.stringify(projectObject)).digest('hex');
  const projectId = sha256Hex.slice(sha256Hex.length-12, sha256Hex.length);
  
  return `Project-${projectId}`;
}

export function generateSignableX() {

}