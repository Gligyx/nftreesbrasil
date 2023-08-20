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