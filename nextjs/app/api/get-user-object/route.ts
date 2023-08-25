export const dynamic = 'force-dynamic' 
import postgres from "@/app/_lib/db";
import { NextRequest, NextResponse } from "next/server";


export async function GET(request: NextRequest) {
  try {
    if (!postgres) throw "Couldn't connect to database";
    
    // Get address from URL params
    const address_from_front_end: MaybeEthAddress = request.nextUrl.searchParams.get("address");
    if (!address_from_front_end) throw "No address was provided";
    const address: EthAddress = address_from_front_end.toLocaleLowerCase();

    // Query the database
    const query = `SELECT * FROM users WHERE eth_address = '${address}'`;
    const result = await postgres.query(query);
    let rows = result.rows;
    if (rows.length !== 1) throw "Address not found.";

    return NextResponse.json({
      address: rows[0].address,
      username: rows[0].username,
      role: rows[0].role
    })

  } catch (error) {
    console.error("There was an error while fetching the user object from the database: ", error);
    return NextResponse.json({
      error: error
    }, {
      status: 500
    })
  }
}