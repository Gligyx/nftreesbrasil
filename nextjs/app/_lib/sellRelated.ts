import { projectConfig } from "@/config";
import { ethers, Signer, BaseContract, BigNumberish } from "ethers-new";

// MarketContract
const contractABI = require('../../../market-contract/contracts/artifacts/MarketContract.json').abi;
const contract = new ethers.Contract(projectConfig.marketContract, contractABI)

interface Window {
  ethereum?: any;
}

interface MarketContract extends BaseContract {
  changePrice: Function,
  changeLimit: Function,
  getHypercertInfo: Function
}


// Change the price in the MarketContract, through MetaMask or other BrowserProvider
export async function changePriceThroughContract(tokenId: string, newPrice: number) {
  try {
    const win: Window & typeof globalThis = window;
    await win.ethereum.request({ method: 'eth_requestAccounts'});
    const signer: Signer = await new ethers.BrowserProvider(win.ethereum).getSigner();
  
    const marketContract = contract.connect(signer) as MarketContract;
    const response = await marketContract.changePrice(tokenId, newPrice, { gasLimit: 100000 });
    const receipt = await response.wait();
    
    console.log("Receipt: ", receipt);
    if (receipt === null) { 
      throw "Receipt is null!"
    } else {
      return true;
    }
    
  } catch (error) {
    console.error("There was an error while setting the new price in the MarketContract: ", error);
    return false;
  }
}

// Change the limit in the MarketContract, through MetaMask, or other BrowserProvider
export async function changeLimitThroughContract(tokenId: string, limit: number) {
  try {
    const win: Window & typeof globalThis = window;
    await win.ethereum.request({ method: 'eth_requestAccounts'});
    const signer: Signer = await new ethers.BrowserProvider(win.ethereum).getSigner();
  
    const marketContract = contract.connect(signer) as MarketContract;
    const response = await marketContract.changeLimit(tokenId, limit, { gasLimit: 100000 });
    const receipt = await response.wait();
    
    console.log("Receipt: ", receipt);
    if (receipt === null) { 
      throw "Receipt is null!"
    } else {
      return true;
    }

  } catch (error) {
    console.error("There was an error while setting the new limit in the MarketContract: ", error);
    return false;
  }
}

// Buy some quantity of Hypercert, using the MarketContract, through MetaMask, or other BrowserProvider
export async function buyHypercertThroughContract() {

}

// Check the current settings (blockchain)
export async function getSalesInfoFromContract(tokenId: string) {
  const win: Window & typeof globalThis = window;
  const accounts = await win.ethereum.request({ method: 'eth_requestAccounts'});
  const signer: Signer = await new ethers.BrowserProvider(win.ethereum).getSigner();

  const marketContract = contract.connect(signer) as MarketContract;
  const viewResult = await marketContract.getHypercertInfo("4099721956663466607806737270337943411621889");
  
  // CONSTRUCT THE REsULT
  console.log("contract: ", viewResult)
  console.log("TokenId: ", viewResult[0] as string)
  console.log("ProjectOwner: ", viewResult[1] as string);
  console.log("Price: ", Number(viewResult[2] as BigInt));
  console.log("Limit: ", Number(viewResult[3] as BigInt));
}

export async function changePriceSetting(projectId: ProjectId, address: EthAddress, newPrice: number) {
  try {
    const url = `${projectConfig.serverAddress}/api/change-price-setting`;
    const jwtToken = localStorage.getItem('jwtToken');

    const rawResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        projectId,
        address,
        newPrice,
      })
    });

    const response = await rawResponse.json();
    if (response.success) return true;
    else return false;

  } catch (error) {
    console.log("There was an error while trying to change price setting for the sale of hypercert: ", error);
    return false;
  }
}

export async function changeLimitSetting(projectId: ProjectId, address: EthAddress, maxQuantity: number) {
  try {
    const url = `${projectConfig.serverAddress}/api/change-limit-setting`;
    const jwtToken = localStorage.getItem('jwtToken');

    const rawResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        projectId,
        address,
        maxQuantity
      })
    });

    const response = await rawResponse.json();
    if (response.success) return true;
    else return false;

  } catch (error) {
    console.log("There was an error while trying to change the limit setting for the sale of hypercert: ", error);
    return false;
  }
}

export async function buyHypercert(projectId: ProjectId, price: number, quantity: number) {
  try {
    const url = `${projectConfig.serverAddress}/api/buy-hypercert`;
    const jwtToken = localStorage.getItem('jwtToken');

    const rawResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        projectId,
        price,
        quantity
      })
    })
  } catch (error) {
    console.error("There was an error while buying Hypercert: ", error);
  }
}