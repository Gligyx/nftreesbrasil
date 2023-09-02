import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    

    return NextResponse.json({
      success: isSuccess
    })

  } catch (error) {
    console.error("There was an error in the /buy-hypercert route: ", error);
    return NextResponse.json({
      error
    },
    {
      status: 500
    })
  }
}