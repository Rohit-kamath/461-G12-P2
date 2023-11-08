import * as apiSchema from './apiSchema';
import { Request, Response } from 'express';
import * as prismaCalls from './prismaCalls';
import * as prismaSchema from '@prisma/client';
import JSZip from 'jszip';
import { v4 as uuidv4 } from 'uuid';
import AWS from 'aws-sdk';
import { ManagedUpload } from 'aws-sdk/clients/s3';
import createModuleLogger from '../src/logger';
import { NET_SCORE } from '../src/controllers/netScore';
import semver from 'semver';
import { Action } from '@prisma/client';

const logger = createModuleLogger('API Package Calls');

const s3 = new AWS.S3({
  accessKeyId:  process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'us-east-2'
});


function getMaxVersion(versionRange: string) {
  versionRange = versionRange.replace(/-0/g, '');
  const versions = versionRange.match(/\d+\.\d+\.\d+/g);
  if (versions && versions.length > 0) {
      return versions[versions.length - 1];
  } else {
      console.log('Error in getMaxVersion: No versions found in range');
      process.exit(1);
  }
}


export function parseVersion(version: string) {
  const comparators = semver.toComparators(version);
  const validRange = comparators.map((comparatorSet) => comparatorSet.join(' ')).join(' || ');
  const minVersion = semver.minVersion(validRange)?.version;
  if (minVersion === null) {
      console.log('Error in parseVersion: minVersion is null');
      process.exit(1);
  }
  if (minVersion === undefined) {
      console.log('Error in parseVersion: minVersion is undefined');
      process.exit(1);
  }
  const maxVersion = getMaxVersion(validRange);
  if (!validRange.includes(' ')) {
      return { min: minVersion, max: maxVersion, minInclusive: true, maxInclusive: true };
  }
  const tokens = validRange.split(/\s+/);
  return {
      min: minVersion,
      max: maxVersion,
      minInclusive: tokens[0].startsWith('>='),
      maxInclusive: tokens[1].startsWith('<='),
  };
}


export async function getPackages(req: Request, res: Response) {
  try {
      const offset = req.query?.offset === undefined ? 1 : parseInt(req.query.offset as string);
      if (req.body?.Name === undefined) {
          return res.status(400).send(`Error in getPackageMetaData: Name is undefined`);
      }
      if (req.body?.Version === undefined) {
          return res.status(400).send(`Error in getPackageMetaData: Version is undefined`);
      }

      const queryName = req.body.name as string;
      //use parseVersion function to get min and max version, and whether they are inclusive
      const { min: minVersion, max: maxVersion, minInclusive: minInclusive, maxInclusive: maxInclusive } = parseVersion(req.body.Version as string);

      const dbPackageMetaData = await prismaCalls.getMetaDataByQuery(queryName, minVersion, maxVersion, minInclusive, maxInclusive, offset);
      if (dbPackageMetaData === null) {
          return res.status(500).send(`Error in getPackageMetaData: packageMetaData is null`);
      }
      const apiPackageMetaData: apiSchema.PackageMetadata[] = dbPackageMetaData.map((dbPackageMetaData: prismaSchema.PackageMetadata) => {
          const metaData: apiSchema.PackageMetadata = {
              Name: dbPackageMetaData.name,
              Version: dbPackageMetaData.version,
              ID: dbPackageMetaData.id,
          };
          return metaData;
      });
      res.setHeader('offset', offset);
      return res.status(200).json(apiPackageMetaData);
  } catch (error) {
      return res.status(500).send(`Error in getPackageMetaData: ${error}`);
  }
}


