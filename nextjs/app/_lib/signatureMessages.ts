const { createHash } = require('crypto');

export function createActionPlanSignatureMessage(signableObject: SignableActionPlan) {
  const stringifiedObject = JSON.stringify(signableObject);
  const sha256Hex: string = createHash('sha256').update(stringifiedObject).digest('hex');
  const message = `I'm signing ActionPlan asset with hash: ${sha256Hex}`;

  return message;
}

export function createCommentSignatureMessage(signableObject: SignableComment) {
  const stringifiedObject = JSON.stringify(signableObject);
  const sha256Hex: string = createHash('sha256').update(stringifiedObject).digest('hex');
  const message = `I'm signing Comment asset with hash: ${sha256Hex}`;

  return message;
}

export function createAcceptedAPSignatureMessage(signableObject: SignableAcceptedActionPlan) {
  const stringifiedObject = JSON.stringify(signableObject);
  const sha256Hex: string = createHash('sha256').update(stringifiedObject).digest('hex');
  const message = `I'm signing AcceptedActionPlan asset with hash: ${sha256Hex}`;

  return message;
}