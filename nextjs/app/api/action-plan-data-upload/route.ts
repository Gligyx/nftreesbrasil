import { NextRequest, NextResponse } from "next/server";
import fs from 'fs';


export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const cacheFolder = "./cache/";
    console.log(formData);
  
    const title = formData.get('title');                    // Mandatory
    const description = formData.get('description');        // Mandatory
    const documents = formData.get('documents');            // Might or might not exist
    const images = formData.get('images');                  // Might or might not exist
  
    if (!documents) {
      fs.writeFileSync(cacheFolder + formData.get('documentName') + ".done", Date.now().toString());    // We signal to create-action-plan that we are done
      console.log("There are no documents attached for this ActionPlan.");
    } else {
      const documentFile: File = documents as File;
      const filePath = `${cacheFolder}${documentFile.name}`;
      const buffer = await documentFile.arrayBuffer();
      
      fs.writeFile(filePath, new DataView(buffer), () => {
        fs.writeFileSync(cacheFolder + documentFile.name + ".done", Date.now().toString());             // We signal to create-action-plan that we are done
        console.log('Document upload done.');
      })
    }

    if (!images) {
      fs.writeFileSync(cacheFolder + formData.get('imageName') + ".done", Date.now().toString());       // We signal to create-action-plan that we are done
      console.log("There are no images attached for this ActionPlan");
    } else {
      const imageFile: File = images as File;
      const filePath = `${cacheFolder}${imageFile.name}`;
      const buffer = await imageFile.arrayBuffer();
      
      const writeStream = fs.createWriteStream(filePath);

      fs.writeFile(filePath, new DataView(buffer), () => {
        fs.writeFileSync(cacheFolder + imageFile.name + ".done", Date.now().toString());                // We signal to create-action-plan that we are done
        console.log("Image upload done.");
      });
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