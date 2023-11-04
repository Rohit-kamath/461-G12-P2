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
    const packageJsonString = await extractFileFromZip(zipBuffer, 'package.json');
    const packageJson = JSON.parse(packageJsonString);

    // Look for the repository field in the package.json content
    if (packageJson.repository && packageJson.repository.url) {
      let url = packageJson.repository.url;
      url = url.replace(/\.git$/, '');

      logger.info(`GitHub URL extracted: ${url}`);
      return url;
    } else {
      throw new Error('GitHub repository URL not found in package.json');
    }
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

export async function calculateAndStoreGithubMetrics(owner: string, repo: string): Promise<void> {
  try {
      const netScoreCalculator = new NET_SCORE(owner, repo);
      const {
          NET_SCORE: netScoreValue,
          RAMP_UP_SCORE,
          CORRECTNESS_SCORE,
          BUS_FACTOR_SCORE,
          RESPONSIVE_MAINTAINER_SCORE,
          LICENSE_SCORE,
          GOOD_PINNING_PRACTICE_SCORE,
          PULL_REQUEST_SCORE,
      } = await netScoreCalculator.calculate();

      await prismaCalls.storeMetricsInDatabase({
          BusFactor: BUS_FACTOR_SCORE,
          Correctness: CORRECTNESS_SCORE,
          RampUp: RAMP_UP_SCORE,
          ResponsiveMaintainer: RESPONSIVE_MAINTAINER_SCORE,
          LicenseScore: LICENSE_SCORE,
          GoodPinningPractice: GOOD_PINNING_PRACTICE_SCORE, 
          PullRequest: PULL_REQUEST_SCORE,
          NetScore: netScoreValue,
      });

      console.log('Metrics for the GitHub repository stored successfully.');
  } catch (error) {
      console.error(`Failed to calculate or store metrics: ${error}`);
      throw error; // Rethrow the error if you need to handle it further up the chain
  }
}

export function parseGitHubUrl(url: string): { owner: string, repo: string } | null {
  // Regular expression to extract the owner and repo name from a GitHub URL
  const regex = /github\.com[/:]([^/]+)\/([^.]+)(\.git)?/;
  const match = url.match(regex);
  
  if (match && match[1] && match[2]) {
  return {
      owner: match[1],
      repo: match[2],
  };
  } else {
      console.info('Invalid GitHub URL provided:', url);
      return null;
  }
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
    const { owner, repo } = githubInfo;
    const action = Action.CREATE;
    await prismaCalls.uploadMetadataToDatabase(metadata);

    const exists = await prismaCalls.checkPackageHistoryExists(metadata.ID);
    if (exists) {
        return res.status(409).send('Package Exists Already');
    }
    
    await prismaCalls.createPackageHistoryEntry(metadata.ID, 1, action); // User id is 1 for now
    await calculateAndStoreGithubMetrics(owner, repo);

    await uploadToS3(req.file.originalname, req.file.buffer);

    const encodedContent = req.file.buffer.toString('base64');

    const jsProgram = "if (process.argv.length === 7) {\nconsole.log('Success')\nprocess.exit(0)\n} else {\nconsole.log('Failed')\nprocess.exit(1)\n}\n";

    // Construct the response object
    const response: apiSchema.Package = {
        metadata: {
            Name: metadata.Name,
            Version: metadata.Version,
            ID: metadata.ID
        },
        data: {
            Content: encodedContent,
            JSProgram: jsProgram
        }
    };

    res.json(response);

  } catch (error) {
    if (error instanceof Error) {
        logger.info("S3 upload error: ", error.message);
        res.status(500).send(error.message);
    } else {
        logger.info("Error in POST /package: ", error);
        res.status(500).send("Internal Server Error");
    }
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
		if (!dbPackage) {
			return res.status(404).send('Package not found');
		}
		// transformed for the apiSchema structure
		// can't use map unless I change apischema/prismaschema
		const apiPackage: apiSchema.Package = {
			metadata: {
				Name: dbPackage.metadata.Name,
				Version: dbPackage.metadata.Version,
				ID: dbPackage.metadata.ID,
			},
			data: {
				Content: dbPackage.data.Content,
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

