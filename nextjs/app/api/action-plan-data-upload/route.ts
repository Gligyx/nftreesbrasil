import { NextRequest, NextResponse } from "next/server";
const { createHash } = require('crypto')
import fs from 'fs';
import conn from "@/app/_lib/db";


export async function POST(request: NextRequest) {
  try {
    if (!conn) throw "Couldn't connect to database";                  // Check if database connection object exists

    const formData = await request.formData();
    const cacheFolder = "./cache/";
    console.log(formData);
  
    const title = formData.get('title') as string;                    // Mandatory
    const description = formData.get('description') as string;        // Mandatory
    const address = formData.get('owner') as EthAddress;              // Mandatory
    const documents = formData.get('documents');                      // Might or might not exist
    const images = formData.get('images');                            // Might or might not exist

    const projectObject = {                                           // Information that will be saved to Document-[timestamp].done
      title,
      description,
      address,
      timestamp: Date.now()
    }
  
    // Process Document(s) (currently we can only take 1 document)
    if (!documents) {
      fs.writeFileSync(cacheFolder + formData.get('documentName') + ".done", JSON.stringify(projectObject));    // We signal to create-action-plan that we are done
      console.log("There are no documents attached for this ActionPlan.");
    } else {
      const documentFile: File = documents as File;
      const filePath = `${cacheFolder}${documentFile.name}`;
      const buffer = await documentFile.arrayBuffer();
      
      fs.writeFile(filePath, new DataView(buffer), () => {
        fs.writeFileSync(cacheFolder + documentFile.name + ".done", JSON.stringify(projectObject));             // We signal to create-action-plan that we are done
        console.log('Document upload done.');
      })
    }

    // Process Image(s) (currently we can only take 1 image)
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

    // Create ProjectId
    const sha256Hex: string = createHash('sha256').update(JSON.stringify(projectObject)).digest('hex');
    console.log("sha256Hex: ", sha256Hex);
    const projectId = sha256Hex.slice(sha256Hex.length-12, sha256Hex.length);
    console.log("ProjectId: ", `Project-${projectId}`);

    // Create database entry
    const saveProjectQuery = `INSERT INTO projects (project_id, project_name, project_owner) VALUES ('${projectId}', '${title}', '${address}')`
    const saveResult = await conn.query(saveProjectQuery);
    if (saveResult.rowCount !== 1) throw "Error while saving project info to database!";

    
    return NextResponse.json({
      success: true,
      message: "Data upload started"
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