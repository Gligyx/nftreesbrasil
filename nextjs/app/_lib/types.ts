// needs to be moved

type EthAddress = string;
type MaybeEthAddress = string | string[] | undefined | null;

type Nonce = number;
type SignatureMessage = string;
type Signature = string;

type jwtToken = string;
type loginResponse = string | number;

interface jwtObj {
  expires: number,
  eth_address: EthAddress,
  iat: number
}

type Username = string;

type Documents = React.MutableRefObject<HTMLInputElement | null>;
type Images = React.MutableRefObject<HTMLInputElement | null>;

// ActionPlan data upload
interface ActionPlanUploadObj {
  projectId: ProjectId | null,
  title: string, 
  description: string, 
  documentsRef: Documents, 
  imagesRef: Images,
  projectOwner: EthAddress
}
interface ActionPlanUploadObjReady {
  projectId: ProjectId | undefined
  title: string, 
  description: string, 
  documentsRef: Documents, 
  imagesRef: Images, 
  documentName: string, 
  imageName: string,
  projectOwner: EthAddress
}

// Comment data upload
interface CommentUploadObj {
  projectId: ProjectId,
  actionPlanId: ActionPlanId,
  actionPlanCID: string,
  comment: string,
  actionPlanSigner: EthAddress,
  evaluatorAddress: EthAddress
}
interface CommentUploadObjReady {
  commentName: string,
  projectId: ProjectId,
  actionPlanId: ActionPlanId,
  actionPlanCID: string,
  comment: string,
  actionPlanSigner: EthAddress,
  evaluatorAddress: EthAddress
}

// AcceptedActionPlan data upload
interface AcceptedActionPlanUploadObj {
  projectId: ProjectId,
  actionPlanId: ActionPlanId,
  actionPlanCID: string,
  acceptedBy: EthAddress,  // evaluator_address
  actionPlanSigner: EthAddress,
  timestamp: number | null,
}
interface AcceptedActionPlanUploadObjReady {
  acceptedApName: string,
  projectId: ProjectId,
  actionPlanId: ActionPlanId,
  actionPlanCID: string,
  acceptedBy: EthAddress,  // evaluator_address
  actionPlanSigner: EthAddress,
  timestamp: number | null,
}

type ToastId = React.MutableRefObject<string | number | null>;

interface InitProjectObject {
  projectId: ProjectId | null,
  title: string,
  description: string,
  address: EthAddress,
  timestamp: number,
  documentCount: number,
  imageCount: number
}

// CO2.Storage asset IDs
type ProjectId = string;                  // 20 character long string, example: Project-0123456789ab
type ActionPlanId = string;               // 23 character long string, example: ActionPlan-0123456789ab
type CommentId = string;                  // 20 character long string, example: Comment-0123456789ab
type AcceptedActionPlanId = string;       // 23 character long string, same as ActionPlanId (maps to ActionPlan), example AcceptedAP-0123456789ab


// Object for hashing
interface GeneralObject {
  [key: string]: any;
}

// FileEntry for CO2.Storage asset
interface FileEntry {
  path: string,                           // This is name, but CO2.Storage spec requires it to be path
  content: ReadableStream
}


// Signable objects
interface SignableActionPlan {
  project_id: ProjectId,
  nonce: number,
  ancestor: ActionPlanId | null,
  project_name: string,
  data: DataObjCid,
  timestamp: number,
  project_owner_address: EthAddress
}
interface SignableComment {
  project_id: ProjectId,
  action_plan_id: ActionPlanId,
  action_plan_cid: string,
  comment: string,
  comment_obj: DataObjCid | null,
  evaluator_address: EthAddress
}
interface SignableAcceptedActionPlan {
  project_id: ProjectId,
  action_plan_id: ActionPlanId,
  action_plan_cid: string,
  accepted_by: EthAddress,   // evaluator_address
  timestamp: number
}

// Asset objects (ready to be deployed to CO2)
interface ActionPlan {
  project_id: ProjectId,
  action_plan_id: ActionPlanId,
  nonce: number,
  ancestor: ActionPlanId | null,
  project_name: string,
  data: DataObjCid,
  timestamp: number,
  project_owner_address: EthAddress,
  project_owner_signature: Signature
}
interface CommentOnActionPlan {
  project_id: ProjectId,
  action_plan_id: ActionPlanId,
  action_plan_cid: string,
  comment: string,
  comment_id: CommentId,
  evaluator_signature: Signature
}
interface AcceptedActionPlan {
  project_id: ProjectId,
  action_plan_id: ActionPlanId,
  action_plan_cid: string,
  accepted_by: EthAddress,
  timestamp: number,
  evaluator_signature: Signature
}

// When fetching on front end
interface DocumentElement {
  cid: string,
  path: string,
  size: number
}
interface ImageElement {
  cid: string,
  path: string,
  size: number
}

// Replacable data object for ActionPlan
interface DataObj {
  description: string,
  documents: [],
  images: [],
}

type DataObjCid = string;