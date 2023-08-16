import * as jwt from 'jsonwebtoken';

// Function, that will verify JWT token
export function jwtAuth(token: jwtToken, address: EthAddress): boolean {     
  try {
    if (!process.env.JWT_SECRET) throw "JWT SECRET IS NULL!"
    const decryptedJwt: jwtObj = jwt.verify(token, process.env.JWT_SECRET) as jwtObj;
    const expires = new Date(decryptedJwt.expires * 1000);
    const eth_address = decryptedJwt.eth_address.toLocaleLowerCase();
    const isValid = ( expires > new Date() ) && ( eth_address === address.toLowerCase() );
    
    return isValid;

  } catch (error) {
    console.error("Error during JWT validation: ", error);
    return false;
  }
}