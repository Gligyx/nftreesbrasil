import { NextRequest, NextResponse } from "next/server";
import fs from 'fs';


export async function POST(request: NextRequest) {
  try {
    if (request.method !== 'POST') throw "Method not allowed";
    const requestObject = await request.json();
    const signature = requestObject.signature;
    const commentId = requestObject.commentId;

    // We signal to main that we are done
    fs.writeFileSync(process.env.CACHE_FOLDER + commentId + ".done", JSON.stringify({ signature }));

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    console.error("There was an error while sending signature for new ActionPlan: ", error);
    return NextResponse.json({
      error,
    }, {
      status: 500
    })
  }
}