export async function getPackagesByName(req: Request, res: Response) {
  try {
      if (req.params?.name === undefined) {
          return res.status(400).send(`Error in getPackagesByName: Name is undefined`);
      }
      const queryName = req.params.name;
      const dbPackageHistories = await prismaCalls.getPackageHistories(queryName);
      if (dbPackageHistories === null) {
          return res.status(500).send(`Error in getPackagesByName: dbPackageHistories is null`);
      }
      const apiPackageHistories: apiSchema.PackageHistoryEntry[] | null = dbPackageHistories.map((dbPackageHistory) => {
          const historyEntry: apiSchema.PackageHistoryEntry = {
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
  } catch (error) {
      return res.status(500).send(`Error in getPackagesByName: ${error}`);
  }
}


export async function getPackagesByRegEx(req: Request, res: Response) {
  try {
      if (req.body?.RegEx === undefined) {
          return res.status(400).send(`Error in getPackagesByRegEx: RegEx is undefined`);
      }
      const regEx: string = req.body.RegEx;
      const dbPackageMetaData = await prismaCalls.getMetaDataByRegEx(regEx);
      if (dbPackageMetaData === null) {
          return res.status(500).send(`Error in getPackagesByRegEx: dbPackageMetaData is null`);
      }
      const apiPackageMetaData: apiSchema.PackageMetadata[] = dbPackageMetaData.map((dbPackageMetaData: prismaSchema.PackageMetadata) => {
          const metaData: apiSchema.PackageMetadata = {
              Name: dbPackageMetaData.name,
              Version: dbPackageMetaData.version,
              ID: dbPackageMetaData.id,
          };
          return metaData;
      });
      return res.status(200).json(apiPackageMetaData);
  } catch (error) {
      return res.status(500).send(`Error in getPackagesByRegEx: ${error}`);
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


export async function getGithubUrlFromZip(zipBuffer: Buffer): Promise<string> {
  try {
    if (!zipBuffer || zipBuffer.length === 0) {
      throw new Error('Empty or invalid zip buffer provided');
    }

    const packageJsonString = await extractFileFromZip(zipBuffer, 'package.json');
    if (!packageJsonString) {
      throw new Error('package.json not found or empty in the zip file');
    }

    logger.info(`Extracted package.json content: ${packageJsonString}`);

    let packageJson;
    try {
      packageJson = JSON.parse(packageJsonString);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error('Failed to parse package.json: ' + error.message);
      } else {
        throw new Error('Failed to parse package.json: Unknown error occurred');
      }
    }

    let url = packageJson.repository?.url || packageJson.repository;

    if (!url || typeof url !== 'string') {
      throw new Error('GitHub repository URL not found in package.json');
    }

    if (url.startsWith('github:')) {
      url = `https://github.com/${url.substring(7)}`;
    }

    if (url.startsWith('git@github.com:')) {
      url = `https://github.com/${url.substring(15)}`;
    }

    url = url.replace(/\.git$/, '');

    logger.info(`GitHub URL extracted: ${url}`);
    return url;
  } catch (error) {
    logger.info(`An error occurred while extracting the GitHub URL: ${error}`);
    throw error;
  }
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


export async function calculateGithubMetrics(owner: string, repo: string): Promise<apiSchema.PackageRating> {
  try {
      const netScoreCalculator = new NET_SCORE(owner, repo);
      const metrics = await netScoreCalculator.calculate();

      return {
          BusFactor: metrics.BUS_FACTOR_SCORE,
          Correctness: metrics.CORRECTNESS_SCORE,
          RampUp: metrics.RAMP_UP_SCORE,
          ResponsiveMaintainer: metrics.RESPONSIVE_MAINTAINER_SCORE,
          LicenseScore: metrics.LICENSE_SCORE,
          GoodPinningPractice: metrics.GOOD_PINNING_PRACTICE_SCORE,
          PullRequest: metrics.PULL_REQUEST_SCORE,
          NetScore: metrics.NET_SCORE,
      };
  } catch (error) {
      logger.info(`Failed to calculate metrics: ${error}`);
      throw error;
  }
}


export async function storeGithubMetrics(metadataId: string, packageRating: apiSchema.PackageRating): Promise<void> {
  try {
      await prismaCalls.storeMetricsInDatabase(metadataId, packageRating);
      logger.info('Package rating metrics stored in the database successfully.');
  } catch (error) {
      logger.info(`Error in storeGithubMetrics: ${error}`);
      throw error;
  }
}


export function parseGitHubUrl(url: string): { owner: string, repo: string } | null {
  // Regular expression to extract the owner and repo name from various GitHub URL formats
  const regex = /github\.com[/:]([^/]+)\/([^/.]+)(\.git)?/;
  const match = url.match(regex);
  
  if (match && match[1] && match[2]) {
      return {
          owner: match[1],
          repo: match[2].replace('.git', '')
      };
  } else {
      console.info('Invalid GitHub URL provided:', url);
      return null;
  }
}

export function isPackageIngestible(metrics: apiSchema.PackageRating): boolean {
  return (
      metrics.BusFactor >= 0.5 &&
      // metrics.Correctness >= 0.5 && (until correctness is fixed)
      metrics.RampUp >= 0.5 &&
      metrics.ResponsiveMaintainer >= 0.5 &&
      metrics.LicenseScore >= 0.5 &&
      // metrics.GoodPinningPractice >= 0.5 && spec says to only include phase 1 metrics (I think)
      // metrics.PullRequest >= 0.5
      metrics.NetScore >= 0.5
  );
}


export async function uploadPackage(req: Request, res: Response) {
  try {
      if (!req.file) {
          logger.info("No file provided in the upload.");
          return res.status(400).send('No file uploaded');
      }

      const metadata = await extractMetadataFromZip(req.file.buffer);

      const url = await getGithubUrlFromZip(req.file.buffer);
      const githubInfo = parseGitHubUrl(url);
      if (!githubInfo) {
          logger.info("Invalid GitHub repository URL.");
          return res.status(400).send('Invalid GitHub repository URL.');
      }

      const encodedContent = req.file.buffer.toString('base64');
      const jsProgram = "if (process.argv.length === 7) {\nconsole.log('Success')\nprocess.exit(0)\n} else {\nconsole.log('Failed')\nprocess.exit(1)\n}\n";
      const PackageData: apiSchema.PackageData = {
          Content: encodedContent,
          JSProgram: jsProgram
      };


      const packageExists = await prismaCalls.checkPackageExists(metadata.Name, metadata.Version);
      if (packageExists) {
          logger.info("Package exists already.");
          return res.status(409).send('Package Exists Already');
      }
      await prismaCalls.uploadMetadataToDatabase(metadata);

      const Package: apiSchema.Package = {
          metadata: metadata,
          data: PackageData
      };

      const action = Action.CREATE;
      await prismaCalls.createPackageHistoryEntry(metadata.ID, 1, action); // User id is 1 for now

      const metrics = await calculateGithubMetrics(githubInfo.owner, githubInfo.repo);

      if (!isPackageIngestible(metrics)) {
        logger.info("Package is not uploaded due to the disqualified rating.");
        return res.status(424).send('Package is not uploaded due to the disqualified rating');
      }
      
      await storeGithubMetrics(metadata.ID, metrics);

      await uploadToS3(req.file.originalname, req.file.buffer);

      res.json(Package);
  } catch (error) {
      logger.error("Error in POST /package: ", error);
      res.status(500).send("Internal Server Error");
  }
}


// For: get package download
export async function getPackageDownload(req: Request, res: Response) {
	try {
		const packageID = req.query.name;

		if (packageID === undefined) {
			return res.status(400).send('Package name or version is undefined');
		}
		const dbPackage = await prismaCalls.getPackage(packageID as string);
		if (dbPackage === null) {
			return res.status(404).send('Package not found');
		}
        
		const apiPackage: apiSchema.Package = {
			metadata: {
				Name: dbPackage.metadata.name,
				Version: dbPackage.metadata.version,
				ID: dbPackage.metadata.id,
			},
			data: {
				Content: dbPackage.data.content,
				URL: dbPackage.data.URL,
				JSProgram: dbPackage.data.JSProgram,
			},
		};
		return res.status(200).json(apiPackage);
	} catch (error) {
		return res.status(500).send(`Error in getPackageDownload: ${error}`);
	}
}


// For: put package update
export async function updatePackage(req: Request, res: Response) {
	try {
		// Validate required package fields from the request body
		const { metadata, data } = req.body as apiSchema.Package;

		// Validate required fields
		if (!metadata || !data || !metadata.Name || !metadata.Version || !metadata.ID) {
			return res.status(400).send('All fields are required and must be valid.');
		}

		const packageId = req.params.id;
		if (!packageId) {
			return res.status(400).send('Package ID is required.');
		}

		if (packageId !== metadata.ID) {
			return res.status(400).send('Package ID in the URL does not match the ID in the request body.');
		}

		//update the package data only
		try {
			const updatedData = await prismaCalls.updatePackageDetails(packageId, data);
			return res.status(200).json({ Data: updatedData });
		} catch (error) {
			if (error instanceof Error) {
				if (error.message.includes('do not match')) {
					return res.status(400).send('Package ID, name, or version do not match.');
				}
				return res.status(404).send('Package does not exist.');
			}
		}
	} catch (error) {
		console.error(`Error in updatePackage: ${error}`);
		return res.status(500).send(`Server error: ${error}`);
	}
}
