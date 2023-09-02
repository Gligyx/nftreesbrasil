import postgres from "@/app/_lib/db";
import { jwtAuth } from "@/app/_lib/jwtAuth";
import { NextRequest, NextResponse } from "next/server";


/**
 * This API route will change the maximum amount to sell for the Hypercert (SQL)
 * The max value is mainly for the pre-sale, when the hypercert
 * is possibly cheaper compared to the price when the reforestation work is already finished.
 * @returns success === true, if it could update the values, error otherwise
 */
export async function POST(request: NextRequest) {
  try {
    if (request.method !== 'POST') throw "Method not allowed";
    if (!postgres) throw "Could not connect to PostgreSQL database!";
    const jwtToken = request.headers.get('authorization')?.split(" ")[1] as string;
    const requestObject = await request.json();
    if (!jwtAuth(jwtToken, requestObject.address)) throw "Unauthorized! (JWT is not valid)";

    const sellMax = requestObject.maxQuantity as number;             // this is how many fractions we are selling max
    const projectId = requestObject.projectId as ProjectId;
    if (!sellMax && sellMax !== 0) throw "No sellMax was provided!";
    if (!projectId) throw "No projectId was provided!";
    
    const checkProjectOwnerQuery = `SELECT project_owner FROM projects WHERE project_id = '${projectId}';`;
    const checkProjectOwnerResult = await postgres.query(checkProjectOwnerQuery);
    if (checkProjectOwnerResult.rowCount !== 1) throw "Error querying database!";
    if (checkProjectOwnerResult.rows[0].project_owner !== requestObject.address) throw "Only the ProjectOwner can change these values!";

    const setSellSettingsQuery = `UPDATE projects SET sell_limit = ${sellMax} WHERE project_id = '${projectId}';`;
    const setSellSettingsResult = await postgres.query(setSellSettingsQuery);
    if (setSellSettingsResult.rowCount !== 1) throw "Error updating database!";

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    console.error("There was an error in the /change-limit-setting route: ", error);
    return NextResponse.json({
      error
    }, {
      status: 500
    })
  }
}