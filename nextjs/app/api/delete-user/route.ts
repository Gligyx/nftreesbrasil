export const dynamic = 'force-dynamic' 
import { NextRequest, NextResponse } from "next/server";
import postgres from "@/app/_lib/db";
import { jwtAuth } from "@/app/_lib/jwtAuth";


export async function DELETE(request: NextRequest) {
  try {
    if (request.method !== 'DELETE') throw "Method not allowed";
    if (!postgres) throw "Couldn't connect to database";
    const requestObject = await request.json();
    
    const address: EthAddress = requestObject.address.toLocaleLowerCase();
    const token = request.headers.get('authorization')?.split(" ")[1] as string;

    // Authenticate user 
    if (!jwtAuth(token, address)) throw "Error during JWT authentication!";

    // Delete user from database
    const deleteQuery = `DELETE FROM users WHERE eth_address = '${address}'`;
    const deleteResult = await postgres.query(deleteQuery);
    if (deleteResult.rowCount !== 1) throw "Error while executing SQL query!";

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    console.error("There was an error while deleting user from the database: ", error);
    return NextResponse.json({
      success: false,
      error: error
    }, {
      status: 500
    })
  }
}