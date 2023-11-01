//has all packages functions needed for backend API
import * as apiSchema from './apiSchema';
import { Request, Response } from 'express';
import * as prismaCalls from './prismaCalls';
import * as prismaSchema from '@prisma/client';
import JSZip from 'jszip';
import { v4 as uuidv4 } from 'uuid';

export async function getPackages(req : Request, res : Response){
  try{
    //later will have to split version along \n. For now, just act like there's no \n character and it's only single query with exact version
    //also pretend that it's just a string like "1.2.3" instead of "exact (1.2.3) for now. Later, we can parse the string to get the version range"
    if(req.query?.Name === undefined){
      return res.status(400).send(`Error in getPackageMetaData: Name is undefined`);
    }
    if(req.query?.Version === undefined){
      return res.status(400).send(`Error in getPackageMetaData: Version is undefined`);
    }

    const queryName = req.query.name as string;
    const minVersion = req.query.version as string;
    const maxVersion = req.query.version as string;
  
    const dbPackageMetaData = await prismaCalls.getMetaDataArray(queryName, minVersion, maxVersion);
    if(dbPackageMetaData === null){
      return res.status(500).send(`Error in getPackageMetaData: packageMetaData is null`);
    }
    const apiPackageMetaData : apiSchema.PackageMetadata[] = dbPackageMetaData.map((dbPackageMetaData : prismaSchema.PackageMetadata) => {
      const metaData : apiSchema.PackageMetadata = {
        Name: dbPackageMetaData.name,
        Version: dbPackageMetaData.version,
        ID: dbPackageMetaData.id
      };
      return metaData;
    });
    return res.status(200).json(apiPackageMetaData);
  }catch(error){
    return res.status(500).send(`Error in getPackageMetaData: ${error}`);
  }
}

export async function getPackagesByName(req : Request, res: Response){
  try{
    if(req.params?.name === undefined){
      return res.status(400).send(`Error in getPackagesByName: Name is undefined`);
    }
    const queryName = req.params.name;
    const dbPackageHistories = await prismaCalls.getPackageHistories(queryName);
    if(dbPackageHistories === null){
      return res.status(500).send(`Error in getPackagesByName: dbPackageHistories is null`);
    }
    const apiPackageHistories: apiSchema.PackageHistoryEntry[] | null = dbPackageHistories.map((dbPackageHistory) => {
      const historyEntry : apiSchema.PackageHistoryEntry = {
        User: {
          name: dbPackageHistory.user.name,
          isAdmin: dbPackageHistory.user.isAdmin,
        },
        Date: dbPackageHistory.date.toISOString(),
        PackageMetadata: {
          Name: dbPackageHistory.metadata.name,
          Version: dbPackageHistory.metadata.version,
          ID: dbPackageHistory.metadata.id,
        },
        Action: dbPackageHistory.action,
      };
      return historyEntry;
    });
    return res.status(200).json(apiPackageHistories);
  }catch(error){
    return res.status(500).send(`Error in getPackagesByName: ${error}`);
  }
}

export async function extractMetadataFromZip(filebuffer: Buffer): Promise<apiSchema.PackageMetadata> {
  const zip = await JSZip.loadAsync(filebuffer);
  
  let packageFile = zip.file("package.json");
  
  // If the top-level package.json is not found, search for any package.json in the ZIP.
  if (!packageFile) {
    const files = zip.file(/^.*package.json$/);  // This will return an array of matching files.
    if (files.length > 0) {
      packageFile = files[0];  // Use the first match.
    }
  }
  
  if (!packageFile) {
    throw new Error("package.json not found inside the zip.");
  }

  const packageContent = await packageFile.async('string');
  const packageJson = JSON.parse(packageContent);

  return {
    Name: packageJson.name,
    Version: packageJson.version,
    ID: uuidv4(),
  }
}
