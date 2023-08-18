import { NextRequest, NextResponse } from "next/server";
import fs from 'fs';


export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const cacheFolder = "./cache/";
    console.log(formData);
  
    const title = formData.get('title');
    const description = formData.get('description');
    const documents = formData.get('documents');
    const images = formData.get('images');
  
    if (!documents) {
      fs.writeFileSync(cacheFolder + formData.get('documentName') + ".done", Date.now().toString());
      console.log("There are no documents attached for this ActionPlan.");
    }
    if (!images) {
      fs.writeFileSync(cacheFolder + formData.get('imageName') + ".done", Date.now().toString());
      console.log("There are no images attached for this ActionPlan");
    }
    
    return NextResponse.json({
      success: true,
      message: "Data uploaded"
    })

  } catch (error) {
    console.error("Error in ActionPlan data upload: ", error);
    return NextResponse.json({
      error: error
    }, {
      status: 500
    })
  }
}