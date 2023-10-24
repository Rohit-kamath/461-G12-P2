//has all packages functions needed for backend API
import * as apiSchema from './apiSchema';
import { Request, Response } from 'express';
import * as prismOperations from './prismaOperations';
export async function getPackageMetaData(req : Request, res : Response){
  try{
    const packageQuery : apiSchema.PackageQuery = {
      Name: req.query.name as string,
      Version: req.query.Version as string
    }
    //later will have to split version along \n. For now, just act like there's no \n character and it's only single query with exact version
    const minVersion : string = packageQuery.Version;
    const maxVersion : string = packageQuery.Version;
    const packageMetaData : apiSchema.PackageMetadata[] | null = await prismOperations.dbGetPackage(packageQuery.Name, minVersion, maxVersion);
    if(packageMetaData === null){
      res.status(500).send(`Error in getPackageMetaData: packageMetaData is null`);
    }
    res.status(200).json(packageMetaData);
  }catch(error){
    console.log(`Error in getPackageMetaData: ${error}`);
    res.status(500).send(`Error in getPackageMetaData: ${error}`);
  }
}