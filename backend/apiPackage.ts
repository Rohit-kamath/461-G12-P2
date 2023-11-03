//has all packages functions needed for backend API
import * as apiSchema from './apiSchema';
import { Request, Response } from 'express';
import * as prismaCalls from './prismaCalls';
import * as prismaSchema from '@prisma/client';
import JSZip from 'jszip';
import { v4 as uuidv4 } from 'uuid';
import AWS from 'aws-sdk';
import { ManagedUpload } from 'aws-sdk/clients/s3';
import createModuleLogger from '../src/logger';

const logger = createModuleLogger('API Package Calls');

const s3 = new AWS.S3({
  accessKeyId:  process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'us-east-2'
});

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

export async function extractFileFromZip(zipBuffer: Buffer, filename: string): Promise<string> {
  const zip = await JSZip.loadAsync(zipBuffer);
  let file = zip.file(filename);
  
  // If the specific file is not found, search for any matching files in the ZIP.
  if (!file) {
    const files = zip.file(new RegExp(`^.*${filename}$`)); // This will return an array of matching files.
    if (files.length > 0) {
      file = files[0]; // Use the first match.
    }
  }
  
  if (!file) {
    logger.info(`${filename} not found inside the zip.`)
    throw new Error(`${filename} not found inside the zip.`);
  }
  
  // Extract and return the file content as a string
  return file.async('string');
}

export async function extractMetadataFromZip(filebuffer: Buffer): Promise<apiSchema.PackageMetadata> {
  try {
    const packageContent = await extractFileFromZip(filebuffer, "package.json");
    const packageJson = JSON.parse(packageContent);

    return {
      Name: packageJson.name,
      Version: packageJson.version,
      ID: uuidv4(),
    };
  } catch (error) {
    logger.info('An error occurred while extracting metadata from zip:', error);
    throw error;
  }
}

export async function uploadToS3(fileName: string, fileBuffer: Buffer): Promise<ManagedUpload.SendData> {
  return new Promise((resolve, reject) => {
      const bucketName = process.env.AWS_S3_BUCKET_NAME;

      if (!bucketName) {
          throw new Error("S3 bucket name not configured.");
      }

      const params: AWS.S3.Types.PutObjectRequest = {
          Bucket: bucketName,
          Key: fileName,
          Body: fileBuffer
      };

      // Uploading files to the bucket
      s3.upload(params, function(err: Error, data: ManagedUpload.SendData) {
          if (err) {
              reject(err);
          } else {
              resolve(data);
          }
      });
  });
}