export const dynamic = 'force-dynamic' 
import { chainName, fgStorage } from "@/app/_lib/co2Conn";
import { NextRequest, NextResponse } from "next/server";
 

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    let creator = "0xed159df6717cfa27cfcac26f9efc2d7980debd49";
    if (!id) throw "No id specified";
    if (!creator) throw "No ProjectOwner specified";
    console.log("Starting get-action-plan...");

    const searchResponse = await fgStorage.search(chainName, null, null, null, null, id, null, null, null, null, creator);
    if (searchResponse.error) throw searchResponse.error;

    const assetResponse = await fgStorage.getAsset(searchResponse.result[0].cid);
    if (assetResponse.error) throw assetResponse.error;
    console.log("Asset found: ", assetResponse.result);

    const resultObj: any = {};
    assetResponse.result.asset.map((line: object) => {
      const name = Object.keys(line)[0];
      const value = (line as any)[name];
      resultObj[name] = value;
    })

    return NextResponse.json({
      assetCID: assetResponse.result.block,
      asset: resultObj as ActionPlan
    });
    
  } catch (error) {
    console.error("There was an error while getting ActionPlan asset from CO2.Storage: ", error);
    return NextResponse.json(error);
  }
}