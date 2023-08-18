import conn from "@/app/_lib/db";
import { write } from "fs";
import { NextApiRequest, NextApiResponse } from "next";
import { NextRequest, NextResponse } from "next/server";


export async function GET(request: NextRequest) {
  // Initialize SSE (Server Sent Events)
  let responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();
  let closed = false;


  // Will copy-paste elements here to the actual workflow
  const long = async () => {
    writer.write(encoder.encode("data: " + JSON.stringify({message: "Custom message."}) + "\n\n"));
    writer.write(encoder.encode("data: " + JSON.stringify({fieldA: "32", fieldB: "42"}) + "\n\n"));
    writer.write(encoder.encode("data: " + JSON.stringify({error: "Error message (200)"}) + "\n\n"));
    writer.close();
    closed = true;
    console.log("close")
  }
  long();




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