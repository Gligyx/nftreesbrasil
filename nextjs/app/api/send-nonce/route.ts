import { NextApiRequest } from 'next';
import { NextResponse } from 'next/server';
import conn from '../../lib/db';  

export async function GET(req: NextApiRequest) {
  if (!conn) {
    return NextResponse.json({ error: "Couldn't connect to database"});
  };

  try {
    
    const query = 'SELECT * FROM users;'
    const values = req.body.content;
    
    const result = conn.query(query);
    const address: EthAddress = "0x123";
    const theNonce: Nonce = 234234;

    console.log("The result from Postgres: ", result);
    
    return NextResponse.json({
      eth_address: address,
      nonce: theNonce
    });
  } catch (error) {
    console.error(`There was an error in send-nonce route: ${error}`);
    return Response.error();
  }
}