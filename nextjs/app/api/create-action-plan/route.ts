import conn from "@/app/_lib/db";
import { write } from "fs";
import { NextApiRequest, NextApiResponse } from "next";
import { NextRequest, NextResponse } from "next/server";
const fs = require('fs');


export async function GET(request: NextRequest) {
  // Initialize SSE (Server Sent Events)
  let responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();
  const cacheFolder = "./cache";
  let closed = false;

  const x = request.body

  
  
  // Will copy-paste elements here to the actual workflow
  const everything = async () => {
    
    
    
    
    // Tell the front end to start sending files
    const documentName = `Document-${Date.now()}`;                            // This has to be the name of the document
    const imageName = `Image-${Date.now()}`;                                  // This has to be the name of the image
    writer.write(encoder.encode("data: " + JSON.stringify({
      startFileUpload: true,
      documentName,
      imageName
    }) + "\n\n"));
    
  
    await waitForFile(cacheFolder, documentName + ".done");
    await waitForFile(cacheFolder, imageName + ".done");




    writer.write(encoder.encode("data: " + JSON.stringify({
      done: true,
      message: "This connection can be closed."
    }) + "\n\n"));
    writer.write(encoder.encode("data: " + JSON.stringify({fieldA: "32", fieldB: "42"}) + "\n\n"));


    //writer.write(encoder.encode("data: " + JSON.stringify({error: "Error message (200)"}) + "\n\n"));
    writer.close();
    closed = true;
    console.log("close")
  }
  everything();




  console.log("Return");
  // Return response connected to readable
  return new Response(responseStream.readable, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "text/event-stream; charset=utf-8",
      Connection: "keep-alive",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      "Content-Encoding": "none",
    },
  });
}


async function waitForFile(folderPath: string, fileName: string) {
  return new Promise<void>((resolve) => {
    const filePath = `${folderPath}/${fileName}`;
    const interval = setInterval(() => {
      if (fs.existsSync(filePath)) {
        clearInterval(interval);
        console.log(`File ${fileName} found!`);
        resolve();
      } else {
        console.log(`File ${fileName} not found yet. Waiting...`);
      }
    }, 1000); // Check every 1 second
  });
}

/*
export const config = {
  runtime: "edge",
};*/