import { createHash } from 'crypto';
import fs from 'fs';
import conn from './db';
import { ethers } from "ethers";


// Here we will verify signature, this does not happen on the route itself.
// This will happen on the back end
export async function verifySignature(signature: Signature, address: EthAddress) {
  try {
    if (!conn) throw "Couldn't connect to database";
    
    // Get nonce from database and create the same message that was signed by the user
    const query = `SELECT * FROM users WHERE eth_address = '${address}';`
    const result = await conn.query(query);
    const rows = result.rows;
    if (rows.length !== 1) throw "Address couldn't be find in database (rows.length is not 1)";
    const nonce: Nonce = rows[0].nonce;
    const message: SignatureMessage = `I'm signing a one-time-nonce, for authentication purposes. The one-time-nonce: ${nonce}`;
  
    // Verify the signature
    const recoveredAddress = ethers.verifyMessage(message, signature);
    const verificationResult = recoveredAddress.toLocaleLowerCase() === address.toLocaleLowerCase();
    if (verificationResult) console.log("The signature is correct.")
    else console.log("The signature is not correct.");

    // Reset nonce in database
    const resetNonceQuery = `UPDATE users SET nonce = (EXTRACT(EPOCH FROM NOW())::BIGINT + (1000000 + RANDOM()::BIGINT % 1000000)) WHERE eth_address = '${address}';`;
    const resetNonceResult = await conn.query(resetNonceQuery);
    if (resetNonceResult.rowCount !== 1) throw "Updating the nonce was not successful";

    return verificationResult;
  } catch (error) {
    console.error("There was an error in the signature verification function: ", error);
  }
}

export async function createSignableObject(inputObj: GeneralObject) {
  console.log("inputObj: ", inputObj)

  const signableObject: GeneralObject = {}
  await Promise.all(Object.keys(inputObj).map(async (property) => {
    if (!Array.isArray(inputObj[property])) {                                         // Convert every value to string, hash it
      let value = "";
      if (!inputObj[property]) value = "null";
      if (typeof inputObj[property] === 'string' || typeof inputObj[property] === 'number') value = inputObj[property].toString();
      const sha256Hex: string = createHash('sha256').update(value).digest('hex');
      signableObject[property] = sha256Hex;
    } else {                                                                          // Go through array of files, hash the file
      const fileArray = inputObj[property];

      signableObject[property] = await Promise.all(fileArray.map(async (fileEntry: FileEntry) => {
        const hash = await calculateFileHash(fileEntry.path);
        return {
          fileName: fileEntry.path,
          fileHash: hash
        }
      }));
    }
  }));

  return signableObject;
}

async function calculateFileHash(fileName: string) {
  try {
    const hash = createHash('sha256');
    const stream = fs.createReadStream(`${process.env.CACHE_FOLDER}${fileName}`);
  
    return new Promise((resolve, reject) => {
      stream.on('data', (data) => {
        hash.update(data);
      });
  
      stream.on('end', () => {
        const fileHash = hash.digest('hex');
        resolve(fileHash);
      });
  
      stream.on('error', (error: Error) => {
        reject(error);
      });
    });
  } catch (error) {
    console.error("Error hashing file: ", error);
  }
}