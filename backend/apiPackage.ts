import * as apiSchema from './apiSchema';
import { Request, Response } from 'express';
import * as prismaCalls from './prismaCalls';
import * as prismaSchema from '@prisma/client';
import JSZip from 'jszip';
import { v4 as uuidv4 } from 'uuid';
import AWS from 'aws-sdk';
import { ManagedUpload } from 'aws-sdk/clients/s3';
import createModuleLogger from '../src/logger';
import { NetScore } from '../src/controllers/netScore';
import semver from 'semver';
import { Action } from '@prisma/client';
import axios from 'axios'
import webpack, { Configuration } from 'webpack';
import tmp from 'tmp-promise';
import fs from 'fs-extra';
import path from 'path';

const logger = createModuleLogger('API Package Calls');

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'us-east-2',
});

type PackageMetaDataPopularity = apiSchema.PackageMetadata & {DownloadCount: number};

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
        const apiPackageMetaData: PackageMetaDataPopularity[] = await Promise.all(
            dbPackageMetaData.map(async (dbPackageMetaData: prismaSchema.PackageMetadata) => {
              const downloadCount = await prismaCalls.getDownloadCount(dbPackageMetaData.id);
          
              const metaData: PackageMetaDataPopularity = {
                Name: dbPackageMetaData.name,
                Version: dbPackageMetaData.version,
                ID: dbPackageMetaData.id,
                DownloadCount: downloadCount,
              };
          
              return metaData;
            })
          );
        res.setHeader('offset', offset);
        return res.status(200).json(apiPackageMetaData);
    } catch (error) {
        return res.status(500).send(`Error in getPackageMetaData: ${error}`);
    }
}

export async function getPackagesFull(req: Request, res: Response){
    try {
        const offset = req.query?.offset === undefined ? 1 : parseInt(req.query.offset as string);
        res.setHeader('offset', offset);
        const packageQueries = req.body as apiSchema.PackageQuery[];
        const packageMetaDataArray: PackageMetaDataPopularity[] = [];
        for (const packageQuery of packageQueries) {
            if (packageQuery.Name === undefined) {
                return res.status(400).send(`Error in getPackageMetaData: Name is undefined`);
            }
            if (packageQuery.Version === undefined) {
                return res.status(400).send(`Error in getPackageMetaData: Version is undefined`);
            }
            const queryName = packageQuery.Name as string;
            const { min: minVersion, max: maxVersion, minInclusive: minInclusive, maxInclusive: maxInclusive } = parseVersion(packageQuery.Version as string);
            const dbPackageMetaData = await prismaCalls.getMetaDataByQuery(queryName, minVersion, maxVersion, minInclusive, maxInclusive, offset);
            if (dbPackageMetaData === null) {
                return res.status(500).send(`Error in getPackageMetaData: packageMetaData is null`);
            }
            const apiPackageMetaData: PackageMetaDataPopularity[] = await Promise.all(
                dbPackageMetaData.map(async (dbPackageMetaData: prismaSchema.PackageMetadata) => {
                  const downloadCount = await prismaCalls.getDownloadCount(dbPackageMetaData.id);
              
                  const metaData: PackageMetaDataPopularity = {
                    Name: dbPackageMetaData.name,
                    Version: dbPackageMetaData.version,
                    ID: dbPackageMetaData.id,
                    DownloadCount: downloadCount,
                  };
              
                  return metaData;
                })
              );
            packageMetaDataArray.push(...apiPackageMetaData);
        }
        return res.status(200).json(packageMetaDataArray);
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
        const apiPackageMetaData: PackageMetaDataPopularity[] = await Promise.all(
            dbPackageMetaData.map(async (dbPackageMetaData: prismaSchema.PackageMetadata) => {
              const downloadCount = await prismaCalls.getDownloadCount(dbPackageMetaData.id);
          
              const metaData: PackageMetaDataPopularity = {
                Name: dbPackageMetaData.name,
                Version: dbPackageMetaData.version,
                ID: dbPackageMetaData.id,
                DownloadCount: downloadCount,
              };
          
              return metaData;
            })
          );
        return res.status(200).json(apiPackageMetaData);
    } catch (error) {
        return res.status(500).send(`Error in getPackagesByRegEx: ${error}`);
    }
}

