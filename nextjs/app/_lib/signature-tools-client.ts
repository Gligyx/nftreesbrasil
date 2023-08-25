import { projectConfig } from "@/config";
import { Signer, ethers  } from "ethers-new";

interface Window {
  ethereum?: any;
}


// This will be called on the front end
export async function getLoginMessage() {
  try {
    // Get the address of the user from MetaMask
    const win: Window & typeof globalThis = window;
    const accounts = await win.ethereum.request({ method: 'eth_requestAccounts'});
    const signer: Signer = await new ethers.BrowserProvider(win.ethereum).getSigner();
  
    // Fetch nonce from the server
    const address = await signer.getAddress();
    const url = `${projectConfig.serverAddress}/api/get-nonce?address=${encodeURIComponent(address)}`;
    const response = await fetch(url, { method: 'GET'});
    const jsonResult = await response.json();
    
    if (jsonResult.error) {
      throw jsonResult.error;
    }

    // Return the nonce fetched from the server
    const nonce = jsonResult.nonce;
    if (address.toLocaleLowerCase() === jsonResult.eth_address.toLocaleLowerCase()) {
      const message: SignatureMessage = `I'm signing a one-time-nonce, for authentication purposes. The one-time-nonce: ${nonce}`;
      return message;
    } else {
      throw "The signer address and the address returned from the server does not match."
    }
  } catch (error) {
    console.error("There was an error while fetching the nonce from the server: ", error);
    return -1;
  }
}

// front end
export async function loginWithSignature(signature: string) {
  try {
    let JWTfromServer: loginResponse = -2;
    // Get address of current user
    const win: Window & typeof globalThis = window;
    const accounts = await win.ethereum.request({ method: 'eth_requestAccounts'});
    const signer: Signer = await new ethers.BrowserProvider(win.ethereum).getSigner();
    const address = await signer.getAddress();

    const requestObject = {
      signature: signature,
      address: address
    }

    await fetch(`${projectConfig.serverAddress}/api/login-with-signature`, { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestObject)
    })
    .then((response) => response.json())
    .then((responseJson) => {
      console.log("The response JSON: ", responseJson);
      JWTfromServer = responseJson.token;
      return;
    })
    .catch((error) => {
      throw error;
    });

    return JWTfromServer;
  } catch (error) {
    console.error("There was an error while sending signature to the server: ", error);
    return -1;
  }
}


// This is used on the front end, with the help of MetaMask
export async function signMessage(inputMessage: string) {
  try {
    const win: Window & typeof globalThis = window;
  
    if (typeof win.ethereum !== 'undefined') {
      const accounts = await win.ethereum.request({ method: 'eth_requestAccounts'});
      const signer = new ethers.BrowserProvider(win.ethereum).getSigner();
      const signature = await (await signer).signMessage(inputMessage);
      console.log("Signature: ", signature);
      
      return signature;

    } else {
      throw "Couldn't find Metamask or other similar web3 wallet.";
    }
  } catch (error) {
    console.error("Error in signMessage: ", error);
    return false;
  }
}