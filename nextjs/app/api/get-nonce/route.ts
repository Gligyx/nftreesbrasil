export const dynamic = 'force-dynamic' 
import { NextRequest, NextResponse } from 'next/server';
import postgres from "@/app/_lib/db";


export async function GET(request: NextRequest) {
  try {
    // Check if database connection object exists
    if (!postgres) throw "Couldn't connect to database";
  
    // Get address from URL params
    const address_from_front_end: MaybeEthAddress = (request.nextUrl.searchParams.get("address") as unknown) as string;
    if (!address_from_front_end) throw "No address was provided";
  
    const address: EthAddress = address_from_front_end.toLocaleLowerCase();
  
    // Query the database
    const query = `SELECT * FROM users WHERE eth_address = '${address}';`
    const result = await postgres.query(query);
  
    // Get nonce
    let rows = result.rows;
    if (rows.length !== 1) {
      console.log("Address couldn't be find in database. (rows.length is not 1)");
      // Most likely this is a new user. We will create a new entry in the database!
      if (rows.length === 0) {
        console.log("Registering new user...");
        const insertQuery = await postgres.query(`INSERT INTO users (nonce, eth_address, role) VALUES (EXTRACT(EPOCH FROM NOW())::BIGINT + (1000000 + RANDOM()::BIGINT % 1000000), '${address}', 'User');`);
        if (insertQuery.rowCount !== 1) throw "There was an error while inserting new user into the database!";
        const readBackNonceQuery = await postgres.query(`SELECT * FROM users WHERE eth_address = '${address}';`);
        rows = readBackNonceQuery.rows;
        if (rows.length !== 1) throw "Error while reading back the newly inserted nonce!";
      }
    };
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
    }, {
      status: 500
    });
  }
}