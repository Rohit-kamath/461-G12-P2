//has all packages functions needed for backend API
import * as apiSchema from './apiSchema';
import { Request, Response } from 'express';
import * as prismaCalls from './prismaCalls';
import * as prismaSchema from '@prisma/client';

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

// Packagedownloadresponsetype
export type PackageDownloadResponseType = {
  metadata: apiSchema.PackageMetadata;
  data: apiSchema.PackageData;
};

// For: get package download
export async function getPackageDownload(req: Request, res: Response) {
  try {
      if (req.query?.name === undefined) {
          return res.status(400).send(`Error in getPackageDownload: Package name is undefined`);
      }
      if (req.query?.version === undefined) {
          return res.status(400).send(`Error in getPackageDownload: Package version is undefined`);
      }

      const packageName = req.query.name as string;
      const packageVersion = req.query.version as string;

      const dbPackage = await prismaCalls.getPackageWithMetadataAndData(packageName, packageVersion);

      if (!dbPackage || !dbPackage.data || !dbPackage.metadata) {
          return res.status(404).send(`Error in getPackageDownload: Package not found`);
      }

      const apiPackageData: apiSchema.PackageData = {
          Content: dbPackage.data.content,
          URL: dbPackage.data.URL,
          JSProgram: dbPackage.data.JSProgram,
      };

      const apiPackageMetadata: apiSchema.PackageMetadata = {
          Name: dbPackage.metadata.name,
          Version: dbPackage.metadata.version,
          ID: dbPackage.metadata.id,
      };

      return res.status(200).json({ metadata: apiPackageMetadata, data: apiPackageData });
  } catch (error) {
      return res.status(500).send(`Error in getPackageDownload: ${error}`);
  }
}

// Packagedownloadresponsetype
export type PackageUpdateRequestType = {
  name: string;
  version: string;
  content: string;
  URL: string;
  JSProgram: string;
};
// For: put package update
export async function updatePackage(req: Request, res: Response) {
  try {
      const { name, version, content, URL, JSProgram } = req.body;

      if (!name || !version || !content || !URL || !JSProgram) {
          return res.status(400).send('All fields are required');
      }

      // Add more detailed validation if needed

      const updatedPackage = await prismaCalls.updatePackageDetails(name, version, content, URL, JSProgram);

      if (!updatedPackage) {
          return res.status(404).send('Package not found or could not be updated');
      }

      return res.status(200).json(updatedPackage);
  } catch (error) {
      return res.status(500).send(`Error in updatePackage: ${error}`);
  }
}