//has all packages functions needed for backend API
import * as apiSchema from './apiSchema';
import { Request, Response } from 'express';
import * as prismOperations from './prismaOperations';
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

export type PackageDownloadResponseType = {
  metadata: apiSchema.PackageMetadata;
  data: apiSchema.PackageData;
};

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

      const dbPackage: { metadata: prismaSchema.PackageMetadata, data: prismaSchema.PackageData } | null = await prismOperations.dbGetPackageByNameAndVersion(packageName, packageVersion);

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

      // can combine
      return res.status(200).json({ metadata: apiPackageMetadata, data: apiPackageData });
  } catch (error) {
      return res.status(500).send(`Error in getPackageDownload: ${error}`);
  }
}