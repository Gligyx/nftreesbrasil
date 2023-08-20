export const dynamic = 'force-dynamic' 
import { NextRequest, NextResponse } from "next/server";
const { createHash } = require('crypto');
import fs from 'fs';
import conn from "@/app/_lib/db";
import { createProjectId } from "@/app/_lib/actionPlanTools";


export async function POST(request: NextRequest) {
  try {
    if (!conn) throw "Couldn't connect to database";                  // Check if database connection object exists

    const formData = await request.formData();
    if (!process.env.CACHE_FOLDER) throw "No cache folder specified! Check .env!";
    const cacheFolder = process.env.CACHE_FOLDER;
  
    const title = formData.get('title') as string;                                // Mandatory
    const description = formData.get('description') as string;                    // Mandatory
    const address = formData.get('owner') as EthAddress;                          // Mandatory
    const origProjectId = formData.get('project-id') as ProjectId | undefined;    // Might or might not exist
    const documents = formData.get('documents');                                  // Might or might not exist
    const images = formData.get('images');                                        // Might or might not exist

    const projectObject: InitProjectObject = {                                    // Information that will be saved to Document-[timestamp].done
      projectId: origProjectId || null,
      title,
      description,
      address,
      timestamp: Date.now(),
      documentCount: documents? 1 : 0,                                            // We can't upload multiple files yet
      imageCount: images? 1 : 0
    }
  
    // Process Document(s) (currently we can only take 1 document)
    if (!documents) {
      fs.writeFileSync(cacheFolder + formData.get('documentName') + ".done", JSON.stringify(projectObject));    // We signal to main that we are done
      console.log("There are no documents attached for this ActionPlan.");
    } else {
      uploadFile(documents, projectObject);
    }

    // Process Image(s) (currently we can only take 1 image)
    if (!images) {
      fs.writeFileSync(cacheFolder + formData.get('imageName') + ".done", Date.now().toString());               // We signal to main that we are done
      console.log("There are no images attached for this ActionPlan");
    } else {
      uploadFile(images, projectObject);
    }

    // Create ProjectId
    const projectId: ProjectId =  origProjectId || createProjectId(projectObject);

    // Create database entry
    if (!origProjectId) {
      const saveProjectQuery = `INSERT INTO projects (project_id, project_name, project_owner) VALUES ('${projectId}', '${title}', '${address}')`
      const saveResult = await conn.query(saveProjectQuery);
      if (saveResult.rowCount !== 1) throw "Error while saving project info to database!";
    }

    
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

async function uploadFile(formElement: FormDataEntryValue, projectObject: InitProjectObject) {
  const file: File = formElement as File;
  const filePath = `${process.env.CACHE_FOLDER}${file.name}`;
  const buffer = await file.arrayBuffer();
  
  fs.writeFile(filePath, new DataView(buffer), () => {
    fs.writeFileSync(process.env.CACHE_FOLDER + file.name + ".done", JSON.stringify(projectObject));             // We signal to main that we are done
  });
}