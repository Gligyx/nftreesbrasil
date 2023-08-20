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
  title: string, 
  description: string, 
  documentsRef: Documents, 
  imagesRef: Images,
  projectOwner: EthAddress
}
interface ActionPlanUploadObjReady {
  title: string, 
  description: string, 
  documentsRef: Documents, 
  imagesRef: Images, 
  documentName: string, 
  imageName: string,
  projectOwner: EthAddress
}

type ToastId = React.MutableRefObject<string | number | null>;

interface InitProjectObject {
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


// Object for hashing
interface GeneralObject {
  [key: string]: any;
}

// FileEntry for CO2.Storage asset
interface FileEntry {
  name: string,
  content: ReadableStream
}


// Signable objects
interface SignableActionPlan {
  project_id: ProjectId,
  nonce: number,
  ancestor: ActionPlanId | null,
  project_name: string,
  description: string,
  documents: [],
  images: [],
  timestamp: number,
}

// Asset objects (ready to be deployed to CO2)
interface ActionPlan {
  project_id: ProjectId,
  action_plan_id: ActionPlanId,
  nonce: number,
  ancestor: ActionPlanId | null,
  project_name: string,
  description: string,
  documents: [],
  images: [],
  timestamp: number,
  project_owner_signature: Signature
}