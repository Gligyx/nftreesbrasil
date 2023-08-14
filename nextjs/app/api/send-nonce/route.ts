import { NextRequest, NextResponse } from 'next/server';
import conn from '../../lib/db';  


export async function GET(request: NextRequest) {
  if (!conn) {
    return NextResponse.json({ error: "Couldn't connect to database"});
  };

  try {
    // Get address from URL params
    const address_from_front_end: MaybeEthAddress = request.nextUrl.searchParams.get("address");
    if (!address_from_front_end) throw "No address was provided";
    const address: EthAddress = address_from_front_end;
    
    // Query the database
    const query = `SELECT * FROM users WHERE eth_address = ${address};`
    const result = await conn.query(query);
    
    // Get nonce
    const rows = result.rows;
    if (rows.length !== 1) throw "Address couldn't be find in database (rows.length is not 1)";
    const resultNonce: Nonce = rows[0].nonce;
    
    //Send back nonce to front end
    return NextResponse.json({
      eth_address: address,
      nonce: resultNonce
    });

  } catch (error) {
    console.error(`There was an error in send-nonce route: ${error}`);
    return NextResponse.json({
      error: error
    });
  }
}