export async function extractFileFromZip(zipBuffer: Buffer, filename: string): Promise<string> {
  const zip = await JSZip.loadAsync(zipBuffer);

  // Determine if there's a single root directory
  const rootDir = Object.keys(zip.files).find(path => path.endsWith("/") && path.split('/').length === 2);

  let file;

  if (rootDir) {
      // If a root directory exists, prepend it to the filename
      file = zip.file(`${rootDir}${filename}`);
  } else {
      // Otherwise, search for the file at the root of the zip
      file = zip.file(new RegExp(`^${filename}$`));
  }

  // Handle the case where file is an array
  if (Array.isArray(file)) {
      file = file.length > 0 ? file[0] : null;
  }

  if (!file) {
      logger.info(`${filename} not found inside the zip.`);
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
        const packageContent = await extractFileFromZip(filebuffer, 'package.json');
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
            throw new Error('S3 bucket name not configured.');
        }

        const params: AWS.S3.Types.PutObjectRequest = {
            Bucket: bucketName,
            Key: fileName,
            Body: fileBuffer,
        };

        // Uploading files to the bucket
        s3.upload(params, function (err: Error, data: ManagedUpload.SendData) {
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
      const netScoreCalculator = new NetScore(owner, repo);
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
      logger.info('Invalid GitHub URL provided:', url);
      return null;
  }
}


export function isPackageIngestible(metrics: apiSchema.PackageRating): boolean {
  return (
      metrics.BusFactor >= 0.0 &&
      // metrics.Correctness >= 0.5 && (until correctness is fixed)
      metrics.RampUp >= 0.0 &&
      metrics.ResponsiveMaintainer >= 0.0 &&
      metrics.LicenseScore >= 0.0 &&
      // metrics.GoodPinningPractice >= 0.5 && spec says to only include phase 1 metrics (I think)
      // metrics.PullRequest >= 0.5
      metrics.NetScore >= 0.0
  );
}


export async function getGitHubUrlFromNpmUrl(npmUrl: string): Promise<string | null>{
  try {
      // Extract the package name from the npm URL
      const packageNameMatch = npmUrl.match(/npmjs\.com\/package\/([^/]+)/);
      if (!packageNameMatch) {
          logger.info("Could not extract package name from npm URL");
          return null;
      }
      const packageName = packageNameMatch[1];

      // Fetch the package data from npm
      const response = await axios.get(`https://registry.npmjs.org/${packageName}`);
      const packageData = response.data;

      // Get the repository URL from package data
      let repoUrl = packageData.repository?.url;
      if (!repoUrl) {
          logger.info("Repository URL not found in npm package data");
          return null;
      }

      // Format the repository URL to get the GitHub URL
      repoUrl = repoUrl.replace(/^git\+/, '').replace(/\.git$/, '');
      if (repoUrl.startsWith('https://github.com/')) {
          // URL is already in the correct format
          return repoUrl;
      } else if (repoUrl.startsWith('github:')) {
          // Convert 'github:' shorthand to a full URL
          return `https://github.com/${repoUrl.substring(7)}`;
      } else if (repoUrl.startsWith('git@github.com:')) {
          // Convert SSH format to HTTPS URL
          return `https://github.com/${repoUrl.substring(15).replace(/\.git$/, '')}`;
      }

      logger.info("Unknown repository URL format:", repoUrl);
      return null;
  } catch (error) {
      logger.info("Error in getGitHubUrlFromNpmUrl:", error);
      return null;
  }
}


export async function linkCheck(url: string): Promise<string | null> {
  try {
      // Check if the URL is a GitHub URL
      if (url.includes("github.com")) {
          // It's already a GitHub URL, so return it as is
          return url;
      }

      // Check if the URL is an NPM URL
      if (url.includes("npmjs.com/package")) {
          // Convert NPM URL to GitHub URL
          const githubUrl = await getGitHubUrlFromNpmUrl(url);
          if (!githubUrl) {
              throw new Error(`Failed to convert NPM URL to GitHub URL: ${url}`);
          }
          return githubUrl;
      }

      // If the URL is neither GitHub nor NPM, return null or throw an error
      logger.info("Provided URL is neither a GitHub nor an NPM URL:", url);
      return null;
  } catch (error) {
      logger.error(`Error in linkCheck: ${error}`);
      return null;
  }
}


export async function downloadGitHubRepoZip(githubUrl: string): Promise<Buffer> {
  try {
      // Extract owner and repository name from the GitHub URL
      const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (!match) {
          throw new Error(`Invalid GitHub URL: ${githubUrl}`);
      }

      const owner = match[1];
      const repo = match[2];

      // Construct the ZIP download URL
      const zipUrl = `https://github.com/${owner}/${repo}/archive/refs/heads/master.zip`;

      // Download the ZIP file
      const response = await axios.get(zipUrl, { responseType: 'arraybuffer' });
      if (response.status !== 200) {
          throw new Error(`Failed to download ZIP from ${zipUrl}`);
      }

      // Convert the response to a Buffer
      const zipBuffer = Buffer.from(response.data, 'binary');
      return zipBuffer;
  } catch (error) {
      logger.error(`Error in downloadGitHubRepoZip: ${error}`);
      throw error;
  }
}


export async function uploadPackage(req: Request, res: Response, shouldDebloat: boolean) {
  try {
      let metadata: apiSchema.PackageMetadata;
      let githubInfo: { owner: string, repo: string } | null;
      let encodedContent: string;
      let fileName: string;

      if (!req.file && !req.body.URL) {
          logger.info("No file or URL provided in the upload.");
          return res.status(400).send('No file or URL uploaded');
      }
      else if (req.file && req.body.URL) {
          logger.info("Must upload either file or URL, not both.");
          return res.status(400).send('No file uploaded');
      }
      else if (req.file) {
        const fileBuffer = shouldDebloat ? await debloatPackage(req.file.buffer) : req.file.buffer;
        metadata = await extractMetadataFromZip(fileBuffer);
        const url = await getGithubUrlFromZip(fileBuffer);
        githubInfo = parseGitHubUrl(url);
        encodedContent = fileBuffer.toString('base64');
        fileName = req.file.originalname;
      }
      else if (req.body.URL) {
        const url = await linkCheck(req.body.URL);
        if (!url) {
          logger.info("Invalid or unsupported URL provided.");
          return res.status(400).send('Invalid or unsupported URL provided.');
      }
        const zipBuffer = await downloadGitHubRepoZip(url);
        const debloatedBuffer = shouldDebloat ? await debloatPackage(zipBuffer) : zipBuffer;
        metadata = await extractMetadataFromZip(debloatedBuffer);
        githubInfo = parseGitHubUrl(url);
        encodedContent = debloatedBuffer.toString('base64');
        fileName = `${metadata.Name}.zip`;
      }
      else {
        logger.info("Must upload a proper zip or provide a URL");
        return res.status(400).send('Invalid upload type');
      }

      if (!githubInfo) {
          logger.info("Invalid GitHub repository URL.");
          return res.status(400).send('Invalid GitHub repository URL.');
      }

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

      const metrics = await calculateGithubMetrics(githubInfo.owner, githubInfo.repo);
      if (!isPackageIngestible(metrics)) {
        logger.info("Package is not uploaded due to the disqualified rating.");
        return res.status(424).send('Package is not uploaded due to the disqualified rating');
      }

      await prismaCalls.uploadMetadataToDatabase(metadata);

        const Package: apiSchema.Package = {
            metadata: metadata,
            data: PackageData,
        };

        const action = Action.CREATE;
        await prismaCalls.createPackageHistoryEntry(metadata.ID, 1, action); // User id is 1 for now

      await storeGithubMetrics(metadata.ID, metrics);

      await uploadToS3(fileName, Buffer.from(encodedContent, 'base64'));

        res.json(Package);
    } catch (error) {
        logger.error('Error in POST /package: ', error);
        res.status(500).send('Internal Server Error');
    }
}


// debloat functions
async function debloatPackage(buffer: Buffer): Promise<Buffer> {
    const { path: tmpDir, cleanup } = await tmp.dir({ unsafeCleanup: true });

    try {
        const zip = await JSZip.loadAsync(buffer);
        await unzipToDirectory(zip, tmpDir);

        // Perform tree shaking using Webpack
        await treeShake(tmpDir);

        // Re-zip the contents and return the buffer
        const debloatedBuffer = await rezipDirectory(tmpDir);
        return debloatedBuffer;
    } catch (error) {
        console.error('Error debloating package:', error);
        throw error;
    } finally {
        await cleanup();
    }
}

export async function unzipToDirectory(zip: JSZip, directoryPath: string): Promise<void> {
    await fs.ensureDir(directoryPath);
    for (const [filename, fileData] of Object.entries(zip.files)) {
        if (!fileData.dir) {
            const content = await fileData.async('nodebuffer');
            const filePath = path.join(directoryPath, filename);
            await fs.outputFile(filePath, content);
        }
    }
}

async function treeShake(directoryPath: string): Promise<void> {
    const entryPoint = await findEntryPoint(directoryPath);
    if (!entryPoint) {
        throw new Error('Entry point not found');
    }

    const config: Configuration = {
        mode: 'production',
        entry: entryPoint,
        output: {
            path: directoryPath,
            filename: 'bundle.js'
        },
        optimization: {
            usedExports: true
        }
    };

    return new Promise((resolve, reject) => {
        webpack(config, (err, stats) => {
            if (err) {
                reject(new Error(`Webpack error: ${err.message}`));
                return;
            }
            if (stats && stats.hasErrors()) {
                reject(new Error('Webpack compilation error'));
                return;
            }
            resolve();
        });
    });
}

async function findEntryPoint(directoryPath: string): Promise<string | null> {
    const commonEntryPoints = ['index.js', 'main.js'];
    for (const entry of commonEntryPoints) {
        if (await fs.pathExists(path.join(directoryPath, entry))) {
            return path.join(directoryPath, entry);
        }
    }
    // Fallback to reading package.json
    const packageJsonPath = path.join(directoryPath, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
        const packageJson = await fs.readJson(packageJsonPath);
        if (packageJson.main) {
            return path.join(directoryPath, packageJson.main);
        }
    }
    return null;
}


export async function rezipDirectory(directoryPath: string): Promise<Buffer> {
    const zip = new JSZip();
    await addDirectoryToZip(zip, directoryPath, directoryPath);
    return zip.generateAsync({ type: "nodebuffer" });
}

async function addDirectoryToZip(zip: JSZip, directoryPath: string, rootPath: string) {
    const entries = await fs.readdir(directoryPath, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(directoryPath, entry.name);
        if (entry.isDirectory()) {
            // Recursively add subdirectory
            await addDirectoryToZip(zip, fullPath, rootPath);
        } else {
            // Add file to zip
            const fileContent = await fs.readFile(fullPath);
            const zipPath = path.relative(rootPath, fullPath); // Get the relative path for the ZIP structure
            zip.file(zipPath, fileContent);
        }
    }
}


// end of debloat functions

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
export async function updatePackage(req: Request, res: Response, shouldDebloat: boolean) {
    try {
        const { metadata, data } = req.body as apiSchema.Package;

        // Validate required fields
        if (!metadata || !data || !metadata.Name || !metadata.Version || !metadata.ID  || !data.Content) {
            return res.status(400).send('All fields are required and must be valid.');
        }

        const packageId = req.params.id;
        if (!packageId) {
            return res.status(400).send('Package ID is required.');
        }

        if (packageId !== metadata.ID) {
            return res.status(400).send('Package ID in the URL does not match the ID in the request body.');
        }

        // Decode the package content 
        let packageContent = Buffer.from(data.Content, 'base64');

        // Apply debloat if required
        if (shouldDebloat) {
            packageContent = await debloatPackage(packageContent);
        }

        // Update the package data
        const updatedData = await prismaCalls.updatePackageDetails(packageId, {
            ...data,
            Content: packageContent.toString('base64') // Re-encode the package content 
        });

        return res.status(200).json({ Data: updatedData });
    } catch (error) {
        console.error(`Error in updatePackage: ${error}`);
        return res.status(500).send(`Server error: ${error}`);
    }
}

export async function callResetDatabase(req: Request, res: Response) {
  try {
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    if (!bucketName) {
      throw new Error("AWS S3 bucket name is not defined in environment variables.");
    }

    await emptyS3Bucket(bucketName);
    logger.info('S3 Bucket content deleted.');
    await prismaCalls.resetDatabase();
    logger.info('Registry is reset.');
    res.status(200).send('Registry is reset.');
    
  } catch (error) {
    const errorMessage = (error instanceof Error) ? error.message : 'Unknown error occurred';
    logger.error(`Error resetting database or S3 bucket: ${errorMessage}`);
    res.status(500).send(`Internal Server Error: ${errorMessage}`);
  }
}


async function emptyS3Bucket(bucketName: string) {
  try {
    let listedObjects;
    do {
      listedObjects = await s3.listObjectsV2({ Bucket: bucketName }).promise();

      if (listedObjects.Contents && listedObjects.Contents.length > 0) {
        const deleteParams = {
          Bucket: bucketName,
          Delete: { Objects: listedObjects.Contents.filter(item => item.Key).map(item => ({ Key: item.Key! })) }
        };
        await s3.deleteObjects(deleteParams).promise();
      }
    } while (listedObjects.IsTruncated);
  } catch (error) {
    const errorMessage = (error instanceof Error) ? error.message : 'Unknown error occurred';
    logger.error(`Error emptying S3 bucket: ${errorMessage}`);
    throw new Error(`Failed to empty S3 bucket: ${errorMessage}`);
  }
}
