export const dynamic = 'force-dynamic' 
import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';


export async function POST(request: NextRequest) {
  try {
    if (request.method !== 'POST') throw "Method not allowed";
    const requestObject = await request.json();
    const jwtToken = requestObject.token;
    const address_from_frontend = requestObject.address.toLocaleLowerCase();

    // Verify the JWT token
    if (!process.env.JWT_SECRET) throw "JWT SECRET IS NULL!"
    const decryptedJwt: jwtObj = jwt.verify(jwtToken, process.env.JWT_SECRET) as jwtObj;
    
    // Check if it is expired or not, address is correct
    const expires = new Date(decryptedJwt.expires * 1000);
    const eth_address = decryptedJwt.eth_address.toLocaleLowerCase();
    const isValid = ( expires > new Date() ) && ( eth_address === address_from_frontend );
    
    // Send back boolean response
    return NextResponse.json({
      validateResult: isValid
    });
    
  } catch (error) {
    console.error("There was an error in the validate-jwt route: ", error);
    return NextResponse.json({ validateResult: false}, { status: 500 })
  }
}