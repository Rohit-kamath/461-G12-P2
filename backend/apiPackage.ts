//has all packages functions needed for backend API
import * as apiSchema from './apiSchema';
import { Request, Response } from 'express';
import * as prismOperations from './prismaOperations';
import * as prismaSchema from '@prisma/client';

export async function getPackageHistory(req : Request, res : Response){
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
  
    const dbPackageMetaData : prismaSchema.PackageMetadata[] | null = await prismOperations.dbGetPackageMetaDataArray(queryName, minVersion, maxVersion);
    if(dbPackageMetaData === null){
      return res.status(500).send(`Error in getPackageMetaData: packageMetaData is null`);
    }
    const apiPackageMetaData : apiSchema.PackageMetadata[] = dbPackageMetaData.map((dbPackageMetaData : prismaSchema.PackageMetadata) => {
      const apiPackageMetaData : apiSchema.PackageMetadata = {
        Name: dbPackageMetaData.name,
        Version: dbPackageMetaData.version,
        ID: dbPackageMetaData.id
      };
      return apiPackageMetaData;
    });
    return res.status(200).json(apiPackageMetaData);
  }catch(error){
    return res.status(500).send(`Error in getPackageMetaData: ${error}`);
  }
}