'use client'
import React, { useState } from 'react';
import "@/app/_styles/main.css";
import { buyHypercert, changePriceThroughContract, changePriceSetting, changeLimitSetting, changeLimitThroughContract, getSalesInfoFromContract } from '@/app/_lib/sellRelated';
import { toast } from 'react-toastify';
import { getAddress } from '@/app/_lib/user-tools';
import { BigNumberish } from 'ethers-new';

interface Props {
  params: {
    projectId: ProjectId
  }
}


export default function ProjectDashboardPage({ params }: Props) {
  const [pricePerOne, setPricePerOne] = useState(0);
  const [max, setMax] = useState(0);
  const [tokenId, setTokenId] = useState("4099721956663466607806737270337943411621889");
  const TOTAL_SUPPLY = 42;

  async function changePrice() {
    const address = await getAddress();
    if (address === -1) {
      toast.error("Error reading user address. Probably MetaMask is not installed.");
      return;
    }
    
    const contractResult = await changePriceThroughContract(tokenId, pricePerOne);
    if (contractResult) {
      const success = await changePriceSetting(params.projectId, address, pricePerOne);
      if (success) toast.success("New price was set!");
      else toast.error("There was an error while setting the new price (DB)");
    } else {
      toast.error("There was an error while setting the new price");
    }
  }

  async function changeLimit() {
    const address = await getAddress();
    if (address === -1) {
      toast.error("Error reading user address. Probably MetaMask is not installed.");
      return;
    }
    
    const contractResult = await changeLimitThroughContract(tokenId, max);
    if (contractResult) {
      const success = await changeLimitSetting(params.projectId, address, max);
      if (success) toast.success("New limit was set!");
      else toast.error("There was an error while setting the new limit (DB)");
    } else {
      toast.error("There was an error while setting the new limit");
    }
  }

  async function buy() {
    const address = await getAddress();
    if (address === -1) {
      toast.error("Error reading user address. Probably MetaMask is not installed.");
      return;
    }
    //await buyHypercert();
  }

  
  return (
    <>
      <h1>Project: {params.projectId}</h1>
      <p>Dynamically do the things</p>
      <p>newest associated action plan and things like that</p>

      <div>
        <p>{"(if project owner)"}</p>
        <p>Set Price</p>
        <label>Price per one fraction</label>

        <button onClick={changePrice}>Change Price</button>
      </div>

      <div>
        <p>{"(if project owner)"}</p>
        <input min={0} value={pricePerOne} onChange={(e) => setPricePerOne(Number(e.target.value))} placeholder={"ETH"}></input>
        <label>Max</label>
        <input min={0} max={TOTAL_SUPPLY} value={max} onChange={(e) => setMax(Number(e.target.value))}></input>

        <button onClick={changeLimit}>Change Limit</button>
      </div>

      <button onClick={() => getSalesInfoFromContract(tokenId)}>Get Current Values</button>

      <p>Conditional Buy</p>
    </>
  )
}
