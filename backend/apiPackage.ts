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