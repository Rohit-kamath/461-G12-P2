//has all packages functions needed for backend API
import * as apiSchema from './apiSchema';
import { Request, Response } from 'express';
import * as prismOperations from './prismaOperations';
export async function getPackageMetaData(req : Request, res : Response){
  try{
    //later will have to split version along \n. For now, just act like there's no \n character and it's only single query with exact version
    //also pretend that it's just a string like "1.2.3" instead of "exact (1.2.3) for now. Later, we can parse the string to get the version range"
    if(req.query?.name === undefined){
      return res.status(400).send(`Error in getPackageMetaData: Name is undefined`);
    }
    if(req.query?.version === undefined){
      return res.status(400).send(`Error in getPackageMetaData: Version is undefined`);
    }

    const queryName = req.query.name as string;
    const minVersion = req.query.version as string;
    const maxVersion = req.query.version as string;
    const packageMetaData : apiSchema.PackageMetadata[] | null = await prismOperations.dbGetPackage(queryName, minVersion, maxVersion);
    if(packageMetaData === null){
      return res.status(500).send(`Error in getPackageMetaData: packageMetaData is null`);
    }
    return res.status(200).json(packageMetaData);
  }catch(error){
    console.log(`Error in getPackageMetaData: ${error}`);
    return res.status(500).send(`Error in getPackageMetaData: ${error}`);
  }
}