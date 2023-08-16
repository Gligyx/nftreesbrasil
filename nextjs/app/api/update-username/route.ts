export const dynamic = 'force-dynamic' 
import { NextRequest, NextResponse } from "next/server";
import { jwtAuth } from "@/app/_lib/jwtAuth";
import conn from '../../_lib/db';


export async function POST(request: NextRequest) {
  try {
    if (request.method !== 'POST') throw "Method not allowed";
    if (!conn) throw "Couldn't connect to database";
    const requestObject = await request.json();
    
    const address: EthAddress = requestObject.address.toLocaleLowerCase();
    const newUsername: Username = requestObject.new_username;
    const token: jwtToken = requestObject.jwt_token;
    
    // Authenticate user 
    if (!jwtAuth(token, address)) throw "Error during JWT authentication!";

    // Check if username is already assigned to an address in the database
    const alreadyExistQuery = `SELECT * FROM users WHERE username = '${newUsername}'`;
    const alreadyExistResult = await conn.query(alreadyExistQuery);
    if (alreadyExistResult.rowCount > 0) throw "This username is already taken.";
    
    // Insert username into the database
    const updateQuery = `UPDATE users SET username = '${newUsername}' WHERE eth_address = '${address}'`;
    const updateResult = await conn.query(updateQuery);
    if (updateResult.rowCount !== 1) throw "There was an error while trying to insert the value into the database";

    return NextResponse.json({ 
      success: true 
    });

  } catch (error) {
    console.error("There was an error while trying to update username: ", error);
    return NextResponse.json({ 
      success: false, 
      error: error
    }, { 
      status: 500
    });
  }
}