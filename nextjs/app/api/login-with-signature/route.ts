export const dynamic = 'force-dynamic' 
import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';
import { verifySignature } from '@/app/_lib/signature-tools-server';


export async function POST(request: NextRequest) {
  const oneWeek = (60*60*24*7);

  try {
    if (request.method !== 'POST') throw "Method not allowed";
    const requestObject = await request.json();
    let jwtToken: jwtToken = "not-set";
    const address: EthAddress = requestObject.address.toLocaleLowerCase();
    
    // Verify signature
    const verifyResult = await verifySignature(requestObject.signature, address);
    
    // Generate JWT token, if verification passed
    if (verifyResult === true) {
      if (!process.env.JWT_SECRET) throw "JWT SECRET IS NULL!"
      jwtToken = jwt.sign({                                             // Generate JWT token
        expires: Math.floor(Date.now() / 1000) + oneWeek,
        eth_address: address
      }, process.env.JWT_SECRET);
    } else {
      throw "The signature does not match!"
    }

    return NextResponse.json({ 
      token: jwtToken 
    });

  } catch (error) {
    console.error(`There was an error in the login-with-signature: ${error}`);
    return NextResponse.json({
      error: error
    }, {
      status: 500
    });
  }
}