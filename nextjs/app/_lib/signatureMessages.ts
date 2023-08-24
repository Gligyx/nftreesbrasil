const { createHash } = require('crypto');

export function createActionPlanSignatureMessage(signableObject: object) {
  const stringifiedObject = JSON.stringify(signableObject);
  const sha256Hex: string = createHash('sha256').update(stringifiedObject).digest('hex');
  const message = `I'm signing ActionPlan asset with hash: ${sha256Hex}`;

  return message;
}

export function createCommentSignatureMessage(signableObject: object) {
  const stringifiedObject = JSON.stringify(signableObject);
  const sha256Hex: string = createHash('sha256').update(stringifiedObject).digest('hex');
  const message = `I'm signing Comment asset with hash: ${sha256Hex}`;

  return message;
}