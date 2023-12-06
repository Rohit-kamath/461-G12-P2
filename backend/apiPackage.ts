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
    accessKeyId: process.env.ACCESS_KEY_ID_AWS,
    secretAccessKey: process.env.SECRET_ACCESS_KEY_AWS,
    region: process.env.REGION_AWS,
});

type PackageMetaDataPopularity = apiSchema.PackageMetadata & {DownloadCount?: number};

function getMaxVersion(versionRange: string) {
    versionRange = versionRange.replace(/-0/g, '');
    const versions = versionRange.match(/\d+\.\d+\.\d+/g);
    if (versions && versions.length > 0) {
        return versions[versions.length - 1];
    } else {
        console.log('Error in getMaxVersion: No versions found in range');
        logger.info('Error in getMaxVersion: No versions found in range');
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

export async function getPackages(req: Request, res: Response){
    try {
        const offset = req.query?.offset === undefined ? 0 : parseInt(req.query.offset as string);
        if(offset > 5){
            logger.info("getPackages: offset is greater than 5");
            return res.sendStatus(413);
        }
        res.setHeader('offset', offset);
        const packageQueries = req.body as apiSchema.PackageQuery[];
        const packageMetaDataArray: PackageMetaDataPopularity[] = [];
        for (const packageQuery of packageQueries) {
            if (packageQuery.Name === undefined) {
                console.log("packaageQuery.Name is undefined");
                logger.info("getPackages: packaageQuery.Name is undefined");
                return res.sendStatus(400);
            }
            if (packageQuery.Version === undefined) {
                console.log("packaageQuery.Version is undefined");
                logger.info("getPackages: packaageQuery.Version is undefined");
                return res.sendStatus(400);
            }
            const queryName = packageQuery.Name as string;
            const { min: minVersion, max: maxVersion, minInclusive: minInclusive, maxInclusive: maxInclusive } = parseVersion(packageQuery.Version as string);
            const dbPackageMetaData = await prismaCalls.getMetaDataByQuery(queryName, minVersion, maxVersion, minInclusive, maxInclusive, offset);
            if (dbPackageMetaData === null) {
                logger.info(`Error in getPackageMetaData: packageMetaData is null`);
                return res.sendStatus(500);
            }
            const apiPackageMetaData: PackageMetaDataPopularity[] = await Promise.all(
                dbPackageMetaData.map(async (dbPackageMetaData: prismaSchema.PackageMetadata) => {
                    const downloadCount = await prismaCalls.getDownloadCount(dbPackageMetaData.id);
                
                    const metaData: PackageMetaDataPopularity = {
                        Name: dbPackageMetaData.name,
                        Version: dbPackageMetaData.version,
                        ID: dbPackageMetaData.id,
                    };
                    if ( (packageQuery.Popularity !== undefined) && (packageQuery.Popularity == true) ) {
                        metaData.DownloadCount = downloadCount;
                    }
                    return metaData;
                })
              );
            packageMetaDataArray.push(...apiPackageMetaData);
        }
        logger.info(`200 getPackages response: ${JSON.stringify(packageMetaDataArray)}`);
        return res.status(200).json(packageMetaDataArray);
    } catch (error) {
        console.log(error);
        logger.info(`Error in getPackages: ${error}`);
        return res.sendStatus(500);
    } 
}

export async function getPackagesByName(req: Request, res: Response) {
    try {
        if (req.params?.name === undefined) {
            logger.info(`Error in getPackagesByName: Name is undefined`);
            return res.sendStatus(400);
        }
        const queryName = req.params.name;
        const apiPackageHistories = await prismaCalls.getPackageHistories(queryName);

        if (apiPackageHistories === null) {
            logger.info(`Error in getPackagesByName: apiPackageHistories is null`);
            return res.sendStatus(500);
        }
        
        if (apiPackageHistories.length === 0) {
            logger.info(`Error in getPackagesByName: No package histories returned`);
            return res.sendStatus(404);
        }
        logger.info(`200 getPackagesByName response: ${JSON.stringify(apiPackageHistories)}`);
        return res.status(200).json(apiPackageHistories);
    } catch (error) {
        logger.info(`Error in getPackagesByName: ${error}`);
        return res.sendStatus(500);
    }
}

export async function getPackagesByRegEx(req: Request, res: Response) {
    try {
        const popularity = req.body?.debloat === 'true'
        if (req.body?.RegEx === undefined) {
            logger.info(`Error in getPackagesByRegEx: RegEx is undefined`);
            return res.sendStatus(400);
        }
        const regEx: string = req.body.RegEx;
        const dbPackageMetaData = await prismaCalls.getMetaDataByRegEx(regEx);
        if (dbPackageMetaData === null) {
            logger.info(`Error in getPackagesByRegEx: dbPackageMetaData is null`);
            return res.sendStatus(500);
        }
        if(dbPackageMetaData.length === 0){
            logger.info(`Error in getPackagesByRegEx: No package histories returned`);
            return res.sendStatus(404);
        }
        const apiPackageMetaData: PackageMetaDataPopularity[] = await Promise.all(
            dbPackageMetaData.map(async (dbPackageMetaData: prismaSchema.PackageMetadata) => {
                const downloadCount = await prismaCalls.getDownloadCount(dbPackageMetaData.id);
          
                const metaData: PackageMetaDataPopularity = {
                    Name: dbPackageMetaData.name,
                    Version: dbPackageMetaData.version,
                    ID: dbPackageMetaData.id,
                };

                if (popularity) {
                    metaData.DownloadCount = downloadCount;
                }
          
              return metaData;
            })
          );
        logger.info(`200 getPackagesByRegEx response: ${JSON.stringify(apiPackageMetaData)}`);
        return res.status(200).json(apiPackageMetaData);
    } catch (error) {
        logger.info(`Error in getPackagesByRegEx: ${error}`);
        return res.sendStatus(500);
    }
}

export async function extractFileFromZip(zipBuffer: Buffer, filename: string): Promise<string> {
    logger.info(`extractFileFromZip: Extracting ${filename} from zip`);
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
    logger.info('getGithubUrlFromZip: Extracting GitHub URL from zip')
    try {
        if (!zipBuffer || zipBuffer.length === 0) {
            logger.info('getGithubUrlFromZip: Empty or invalid zip buffer provided');
            throw new Error('Empty or invalid zip buffer provided');
        }

        const packageJsonString = await extractFileFromZip(zipBuffer, 'package.json');
        if (!packageJsonString) {
            logger.info('getGithubUrlFromZip: package.json not found or empty in the zip file')
            throw new Error('package.json not found or empty in the zip file');
        }

        logger.info(`Extracted package.json content: ${packageJsonString}`);

        let packageJson;
        try {
            packageJson = JSON.parse(packageJsonString);
        } catch (error) {
            if (error instanceof Error) {
                logger.info(`getGithubUrlFromZip: Failed to parse package.json: ${error.message}`)
                throw new Error(`Failed to parse package.json: ${error.message}`);
            } else {
                logger.info(`getGithubUrlFromZip: Failed to parse package.json: Unknown error occurred`)
                throw new Error('Failed to parse package.json: Unknown error occurred');
            }
        }

        let url = packageJson.repository?.url || packageJson.repository;

        if (!url || typeof url !== 'string') {
            logger.info(`getGithubUrlFromZip: GitHub repository URL not found in package.json`)
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
        logger.info(`getGitHubUrlFromZip: An error occurred while extracting the GitHub URL: ${error}`);
        logger.info(`An error occurred while extracting the GitHub URL: ${error}`);
        throw error;
    }
}

export async function extractMetadataFromZip(filebuffer: Buffer): Promise<apiSchema.PackageMetadata> {
    logger.info('extractMetadataFromZip: Extracting metadata from zip');
    try {
        const packageContent = await extractFileFromZip(filebuffer, 'package.json');
        const packageJson = JSON.parse(packageContent);

        return {
            Name: packageJson.name,
            Version: packageJson.version,
            ID: uuidv4(),
        };
    } catch (error) {
        logger.info(`extractMetadataFromZip: An error occurred while extracting metadata from zip: ${error}`);
        throw error;
    }
}

export async function uploadToS3(fileName: string, fileBuffer: Buffer): Promise<ManagedUpload.SendData> {
    logger.info('UploadToS3: Uploading to S3')
    return new Promise((resolve, reject) => {
        const bucketName = process.env.S3_BUCKET_NAME;

        if (!bucketName) {
            logger.info(`UploadToS3: S3 bucket name not configured.`);
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
                logger.info(`UploadToS3: An error occurred while uploading to S3: ${err}`);
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

async function downloadFromS3(s3Link: string): Promise<Buffer> {
    logger.info('downloadFromS3: Downloading from S3')
    // Extract bucket name and key from the S3 link
    const bucketName = process.env.S3_BUCKET_NAME;

    // Ensure bucket name is defined
    if (!bucketName) {
        throw new Error('S3 bucket name is not configured.');
    }

    const key = s3Link.split('amazonaws.com/')[1];

    const params = {
        Bucket: bucketName,
        Key: key,
    };

    try {
        const data = await s3.getObject(params).promise();
        return data.Body as Buffer;
    } catch (error) {
        logger.error(`downloadFromS3: Failed to download from S3: ${error}`);
        throw new Error('Failed to download from S3');
    }
}

export async function calculateGithubMetrics(owner: string, repo: string): Promise<apiSchema.PackageRating> {
    logger.info(`CalculateGithubMetrics: Calculating metrics for ${owner}/${repo}`);
    try {
        const netScoreCalculator = new NetScore(owner, repo);
        const metrics = await netScoreCalculator.calculate();
        logger.info(`Metrics calculated: ${JSON.stringify(metrics)}`);

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
        logger.info(`CalculateGithubMetrics: Failed to calculate metrics: ${error}`);
        throw error;
    }
}

export async function storeGithubMetrics(metadataId: string, packageRating: apiSchema.PackageRating): Promise<void> {
    logger.info('storeGithubMetrics: Storing package rating metrics in the database')
    try {
        await prismaCalls.storeMetricsInDatabase(metadataId, packageRating);
        logger.info('Package rating metrics stored in the database successfully.');
    } catch (error) {
        logger.info(`Error in storeGithubMetrics: ${error}`);
        throw error;
    }
}

export function parseGitHubUrl(url: string): { owner: string, repo: string } | null {
    logger.info(`parseGitHubUrl: Parsing GitHub URL: ${url}`);
    
    // Handling non-repository URLs like Gist
    if (url.includes("gist.github.com")) {
        logger.info(`Non-repository GitHub URL provided: ${url}`);
        return null;
    }

    // Regular expression to extract the owner and repo name from various GitHub URL formats
    const regex = /(?:github\.com\/|git@github\.com:)([^/]+)\/([^/#?]+)(\.git)?/;
    const match = url.match(regex);

    if (match && match[1] && match[2]) {
        return {
            owner: match[1],
            repo: match[2].replace('.git', '')
        };
    } else {
        logger.info(`Invalid GitHub URL provided: ${url}`);
        return null;
    }
}

export function isPackageIngestible(metrics: apiSchema.PackageRating): boolean {
    logger.info('isPackageIngestible: Checking if package is ingestible');
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
        logger.info(`getGitHubUrlFromNpmUrl: Converting NPM URL to GitHub URL: ${npmUrl}`);
        
        // Extract the package name from the npm URL
        const packageNameMatch = npmUrl.match(/npmjs\.com\/package\/([^/]+)/);
        if (!packageNameMatch) {
            logger.info("Could not extract package name from npm URL");
            return null;
        }
        const packageName = packageNameMatch[1];
        logger.info(`Package name extracted from npm URL: ${packageName}`);

        // Fetch the package data from npm
        const response = await axios.get(`https://registry.npmjs.org/${packageName}`);
        const packageData = response.data;
        logger.info(`Fetched package data from npm`);

        // Get the repository URL from package data
        let repoUrl = packageData.repository?.url;
        if (!repoUrl) {
            logger.info("Repository URL not found in npm package data.");
            return null;
        }
        logger.info(`Repository URL found in npm package data: ${repoUrl}`);

        // Format the repository URL to get the GitHub URL
        if (repoUrl.startsWith('git://github.com/')) {
            repoUrl = `https://github.com/${repoUrl.substring(17).replace(/\.git$/, '')}`;
        } else if (repoUrl.startsWith('git@github.com:')) {
            repoUrl = `https://github.com/${repoUrl.substring(15).replace(/\.git$/, '').replace(':', '/')}`;
        } else if (repoUrl.startsWith('github:')) {
            repoUrl = `https://github.com/${repoUrl.substring(7)}`;
        } else if (repoUrl.startsWith('git+https://github.com/')) {
            repoUrl = repoUrl.replace(/^git\+/, '');
        }

        repoUrl = repoUrl.replace(/\.git$/, '');

        if (!repoUrl.startsWith('https://github.com/')) {
            logger.info(`Invalid or unsupported repository URL format: ${repoUrl}`);
            return null;
        }

        logger.info(`GitHub URL extracted: ${repoUrl}`);
        return repoUrl;
    } catch (error) {
        logger.info(`Error in getGitHubUrlFromNpmUrl: ${error}`);
        return null;
    }
}

export async function linkCheck(url: string): Promise<string | null> {
    logger.info(`linkCheck: Checking if the provided URL is a GitHub or NPM URL: ${url}`);
    try {
        if (url.includes("github.com")) {
            return url;
        }

        if (url.includes("npmjs.com/package")) {
            // Convert NPM URL to GitHub URL
            const githubUrl = await getGitHubUrlFromNpmUrl(url);
            if (!githubUrl) {
                throw new Error(`Failed to convert NPM URL to GitHub URL: ${url}`);
            }
            return githubUrl;
        }

        // If the URL is neither GitHub nor NPM, return null or throw an error
        logger.info(`Invalid or unsupported URL provided: ${url}`);
        return null;
    } catch (error) {
        logger.error(`Error in linkCheck: ${error}`);
        return null;
    }
}

export async function downloadGitHubRepoZip(githubUrl: string): Promise<Buffer> {
    logger.info(`downloadGitHubRepoZip: Downloading GitHub repo ZIP: ${githubUrl}`);
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

export async function uploadPackage(req: Request, res: Response) {
    try {
        const shouldDebloat = req.body?.debloat === 'true';
        const calculateSizeCost = req.body?.sizeCost === 'true';
        logger.info(`shouldDebloat: ${shouldDebloat}`);
        logger.info(`calculateSizeCost: ${calculateSizeCost}`);
        let metadata: apiSchema.PackageMetadata;
        let githubInfo: { owner: string, repo: string } | null;
        let encodedContent: string;
        let jsProgram: string | null = null;
        let sizeCost = null;
        let url: string | null = null;

        if (!req.file && !req.body.URL && !req.body.Content) {
            logger.info("No file or URL provided in the upload. 400 No file uploaded");
            return res.sendStatus(400);
        }
        else if (req.file && req.body.URL) {
            logger.info("Must upload either file or URL, not both. 400 No file uploaded");
            return res.sendStatus(400);
        }
        else if (req.file && req.body.Content) {
            logger.info("Must upload either Base64 ZIP or ZIP, not both. 400 No file uploaded");
            return res.sendStatus(400);
        }
        else if (req.body.Content && req.body.URL) {
            logger.info("Must upload either Base64 ZIP or URL, not both. 400 No file uploaded");
            return res.sendStatus(400);
        }
        else if (req.file) {
            logger.info("Zip File upload detected.");
            let fileBuffer = req.file.buffer;
            if (!isValidZip(fileBuffer)) {
                logger.info('uploadPackage: Invalid ZIP file uploaded');
                return res.sendStatus(400);
            }
            logger.info("Checking and calling if debloating is required.")
            fileBuffer = shouldDebloat ? await debloatPackage(req.file.buffer) : req.file.buffer;
            logger.info("Checking and calling if size cost is required.")
            sizeCost = calculateSizeCost ? await calculateTotalSizeCost(fileBuffer) : 0;
            metadata = await extractMetadataFromZip(fileBuffer);
            url = await getGithubUrlFromZip(fileBuffer);
            githubInfo = parseGitHubUrl(url);
            encodedContent = fileBuffer.toString('base64');
            logger.info(`Converted zip file to Base64 string, encoded content: ${encodedContent.substring(0, 100)}...`);
        }
        else if (req.body.URL) {
            logger.info("URL upload detected.");
            jsProgram = req.body.JSProgram || null;
            url = await linkCheck(req.body.URL);
            if (!url) {
                logger.info("400 Invalid or unsupported URL provided.");
                return res.sendStatus(400);
            }
            logger.info(`GitHub URL extracted: ${url}`)
            const zipBuffer = await downloadGitHubRepoZip(url);
            logger.info("Checking and calling if debloating is required.")
            const debloatedBuffer = shouldDebloat ? await debloatPackage(zipBuffer) : zipBuffer;
            sizeCost = calculateSizeCost ? await calculateTotalSizeCost(debloatedBuffer) : 0;
            metadata = await extractMetadataFromZip(debloatedBuffer);
            githubInfo = parseGitHubUrl(url);
            encodedContent = debloatedBuffer.toString('base64');
            logger.info(`Converted zip file to Base64 string, encoded content:  ${encodedContent.substring(0, 100)}...`);
        }
        else if (req.body.Content) {
            logger.info("Base64 ZIP upload detected.");
            jsProgram = req.body.JSProgram || null;
            logger.info("Decoding Base64 string.");
            const decodedBuffer = Buffer.from(req.body.Content, 'base64');
            logger.info("Checking and calling if debloating is required.");
            const fileBuffer = shouldDebloat ? await debloatPackage(decodedBuffer) : decodedBuffer;
            sizeCost = calculateSizeCost ? await calculateTotalSizeCost(fileBuffer) : 0;
            metadata = await extractMetadataFromZip(fileBuffer);
            url = await getGithubUrlFromZip(fileBuffer);
            githubInfo = parseGitHubUrl(url);
            encodedContent = req.body.Content;
        }
        else {
            logger.info("Must upload a proper zip or provide a URL. 400 Invalid upload type");
            return res.sendStatus(400);
        }

        if (!githubInfo) {
            logger.info("400 Invalid GitHub repository URL.");
            return res.sendStatus(400);
        }

        if (jsProgram === null) {
            jsProgram = "if (process.argv.length === 7) {\nconsole.log('Success')\nprocess.exit(0)\n} else {\nconsole.log('Failed')\nprocess.exit(1)\n}\n";
        }

        const awsRegion = process.env.REGION_AWS;
        if (!awsRegion) {
            logger.info("500 AWS region not configured.");
            return res.sendStatus(500);
        }
        const s3BucketName = process.env.S3_BUCKET_NAME;
        if (!s3BucketName) {
            logger.info("500 S3 bucket name not configured.");
            return res.sendStatus(500);
        }

        const s3link = `https://${s3BucketName}.s3.${awsRegion}.amazonaws.com/${metadata.ID}`

        const PackageData: apiSchema.PackageData = {
            S3Link: s3link,
            URL: url,
            JSProgram: jsProgram
        };

        const apiResponsePackageData: apiSchema.ApiResponsePackageData = {
            Content: encodedContent,
        }
        
        const truncatedContent = encodedContent.substring(0, 100);
        const logPackageData = {
            ...PackageData,
            Content: truncatedContent + '...'
        }
        logger.info(`PackageData: ${JSON.stringify(logPackageData)}`);

        const packageExists = await prismaCalls.checkPackageExists(metadata.Name, metadata.Version);
        if (packageExists) {
            logger.info("409 Package exists already.");
            return res.sendStatus(409);
        }

        const metrics = await calculateGithubMetrics(githubInfo.owner, githubInfo.repo);

        if (!isPackageIngestible(metrics)) {
            logger.info("424 Package is not uploaded due to the disqualified rating.");
            return res.sendStatus(424);
        }

        await prismaCalls.uploadMetadataToDatabase(metadata);

        const Package: apiSchema.Package = {
            metadata: metadata,
            data: apiResponsePackageData,
            sizeCost: sizeCost
        };

        const logAPIPackage = {
            metadata: metadata,
            data: {
                ...apiResponsePackageData,
                Content: truncatedContent + '...'
            }
        };
        const logPackage = {
            metadata: metadata,
            data: {
                ...PackageData,
                Content: truncatedContent + '...'
            }
        };
        logger.info(`200 API Response Package: ${JSON.stringify(logAPIPackage)}`);
        logger.info(`Database Package: ${JSON.stringify(logPackage)}`);

        const action = Action.CREATE;
        await prismaCalls.createPackageHistoryEntry(metadata.ID, action);
        await prismaCalls.storePackageDataInDatabase(metadata.ID, PackageData);
        await prismaCalls.storePackageInDatabase(Package);
        await storeGithubMetrics(metadata.ID, metrics);
        logger.info(`Uploadeding package with file name: ${metadata.ID}`);
        await uploadToS3(metadata.ID, Buffer.from(encodedContent, 'base64'));
        res.json(Package);
    } catch (error) {
        logger.error('Error in POST /package: ', error);
        res.sendStatus(500);
    }
}

// debloat functions
async function debloatPackage(buffer: Buffer): Promise<Buffer> {
    logger.info('debloatPackage: Debloating package');
    const { path: tmpDir, cleanup } = await tmp.dir({ unsafeCleanup: true });

    try {
        const zip = await JSZip.loadAsync(buffer);
        await unzipToDirectory(zip, tmpDir);

        await treeShake(tmpDir);

        // Re-zip the contents and return the buffer
        const debloatedBuffer = await rezipDirectory(tmpDir);
        return debloatedBuffer;
    } catch (error) {
        logger.info(`debloatPackage: Error debloating package: ${error}`);
        console.error('Error debloating package:', error);
        throw error;
    } finally {
        await cleanup();
    }
}

export async function unzipToDirectory(zip: JSZip, directoryPath: string): Promise<void> {
    logger.info(`unzipToDirectory: Unzipping to directory: ${directoryPath}`);
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
    logger.info(`treeShake: Performing tree shaking in directory: ${directoryPath}`);
    const entryPoint = await findEntryPoint(directoryPath);
    if (!entryPoint) {
        logger.info(`treeShake: Entry point not found`);
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
                logger.info(`treeShake: Webpack error: ${err.message}`);
                reject(new Error(`Webpack error: ${err.message}`));
                return;
            }
            if (stats && stats.hasErrors()) {
                logger.info(`treeShake: Webpack compilation error`);
                reject(new Error('Webpack compilation error'));
                return;
            }
            resolve();
        });
    });
}

async function findEntryPoint(directoryPath: string): Promise<string | null> {
    logger.info(`findEntryPoint: Finding entry point in directory: ${directoryPath}`)
    const commonEntryPoints = ['index.js', 'main.js', 'app.js', 'server.js'];
    for (const entry of commonEntryPoints) {
        if (await fs.pathExists(path.join(directoryPath, entry))) {
            logger.info(`findEntryPoint: Entry point found: ${entry}`)
            return path.join(directoryPath, entry);
        }
    }
    // Fallback to reading package.json
    const packageJsonPath = path.join(directoryPath, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
        const packageJson = await fs.readJson(packageJsonPath);
        if (packageJson.main) {
            logger.info(`findEntryPoint: Found entry point in package.json: ${packageJson.main}`);
            return path.join(directoryPath, packageJson.main);
        }
    }
    logger.info(`findEntryPoint: Entry point not found`);
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

// size cost functions
export async function calculateTotalSizeCost(mainPackageBuffer: Buffer, additionalPackageNames = []): Promise<number> {
    logger.info('calculateTotalSizeCost: Calculating total size cost');
    let totalSize = mainPackageBuffer.length; // Size from the buffer
    logger.info(`Size from the buffer: ${totalSize}`)
    const processedPackages = new Set<string>();

    additionalPackageNames.forEach(packageName => {
        const dependencies = getAllDependencies(packageName);
        dependencies.forEach(dep => {
            if (!processedPackages.has(dep)) {
                totalSize += getPackageSize(dep);
                processedPackages.add(dep);
            }
        });
    });

    logger.info(`Total size cost: ${totalSize}`);
    return totalSize;
}

function getAllDependencies(packageName: string): string[] {
    const dependencies = new Set<string>();
    const queue = [packageName];

    while (queue.length > 0) {
        const currentPackage = queue.shift();
        if (currentPackage && !dependencies.has(currentPackage)) {
            dependencies.add(currentPackage);
            const currentPackageDependencies = getDependencies(currentPackage);
            currentPackageDependencies.forEach(dep => {
                if (!dependencies.has(dep)) {
                    queue.push(dep);
                }
            });
        }
    }

    return Array.from(dependencies);
}

function getDependencies(packageName: string): string[] {
    try {
        const packageJsonPath = path.join('node_modules', packageName, 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        return Object.keys(packageJson.dependencies || {});
    } catch (error) {
        console.error(`Error reading dependencies for package ${packageName}:`, error);
        return [];
    }
}

function getPackageSize(packageName: string): number {
    try {
        const packagePath = path.join('node_modules', packageName);
        return calculateDirectorySize(packagePath);
    } catch (error) {
        console.error(`Error calculating size for package ${packageName}:`, error);
        return 0;
    }
}

function calculateDirectorySize(directoryPath: string): number {
    let totalSize = 0;

    try {
        const files = fs.readdirSync(directoryPath);
        for (const file of files) {
            const filePath = path.join(directoryPath, file);
            const stats = fs.statSync(filePath);
            totalSize += stats.isDirectory() ? calculateDirectorySize(filePath) : stats.size;
        }
    } catch (error) {
        console.error(`Error calculating size for directory ${directoryPath}:`, error);
    }

    return totalSize;
}
// end of size cost functions

export async function getPackageDownload(req: Request, res: Response) {
    try {
        const packageID = req.params.id;

        if (packageID === undefined) {
            logger.info(`Error in getPackageDownload: Package name is undefined`);
            return res.sendStatus(400);
        }
        const dbPackage = await prismaCalls.getPackage(packageID as string);
        if (dbPackage === null) {
            logger.info(`Error in getPackageDownload: Package not found`)
            return res.sendStatus(404);
        }

        const s3Link = dbPackage.data.S3Link;
        if (!s3Link) {
            logger.info(`Error in getPackageDownload: S3 link is missing for the package`);
            return res.sendStatus(404);
        }

        const fileBuffer = await downloadFromS3(s3Link);
        if (!isValidZip(fileBuffer)) {
            logger.info('getPackageDownload: Downloaded ZIP file is invalid');
            return res.sendStatus(400);
        }
        const base64Content = fileBuffer.toString('base64');

        const packageMetadata: apiSchema.PackageMetadata = {
            Name: dbPackage.metadata.name,
            Version: dbPackage.metadata.version,
            ID: dbPackage.metadata.id,
        };
        
        const apiResponsePackageData: apiSchema.ApiResponsePackageData = {
            Content: base64Content,
        };
        
        const packageResponse: apiSchema.Package = {
            metadata: packageMetadata,
            data: apiResponsePackageData,
        };
        logger.info(`200 getPackageDownload response: ${JSON.stringify(packageResponse)}`);
        return res.status(200).json(packageResponse);
    } catch (error) {
        logger.info(`Error in getPackageDownload: ${error}`)
        return res.sendStatus(500);
    }
}

export async function updatePackage(req: Request, res: Response) {
    try {
        const shouldDebloat = req.body?.debloat === 'true';
        const calculateSizeCost = req.body?.sizeCost === 'true';
        logger.info(`shouldDebloat: ${shouldDebloat}`);
        logger.info(`calculateSizeCost: ${calculateSizeCost}`);
        const metadata = req.body?.metadata;
        if(metadata === undefined){
            logger.info(`Error in updatePackage: metaData is undefined`);
            return res.sendStatus(400);
        }
        const data = req.body?.data;
        if(data === undefined){
            logger.info(`Error in updatePackage: datas is undefined`);
            return res.sendStatus(400);
        }
        if(!data?.URL && !data?.Content) {
            logger.info("Error in updatePackage: No Content or URL provided in the upload");
            return res.sendStatus(400);
        }
        if(!metadata.Name || !metadata.Version || !metadata.ID) {
            logger.info(`Error in updatePackage: All metadata fields are required`);
            return res.sendStatus(400);
        }
        const exists = await prismaCalls.checkPackageExists(metadata.Name, metadata.Version, metadata.ID);
        if(!exists){
            logger.info(`Error in updatePackage: Package does not exist.`);
            return res.sendStatus(404);
        }

        const packageId = req.params?.id;
        if(!packageId) {
            logger.info(`Error in updatePackage: Package ID is required.`);
            return res.sendStatus(400);
        }

        if(packageId !== metadata.ID) {
            logger.info(`Error in updatePackage: Package ID in the URL does not match the ID in the request body.`);
            return res.sendStatus(400);
        }
        const S3Link = await prismaCalls.getS3Link(packageId);
        if(S3Link === null){
            logger.info(`Error in updatePackage: S3Link is null`);
            return res.sendStatus(500);
        }

        let packageContent;
        if(data?.Content){
            packageContent = Buffer.from(data.Content, 'base64');
        }else{
            packageContent = await downloadFromS3(S3Link);
        }

        if(shouldDebloat){
            packageContent = await debloatPackage(packageContent);
        }

        let sizeCost = null;
        if(calculateSizeCost){
            sizeCost = await calculateTotalSizeCost(Buffer.from(S3Link, 'base64'));
        }
        const updatedData = await prismaCalls.updatePackageDetails(packageId, {...data});
        if(updatedData === null){
            logger.info(`Error in updatePackage: updatedData is null`);
            return res.sendStatus(500);
        }
        await uploadToS3(`${metadata.ID}.zip`, packageContent);
        if(calculateSizeCost && sizeCost !== null){
            logger.info(`200 updatePackage response: ${JSON.stringify(sizeCost)}`);
            return res.status(200).json({sizeCost: sizeCost});
        }
        return res.sendStatus(200);
    } catch (error) {
        logger.info(`Error in updatePackage: ${error}`);
        return res.sendStatus(500);
    }
}

export async function callResetDatabase(req: Request, res: Response) {
    try {
        const bucketName = process.env.S3_BUCKET_NAME;
        if (!bucketName) {
            logger.info(`callResetDatabase: AWS S3 bucket name is not defined in environment variables.`)
            throw new Error("AWS S3 bucket name is not defined in environment variables.");
        }

        await emptyS3Bucket(bucketName);
        logger.info('S3 Bucket content deleted.');
        await prismaCalls.resetDatabase();
        logger.info('200 status Registry is reset.');
        res.sendStatus(200);
    } catch (error) {
        const errorMessage = (error instanceof Error) ? error.message : 'Unknown error occurred';
        logger.error(`Error resetting database or S3 bucket: ${errorMessage}`);
        res.sendStatus(500);
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

export async function getPackageRatings(req: Request, res: Response) {
    const packageId = req.params.id;

    logger.info(`getPackageRatings: Getting package ratings for package ID: ${packageId}`);
    if (!packageId) {
        logger.info(`Error in getPackageRatings: Package ID is required`);
        return res.sendStatus(400);
    }

    try {
        const packageRating = await prismaCalls.getPackageRatingById(packageId);

        if (!packageRating) {
            logger.info("error in getPackageRatings: Package not found or no ratings available")
            return res.sendStatus(404);
        }
        logger.info(`200 getPackageRatings response: ${JSON.stringify(packageRating)}`);
        return res.status(200).json(packageRating);
    } catch (error) {
        logger.info(`Error in getPackageRatings: ${error}`);
        return res.sendStatus(500);
    }
}

function isValidZip(buffer: Buffer): boolean {
    logger.info('isValidZip: Checking if the provided buffer is a valid ZIP file');
    // ZIP files usually start with 'PK' (0x50, 0x4B)
    if (buffer.length < 4) return false; // Too small to be a ZIP
    return buffer[0] === 0x50 && buffer[1] === 0x4B;
}

export async function deletePackageByID(req: Request, res: Response) { 
    try {
        const packageID = req.params.id;

        // Check for required fields
        if (!packageID) {
            logger.info(`Error in retrieveAndDeletePackage: Package ID or Authentication Token is undefined`);
            return res.status(400).send("Package ID is missing or improperly formed.");
        }


        // Check the package
        const packagecount = await prismaCalls.checkPackageExistsID(packageID)
        if (!packagecount) {
            logger.info(`Error in retrieveAndDeletePackage: Package not found`);
            return res.status(404).send("Package does not exist.");
        }

        // Delete the package
        await prismaCalls.deletePackage(packageID);
        logger.info(`Package with ID ${packageID} has been deleted.`);
        return res.status(200).send("Package is deleted.");
    } catch (error) {
        logger.info(`Error in retrieveAndDeletePackage: ${error}`);
        return res.status(500).send("Internal Server Error.");
    }
}

export async function deletePackageByName(req: Request, res: Response) {
    try {
        const packageName = req.params.name;

        if (packageName === undefined) {
            logger.info('Error in deletePackageByName: Name is undefined');
            return res.status(400).send('Package name is required');
        }

        // Check if the package exists
        const packageExists = await prismaCalls.checkPackageNameExists(packageName);
        if (!packageExists) {
            logger.info(`Package not found: ${packageName}`);
            return res.status(404).send('Package does not exist');
        }

        // deletion
        await prismaCalls.deletePackageVersions(packageName);
        
        logger.info(`Package deleted successfully: ${packageName}`);
        return res.status(200).send(`Package '${packageName}' and its versions have been deleted`);
    } catch (error) {
        logger.error(`Error in deletePackageByName: ${error}`);
        return res.status(500).send('Internal server error');
    }
}
