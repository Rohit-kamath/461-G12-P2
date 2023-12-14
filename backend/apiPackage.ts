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
import { minify } from 'terser';
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
    if (!minVersion) {
        throw new Error(`Error in parseVersion: minVersion is null`);
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
        const offset = !req.query?.offset ? 0 : parseInt(req.query.offset as string);
        if(offset > 5){
            logger.info("getPackages: offset is greater than 5");
            return res.sendStatus(413);
        }
        res.setHeader('offset', offset);
        const packageQueries = req.body as apiSchema.PackageQuery[];
        const packageMetaDataArray: PackageMetaDataPopularity[] = [];
        for (const packageQuery of packageQueries) {
            if (!packageQuery.Name) {
                logger.info("getPackages: packageQuery.Name is undefined");
                return res.sendStatus(400);
            }
            const queryName = packageQuery.Name as string;
            let dbPackageMetaData;
            if (!packageQuery.Version) {
                dbPackageMetaData = await prismaCalls.getMetaDataWithoutVersion(queryName, offset);
            }else{
                const { min: minVersion, max: maxVersion, minInclusive: minInclusive, maxInclusive: maxInclusive } = parseVersion(packageQuery.Version as string);
                dbPackageMetaData = await prismaCalls.getMetaDataByQuery(queryName, minVersion, maxVersion, minInclusive, maxInclusive, offset);
            }
            if (!dbPackageMetaData) {
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
                    if (packageQuery.Popularity) {
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
        if (!req.params?.name) {
            logger.info(`Error in getPackagesByName: Name is undefined`);
            return res.sendStatus(400);
        }
        const queryName = req.params.name;
        const apiPackageHistories = await prismaCalls.getPackageHistories(queryName);

        if (!apiPackageHistories) {
            logger.info(`Error in getPackagesByName: apiPackageHistories is null`);
            console.log(`Error in getPackagesByName: apiPackageHistories is null`);
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
        console.log(`Error in getPackagesByName: ${error}`);
        return res.sendStatus(500);
    }
}

export async function getPackagesByRegEx(req: Request, res: Response) {
    try {
        const popularity = req.body?.debloat === 'true'
        if (!req.body?.RegEx) {
            logger.info(`Error in getPackagesByRegEx: RegEx is undefined`);
            return res.sendStatus(400);
        }
        const regEx: string = req.body.RegEx;
        const dbPackageMetaData = await prismaCalls.getMetaDataByRegEx(regEx);
        if (!dbPackageMetaData || dbPackageMetaData.length === 0) {
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

    let fileContent = null;

    zip.forEach((relativePath, file) => {
        if (relativePath.endsWith(`/${filename}`)) {
            fileContent = file.async('string');
        }
    });

    if (!fileContent) {
        logger.info(`${filename} not found inside the zip.`);
        throw new Error(`${filename} not found inside the zip.`);
    }

    return fileContent;
}

export async function getGithubUrlFromZip(zipBuffer: Buffer): Promise<string> {
    logger.info('getGithubUrlFromZip: Extracting GitHub URL from zip');
    try {
        if (!zipBuffer || zipBuffer.length === 0) {
            logger.info('getGithubUrlFromZip: Empty or invalid zip buffer provided');
            throw new Error('Empty or invalid zip buffer provided');
        }

        const packageJsonString = await extractFileFromZip(zipBuffer, 'package.json');
        if (!packageJsonString) {
            logger.info('getGithubUrlFromZip: package.json not found or empty in the zip file');
            throw new Error('package.json not found or empty in the zip file');
        }

        logger.info(`Extracted package.json content: ${packageJsonString}`);

        let packageJson;
        try {
            packageJson = JSON.parse(packageJsonString);
        } catch (error) {
            if (error instanceof Error) {
                logger.info(`getGitHubUrlFromZip: Failed to parse package.json: ${error.message}`);
                throw new Error(`Failed to parse package.json: ${error.message}`);
            } else {
                logger.info(`getGitHubUrlFromZip: Unknown error occurred while parsing package.json`);
                throw new Error('Unknown error occurred while parsing package.json');
            }
        }

        let url = packageJson.repository?.url || packageJson.repository || packageJson.homepage;
        logger.info(`getGitHubUrlFromZip: GitHub URL extracted from package.json: ${url}`)

        if (!url || typeof url !== 'string') {
            logger.info(`getGithubUrlFromZip: GitHub repository URL not found in package.json`);
            throw new Error('GitHub repository URL not found in package.json');
        }

        if (url.startsWith('github:')) {
            url = `https://github.com/${url.substring(7)}`;
        }

        if (url.startsWith('git@github.com:')) {
            url = `https://github.com/${url.substring(15)}`;
        }

        if (url.startsWith('git://github.com/')) {
            url = `https://github.com/${url.substring(17)}`;
        }

        url = url.replace(/\.git$/, '');

        logger.info(`GitHub URL extracted from zip: ${url}`);
        return url;
    } catch (error) {
        if (error instanceof Error) {
            logger.info(`getGitHubUrlFromZip: Error extracting GitHub URL: ${error.message}`);
            throw new Error(`Error extracting GitHub URL: ${error.message}`);
        } else {
            logger.info(`getGitHubUrlFromZip: Unknown error occurred while extracting GitHub URL`);
            throw new Error('Unknown error occurred while extracting GitHub URL');
        }
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

export async function uploadToS3(fileName: string, fileBuffer: Buffer, bucketNameOverride?: string): Promise<ManagedUpload.SendData> {
    logger.info('UploadToS3: Uploading to S3');

    // Determine which bucket to use
    const bucketName = bucketNameOverride || process.env.S3_BUCKET_NAME;
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
    return new Promise((resolve, reject) => {
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
    logger.info('downloadFromS3: Downloading from S3');

    const transactionBucket = process.env.TRANSACTION_BUCKET_NAME;
    const zipBucket = process.env.S3_BUCKET_NAME;

    if (!transactionBucket || !zipBucket) {
        logger.info(`downloadFromS3: S3 bucket name not configured.`);
        throw new Error('S3 bucket name not configured.');
    }

    let bucketName, key;
    if (s3Link.includes(transactionBucket)) {
        bucketName = transactionBucket;
        key = s3Link.split('amazonaws.com/')[1];
    } else if (s3Link.includes(zipBucket)) {
        bucketName = zipBucket;
        key = s3Link.split('amazonaws.com/')[1];
    } else {
        throw new Error('Invalid S3 link');
    }

    logger.info(`downloadFromS3: Bucket: ${bucketName}, Key: ${key}`);

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
        metrics.Correctness >= 0.0 &&
        metrics.RampUp >= 0.0 &&
        metrics.ResponsiveMaintainer >= 0.0 &&
        metrics.LicenseScore >= 0.0 &&
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

        logger.info(`GitHub URL extracted from NPM: ${repoUrl}`);
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
        let sizeCost = null;
        let url: string | null = null;

        if (!req.body.URL && !req.body.Content) {
            logger.info("No file or URL provided in the upload. 400 No file uploaded");
            return res.sendStatus(400);
        }else if (req.body.Content && req.body.URL) {
            logger.info("Must upload either Base64 ZIP or URL, not both. 400 No file uploaded");
            return res.sendStatus(400);
        }else if (req.body.URL) {
            logger.info("URL upload detected.");
            url = await linkCheck(req.body.URL);
            if (!url) {
                logger.info("400 Invalid or unsupported URL provided.");
                return res.sendStatus(400);
            }
            logger.info(`GitHub URL extracted after linkCheck: ${url}`)
            const zipBuffer = await downloadGitHubRepoZip(url);
            logger.info("Checking and calling if debloating is required.")
            const debloatedBuffer = shouldDebloat ? await debloatPackage(zipBuffer) : zipBuffer;
            sizeCost = calculateSizeCost ? await calculateTotalSizeCost(debloatedBuffer) : 0;
            metadata = await extractMetadataFromZip(debloatedBuffer);
            githubInfo = parseGitHubUrl(url);
            encodedContent = debloatedBuffer.toString('base64');
            logger.info(`Converted zip file to Base64 string, encoded content:  ${encodedContent.substring(0, 100)}...`);
        }else if (req.body.Content) {
            logger.info("Base64 ZIP upload detected.");
            logger.info("Decoding Base64 string.");
            const decodedBuffer = Buffer.from(req.body.Content, 'base64');
            logger.info("Checking and calling if debloating is required.");
            const fileBuffer = shouldDebloat ? await debloatPackage(decodedBuffer) : decodedBuffer;
            sizeCost = calculateSizeCost ? await calculateTotalSizeCost(fileBuffer) : 0;
            metadata = await extractMetadataFromZip(fileBuffer);
            url = await getGithubUrlFromZip(fileBuffer);
            githubInfo = parseGitHubUrl(url);
            encodedContent = req.body.Content;
        }else {
            logger.info("Must upload a proper zip or provide a URL. 400 Invalid upload type");
            return res.sendStatus(400);
        }

        if (!githubInfo) {
            logger.info("400 Invalid GitHub repository URL.");
            return res.sendStatus(400);
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
            URL: url
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
            data: apiResponsePackageData
        };
        if(calculateSizeCost){
            Package.sizeCost = sizeCost;
        }

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
        logger.info(`Uploading package with file name: ${metadata.ID}`);
        await uploadToS3(metadata.ID, Buffer.from(encodedContent, 'base64'));
        res.json(Package);
    } catch (error) {
        logger.error('Error in POST /package: ', error);
        res.sendStatus(500);
    }
}

// debloat functions
export async function debloatPackage(buffer: Buffer): Promise<Buffer> {
    logger.info('debloatPackage: Debloating package');
    const { path: tmpDir, cleanup } = await tmp.dir({ unsafeCleanup: true });

    try {
        const zip = await JSZip.loadAsync(buffer); // works
        await unzipToDirectory(zip, tmpDir); //works
        await debloat(tmpDir);
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

async function debloat(directoryPath: string): Promise<void> {
    const entryPoint = await findEntryPoint(directoryPath); // works
    if (!entryPoint) {
        logger.info(`Entry point not found`);
        throw new Error('Entry point not found');
    }

    // Minify the output files with Terser
    try {
        const files = await fs.readdir(directoryPath);
        for (const file of files) {
            if (file.endsWith('.js')) {
                const filePath = path.join(directoryPath, file);
                const code = await fs.readFile(filePath, 'utf8');
                const result = await minify(code, {
                    compress: {
                        arguments: true, // replace arguments[index] with function parameter name whenever possible
                        booleans_as_integers: true, // optimize boolean expressions as 0 or 1 for smaller output
                        drop_console: true, 
                        drop_debugger: true, 
                        pure_funcs: ['console.log'], 
                        passes: 3, // apply 3 compress transformations
                        toplevel: true, 
                        unused: true, 
                    },
                });
                if (result.code !== undefined) {
                    await fs.writeFile(filePath, result.code);
                } else {
                    throw new Error('Terser failed to minify the file.');
                }
            }
        }
        logger.info('Tree shaking and minification completed successfully');
    } catch (error) {
        logger.error(`debloat: Terser minification error: ${error}`);
        throw error;
    }
}


async function findEntryPoint(directoryPath: string): Promise<string | null> {
    logger.info(`findEntryPoint: Finding entry point in directory: ${directoryPath}`);

    // Check for the 'main' script in package.json
    const packageJsonPath = path.join(directoryPath, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
        const packageJson = await fs.readJson(packageJsonPath);
        if (packageJson.main) {
            const mainPath = path.join(directoryPath, packageJson.main);
            // Check if the entry point specified in package.json exists
            if (await fs.pathExists(mainPath)) {
                logger.info(`findEntryPoint: Found entry point in package.json: ${mainPath}`);
                return mainPath;
            }
        }
    }

    //  up to 2 subdirectories deep
    async function searchForFile(filePath: string, currentDepth: number): Promise<string | null> {
        if (currentDepth > 2) { 
            return null;
        }
        if (await fs.pathExists(filePath)) {
            return filePath;
        } else {
            // Get the directory of the current file path
            const dir = path.dirname(filePath);
            const items = await fs.readdir(dir, { withFileTypes: true });
            for (const item of items) {
                if (item.isDirectory()) {
                    //  new path to search within the subdirectory
                    const deeperPath = path.join(dir, item.name, path.basename(filePath));
                    const foundPath = await searchForFile(deeperPath, currentDepth + 1);
                    if (foundPath) {
                        return foundPath;
                    }
                }
            }
        }
        return null;
    }
    
    const commonEntryPoints = ['index.js', 'main.js', 'app.js', 'server.js', 'build.js'];
    for (const entry of commonEntryPoints) {
        const potentialEntryPoint = path.join(directoryPath, entry);
        const foundEntryPoint = await searchForFile(potentialEntryPoint, 0);
        if (foundEntryPoint) {
            logger.info(`findEntryPoint: Entry point found: ${foundEntryPoint}`);
            return foundEntryPoint;
        }
    }

    logger.info(`findEntryPoint: Entry point not found after checking package.json and common files`);
    return null; // No entry point found after all checks
}

export async function rezipDirectory(directoryPath: string): Promise<Buffer> {
    const zip = new JSZip();
    await addDirectoryToZip(zip, directoryPath, directoryPath);
    return zip.generateAsync({
        type: "nodebuffer",
        compression: "DEFLATE",
        compressionOptions: {
            level: 9 
        }
    });
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
            const zipPath = path.relative(rootPath, fullPath); 
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

        if (!packageID) {
            logger.info(`Error in getPackageDownload: Package name is undefined`);
            return res.sendStatus(400);
        }
        const dbPackage = await prismaCalls.getPackage(packageID as string);
        if (!dbPackage) {
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
        const responsePackage = {
            metadata: packageMetadata,
            data: {
                Content: base64Content.substring(0, 100) + '...'
            }
        };
        logger.info(`200 getPackageDownload response: ${JSON.stringify(responsePackage)}`);
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
        if(!metadata){
            logger.info(`Error in updatePackage: metaData is undefined`);
            return res.sendStatus(400);
        }
        const data = req.body?.data;
        if(!data){
            logger.info(`Error in updatePackage: datas is undefined`);
            return res.sendStatus(400);
        }
        if(!data?.URL && !data?.Content) {
            logger.info("Error in updatePackage: No Content or URL provided in the upload");
            return res.sendStatus(400);
        }
        if(data?.URL && data?.Content) {
            logger.info("Error in updatePackage: Must upload either Base64 ZIP or URL, not both.");
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
        if(!S3Link){
            logger.info(`Error in updatePackage: S3Link is null`);
            return res.sendStatus(500);
        }

        let packageContent = data?.Content ? Buffer.from(data.Content, 'base64') : await downloadFromS3(S3Link);

        if(shouldDebloat){
            packageContent = await debloatPackage(packageContent);
        }

        let sizeCost = null;
        if(calculateSizeCost){
            sizeCost = await calculateTotalSizeCost(Buffer.from(S3Link, 'base64'));
        }
        const updatedData = await prismaCalls.updatePackageDetails(packageId, {...data});
        if(!updatedData){
            logger.info(`Error in updatePackage: updatedData is null`);
            return res.sendStatus(500);
        }
        await uploadToS3(metadata.ID, packageContent);
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
        const bucketName2 = process.env.TRANSACTION_BUCKET_NAME;
        if (!bucketName) {
            logger.info(`callResetDatabase: AWS S3 bucket name is not defined in environment variables.`)
            throw new Error("AWS S3 bucket name is not defined in environment variables.");
        }
        if (!bucketName2) {
            logger.info(`callResetDatabase: 2nd AWS S3 bucket name is not defined in environment variables.`)
            throw new Error("2nd AWS S3 bucket name is not defined in environment variables.");
        }
        await emptyS3Bucket(bucketName);
        await emptyS3Bucket(bucketName2);
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
        const packageID = req.params?.id;

        if (!packageID) {
            logger.info(`Error in retrieveAndDeletePackage: Package ID is undefined`);
            return res.sendStatus(400);
        }

        const packagecount = await prismaCalls.checkPackageExists(undefined, undefined, packageID)
        if (!packagecount) {
            logger.info(`Error in retrieveAndDeletePackage: Package not found`);
            return res.sendStatus(404);
        }

        await prismaCalls.deletePackage(packageID);
        logger.info(`Package with ID ${packageID} has been deleted.`);
        return res.sendStatus(200);
    } catch (error) {
        logger.info(`Error in retrieveAndDeletePackage: ${error}`);
        return res.sendStatus(500);
    }
}

export async function deletePackageByName(req: Request, res: Response) {
    try {
        console.log(req.params);
        const packageName = req.params?.name;

        if (packageName === undefined) {
            logger.info('Error in deletePackageByName: Name is undefined');
            return res.sendStatus(400);
        }

        const packageExists = await prismaCalls.checkPackageExists(packageName, undefined, undefined);
        if (!packageExists) {
            logger.info(`Package not found: ${packageName}`);
            return res.sendStatus(404);
        }
        // deletion
        const packageIDarray = await prismaCalls.getPackageIDs(packageName);
        for (const packageID of packageIDarray) {
            await prismaCalls.deletePackage(packageID);
        }

        logger.info(`Package deleted successfully: ${packageName}`);
        return res.sendStatus(200);
    } catch (error) {
        logger.error(`Error in deletePackageByName: ${error}`);
        return res.sendStatus(500);
    }
}

export async function initiateTransaction(req: Request, res: Response) {
    try {
        const transactionType = req.body.transactionType as prismaSchema.TransactionType;
        
        if (!transactionType || !['UPLOAD', 'DOWNLOAD', 'UPDATE', 'RATE'].includes(transactionType)) {
            logger.info(`Error in initiateTransaction: Invalid or missing transaction type`);
            return res.sendStatus(400)
        }

        const transactionId = uuidv4();

        const newTransaction = await prismaCalls.createTransaction(transactionId, transactionType);
        
        if (!newTransaction) {
            logger.info('Error in initiateTransaction: Failed to create new transaction');
            return res.sendStatus(500);
        }

        const responseObject = {
            transactionId: newTransaction.id,
            transactionType: newTransaction.type,
            status: newTransaction.status
        };

        logger.info(`Transaction initiated successfully: ${JSON.stringify(responseObject)}`);
        return res.status(200).json(responseObject);
    } catch (error) {
        logger.error(`Error in initiateTransaction: ${error}`);
        return res.sendStatus(500);
    }
}

export async function appendToUploadTransaction(req: Request, res: Response) {
    const transactionId = req.body.transactionId;
    const content = req.body.Content;
    const url = req.body.URL;

    if (!transactionId || !(content || url) || (content && url)) {
        logger.info('Invalid request data for transaction append');
        return res.sendStatus(400)
    }

    try {
        const transaction = await prismaCalls.getTransactionById(transactionId);
        if (!transaction) {
            logger.info(`Transaction ID not found: ${transactionId}`);
            return res.sendStatus(404);
        }

        if (transaction.status !== 'PENDING' || transaction.type !== 'UPLOAD') {
            logger.info(`Transaction is not in a state to be appended: ${transactionId}`);
            return res.sendStatus(422);
        }

        const transactionPackageId = uuidv4();

        let link = url;
        if (content) {
            const zipBuffer = Buffer.from(content, 'base64');
            if (!isValidZip(zipBuffer)) {
                logger.info('appendToUploadTransaction: Invalid ZIP file uploaded');
                return res.sendStatus(400);
            }
            const s3Path = `${transactionId}/${transactionPackageId}`;
            try {
                const transaction_bucket_name = process.env.TRANSACTION_BUCKET_NAME;
                if (!transaction_bucket_name) {
                    logger.info('appendToUploadTransaction: Transaction bucket name not configured.');
                    return res.sendStatus(500);
                }
                const uploadResult = await uploadToS3(s3Path, zipBuffer, process.env.TRANSACTION_BUCKET_NAME);
                link = uploadResult.Location;
            } catch (error) {
                logger.error(`appendToUploadTransaction: Error uploading to S3: ${error}`);
                return res.sendStatus(500);
            }
        }

        await prismaCalls.createTransactionPackage({
            packageid: transactionPackageId,
            transactionId,
            URL: link
        });

        logger.info(`TransactionPackage appended successfully: ${transactionPackageId}`);
        res.sendStatus(200);
    } catch (error) {
        logger.error(`Error appending to upload transaction: ${error}`);
        res.sendStatus(500);
    }
}

export async function executeUploadTransaction(req: Request, res: Response) {
    const transactionId = req.body.transactionId;
    if (!transactionId) {
        logger.info('Transaction ID is required');
        return res.sendStatus(400);
    }

    const transaction = await prismaCalls.getTransactionById(transactionId);
    logger.info(`Transaction: ${JSON.stringify(transaction)}`);
    if (!transaction) {
        logger.info(`Transaction ID not found: ${transactionId}`);
        return res.sendStatus(404);
    }
    if (transaction.status !== 'PENDING' || transaction.type !== 'UPLOAD') {
        logger.info(`Transaction is not in a state to be executed: ${transactionId}`);
        return res.sendStatus(422);
    }

    const transactionPackages = await prismaCalls.getTransactionPackages(transactionId);
    logger.info(`Transaction packages: ${JSON.stringify(transactionPackages)}`);
    if (!transactionPackages || transactionPackages.length === 0) {
        logger.info(`Transaction has no packages: ${transactionId}`);
        return res.sendStatus(404);
    }

    const successfulPackages = [];
    const packageResponses = [];

    let rollbackNeeded = false;
    let errorInfo = null;
    logger.info(`Executing upload transaction: ${transactionId}`);
    try {
        for (const curPackage of transactionPackages) {
            logger.info('Processing new transaction package');
            try {
                let metadata, encodedContent, githubInfo, url, sizeCost;
                if (!curPackage.URL) {
                    logger.info('Transaction package has no URL');
                    throw new Error('Transaction package has no URL');
                }
                if (isS3Link(curPackage.URL)) {
                    const buffer = await downloadFromS3(curPackage.URL);
                    metadata = await extractMetadataFromZip(buffer);
                    url = await getGithubUrlFromZip(buffer);
                    githubInfo = parseGitHubUrl(url);
                    encodedContent = buffer.toString('base64');
                    sizeCost = await calculateTotalSizeCost(buffer);
                }
                else {
                    url = await linkCheck(curPackage.URL);
                    if (!url) {
                        logger.info("Invalid or unsupported URL provided in a group upload.");
                        throw new Error("Invalid or unsupported URL provided in a group upload.");
                    }
                    const zipBuffer = await downloadGitHubRepoZip(url);
                    metadata = await extractMetadataFromZip(zipBuffer);
                    githubInfo = parseGitHubUrl(url);
                    encodedContent = zipBuffer.toString('base64');
                    sizeCost = await calculateTotalSizeCost(zipBuffer);
                }
                const packageExists = await prismaCalls.checkPackageExists(metadata.Name, metadata.Version);
                if (packageExists) {
                    logger.info("409 Package exists already.");
                    errorInfo = { statusCode: 409 };
                    throw new Error("409 Package exists already.");
                }
                if (!githubInfo) {
                    logger.info("Invalid GitHub repository URL in a group upload.");
                    errorInfo = { statusCode: 400 };
                    throw new Error("Invalid GitHub repository URL in a group upload.");
                }
                const metrics = await calculateGithubMetrics(githubInfo.owner, githubInfo.repo);
                if (!isPackageIngestible(metrics)) {
                    logger.info("424 Package is not uploaded due to the disqualified rating.");
                    errorInfo = { statusCode: 424 };
                    throw new Error("424 Package is not uploaded due to the disqualified rating.");
                }
                await prismaCalls.uploadMetadataToDatabase(metadata);

                const PackageData = { S3Link: curPackage.URL, URL: url };
                const apiResponsePackageData: apiSchema.PackageData = {
                    S3Link: PackageData.S3Link, 
                    URL: PackageData.URL
                };

                const truncatedContent = encodedContent.substring(0, 100) + '...';
                logger.info(`PackageData: ${JSON.stringify({ ...PackageData, Content: truncatedContent })}`);
                
                const packageResponse = {
                    metadata: {
                        Name: metadata.Name,
                        Version: metadata.Version,
                        ID: metadata.ID
                    },
                    data: {
                        Content: encodedContent
                    }
                };

                packageResponses.push(packageResponse);

                await prismaCalls.createPackageHistoryEntry(metadata.ID, Action.CREATE);
                await prismaCalls.storePackageDataInDatabase(metadata.ID, apiResponsePackageData);
                await prismaCalls.storePackageInDatabase({ metadata, data: apiResponsePackageData, sizeCost });
                await storeGithubMetrics(metadata.ID, metrics);
                await uploadToS3(metadata.ID, Buffer.from(encodedContent, 'base64'));

                successfulPackages.push(metadata.ID);
            } catch (error) {
                logger.info(`Error processing transaction package: ${error}`);
                rollbackNeeded = true;
                break;
            }
        }
    if (rollbackNeeded) {
        logger.info('Error processing transaction packages, rolling back');
        for (const packageId of successfulPackages) {
            try {
                logger.info(`Deleting package as part of the rollback process: ${packageId}`)
                const s3BucketName = process.env.S3_BUCKET_NAME;
                if (s3BucketName) {
                    await deleteFromS3(s3BucketName, packageId);
                } else {
                    logger.error('S3 bucket name not configured');
                }
            } catch (s3Error) {
                logger.error(`Error deleting package from S3 during rollback: ${s3Error}`);
            }
            await prismaCalls.deletePackage(packageId);
        }
        await prismaCalls.updateTransactionStatus(transactionId, 'FAILED');
        await prismaCalls.deleteTransactionPackages(transactionId);
        const transaction_bucket = process.env.TRANSACTION_BUCKET_NAME;
        if (transaction_bucket) {
            await deleteFromS3(transaction_bucket, `${transactionId}/`);
        } else {
            logger.error('Transaction bucket name not configured');
        }
        if (errorInfo) {
            return res.sendStatus(errorInfo.statusCode);
        } else {
            return res.sendStatus(500);
        }
    }
    logger.info('Deleting transaction packages');
    await prismaCalls.deleteTransactionPackages(transactionId);
    logger.info('Updating transaction status to completed')
    await prismaCalls.updateTransactionStatus(transactionId, 'COMPLETED');
    const transaction_bucket = process.env.TRANSACTION_BUCKET_NAME;
    if (transaction_bucket) {
        await deleteFromS3(transaction_bucket, `${transactionId}/`);
    } else {
        logger.error('Transaction bucket name not configured');
    }
    const response = { transactionId, packages: packageResponses };
    return res.status(200).json(response);
    } catch (error) {
        logger.error(`Error executing upload transaction: ${error}`);
        return res.sendStatus(500);
    }
}

function isS3Link(url: string) {
    const s3LinkPattern = 'amazonaws.com';
    return url.includes(s3LinkPattern);
}

async function deleteFromS3(bucketName: string, key: string): Promise<void> {
    try {
        if (key.endsWith('/')) {
            const listParams: AWS.S3.ListObjectsV2Request = {
                Bucket: bucketName,
                Prefix: key
            };
            const listedObjects = await s3.listObjectsV2(listParams).promise();

            if (listedObjects.Contents && listedObjects.Contents.length > 0) {
                const deleteParams: AWS.S3.DeleteObjectsRequest = {
                    Bucket: bucketName,
                    Delete: { Objects: listedObjects.Contents.map(({ Key }) => ({ Key: Key! })) }
                };

                await s3.deleteObjects(deleteParams).promise();

                if (listedObjects.IsTruncated) {
                    await deleteFromS3(bucketName, key);
                }
            }
        } else {
            const deleteParams: AWS.S3.DeleteObjectRequest = {
                Bucket: bucketName,
                Key: key
            };

            await s3.deleteObject(deleteParams).promise();
        }
    } catch (error) {
        console.error('Error in deleteFromS3:', error);
        throw error;
    }
}

export async function appendToRateTransaction(req: Request, res: Response) {
    const transactionId = req.body.transactionId;
    const packageId = req.body.packageId;

    if (!transactionId || !packageId) {
        logger.info('Missing transaction ID or package ID');
        return res.sendStatus(400);
    }

    try {
        const transaction = await prismaCalls.getTransactionById(transactionId);
        if (!transaction || transaction.type !== 'RATE') {
            logger.info(`Transaction not found or not a RATE transaction: ${transactionId}`);
            return res.sendStatus(404);
        }

        await prismaCalls.createTransactionPackage({
            packageid: packageId, 
            transactionId: transactionId
        });

        logger.info(`Package ID ${packageId} appended to transaction ${transactionId}`);
        res.sendStatus(200);
    } catch (error) {
        logger.error(`Error in appendToRateTransaction: ${error}`);
        res.sendStatus(500);
    }
}

export async function executeRateTransaction(req: Request, res: Response) {
    const transactionId = req.body?.transactionId;
    if (!transactionId) {
        logger.info('Error in executeRateTransaction: transactionId is undefined');
        return res.sendStatus(400);
    }

    try {
        const transaction = await prismaCalls.getTransactionById(transactionId);
        if (!transaction) {
            logger.info('Error in executeRateTransaction: Transaction not found');
            return res.sendStatus(404);
        }
        if (transaction.status !== 'PENDING' || transaction.type !== 'RATE') {
            logger.info('Error in executeRateTransaction: Transaction is not in a state to be executed');
            return res.sendStatus(422);
        }

        const transactionPackages = await prismaCalls.getTransactionPackages(transactionId);
        if (!transactionPackages || transactionPackages.length === 0) {
            logger.info('Error in executeRateTransaction: Transaction has no packages');
            return res.sendStatus(404);
        }

        const packageRatings = [];
        for (const curPackage of transactionPackages) {
            const packageRating = await prismaCalls.getPackageRatingById(curPackage.packageid);
            if (!packageRating) {
                logger.error(`Error in executeRateTransaction: No rating found for package ID ${curPackage.id}`);
                await prismaCalls.updateTransactionStatus(transactionId, 'FAILED');
                await prismaCalls.deleteTransactionPackages(transactionId);
                return res.sendStatus(404);
            }

            packageRatings.push({
                packageId: curPackage.id,
                rating: packageRating
            });
        }

        await prismaCalls.updateTransactionStatus(transactionId, 'COMPLETED');
        await prismaCalls.deleteTransactionPackages(transactionId);

        const response = {
            packages: packageRatings
        };
        res.status(200).json(response);
    } catch (error) {
        logger.error(`Error executing rate transaction: ${error}`);
        await prismaCalls.updateTransactionStatus(transactionId, 'FAILED');
        await prismaCalls.deleteTransactionPackages(transactionId);
        res.sendStatus(500);
    }
}

export async function appendToUpdateTransaction(req: Request, res: Response){
    const transactionId = req.body?.transactionId;
    const metaData = req.body?.metadata;
    const packageId = metaData?.ID;
    const data = req.body?.data;
    const url = data?.URL;
    if(!transactionId){
        logger.info(`Error in appendToUpdateTransaction: transactionId is undefined`);
        return res.sendStatus(400);
    }
    if(!packageId){
        logger.info(`Error in appendToUpdateTransaction: packageId is undefined`);
        return res.sendStatus(400);
    }
    if(!data){
        logger.info(`Error in appendToUpdateTransaction: data is undefined`);
        return res.sendStatus(400);
    }
    if(!url){
        logger.info(`Error in appendToUpdateTransaction: url is undefined`);
        return res.sendStatus(400);
    }
    if(!metaData){
        logger.info(`Error in appendToUpdateTransaction: metaData is undefined`);
        return res.sendStatus(400);
    }
    try{
        const exists = await prismaCalls.checkPackageExists(metaData.Name, metaData.Version, metaData.ID);
        if(!exists){
            logger.info(`Error in appendToUpdateTransaction: Package does not exist.`);
            return res.sendStatus(404);
        }

        await prismaCalls.createTransactionPackage({
            packageid: packageId,
            transactionId,
            URL: url
        });

        logger.info(`TransactionPackage appended successfully in update: ${packageId}`);
        res.sendStatus(200);
    }catch(error){
        logger.error(`Error in appendToUpdateTransaction: ${error}`);
        res.sendStatus(500);
    }
}

export async function executeUpdateTransaction(req: Request, res: Response){
    const transactionId = req.body?.transactionId;
    if(!transactionId){
        logger.info(`Error in executeUpdateTransaction: transactionId is undefined`);
        return res.sendStatus(400);
    }

    const transaction = await prismaCalls.getTransactionById(transactionId);
    logger.info(`Transaction: ${JSON.stringify(transaction)}`);
    if(!transaction){
        logger.info(`Error in executeUpdateTransaction: Transaction not found`);
        return res.sendStatus(404);
    }
    if(transaction.status !== 'PENDING' || transaction.type !== 'UPDATE'){
        logger.info(`Error in executeUpdateTransaction: Transaction is not in a state to be executed`);
        return res.sendStatus(422);
    }

    const transactionPackages = await prismaCalls.getTransactionPackages(transactionId);
    logger.info(`Transaction packages: ${JSON.stringify(transactionPackages)}`);
    if(!transactionPackages || transactionPackages.length === 0){
        logger.info(`Error in executeUpdateTransaction: Transaction has no packages`);
        return res.sendStatus(404);
    }

    let rollbackNeeded = false;
    logger.info(`Executing update transaction: ${transactionId}`);
    try{
        for(const curPackage of transactionPackages){
            logger.info('Processing new upload transaction package');
            try{
                if(!curPackage.URL){
                    logger.info('Transaction package has no URL');
                    throw new Error('Transaction package has no URL');
                }
                if(isS3Link(curPackage.URL)){
                    const packageContent = await downloadFromS3(curPackage.URL);
                    await uploadToS3(curPackage.packageid, packageContent);
                }else{
                    const updateData = await prismaCalls.updatePackageDetails(curPackage.packageid, {URL: curPackage.URL});
                    if(!updateData){
                        logger.info(`Error in executeUpdateTransaction: updateData is null`);
                        return res.sendStatus(500);
                    }
                }
            }catch(error){
                logger.info(`Error processing transaction package: ${error}`);
                rollbackNeeded = true;
                break;
            }
        }
        if(rollbackNeeded){
            logger.info('Error processing transaction packages, rolling back');
            await prismaCalls.updateTransactionStatus(transactionId, 'FAILED');
            await prismaCalls.deleteTransactionPackages(transactionId);
            throw new Error('Error processing transaction packages, rolling back');
        }
        await prismaCalls.updateTransactionStatus(transactionId, 'COMPLETED');
        await prismaCalls.deleteTransactionPackages(transactionId);
        return res.sendStatus(200);
    }catch(error){
        logger.error(`Error executing update transaction: ${error}`);
        await prismaCalls.updateTransactionStatus(transactionId, 'FAILED');
        await prismaCalls.deleteTransactionPackages(transactionId);
        return res.sendStatus(500);
    }
}

export async function appendToDownloadTransaction(req : Request, res : Response){
    const transactionId = req.body?.transactionId;
    const packageId = req.body?.packageId;
    if(!transactionId){
        logger.info(`Error in appendToDownloadTransaction: transactionId is undefined`);
        return res.sendStatus(400);
    }
    if(!packageId){
        logger.info(`Error in appendToDownloadTransaction: packageId is undefined`);
        return res.sendStatus(400);
    }
    try{
        const exists = await prismaCalls.checkPackageExists(undefined, undefined, packageId);
        if(!exists){
            logger.info(`Error in appendToDownloadTransaction: Package does not exist.`);
            return res.sendStatus(404);
        }
        const S3Link = await prismaCalls.getS3Link(packageId);
        if(!S3Link){
            logger.info(`Error in appendToDownloadTransaction: S3Link is null`);
            return res.sendStatus(500);
        }
        await prismaCalls.createTransactionPackage({
            packageid: packageId,
            transactionId,
            URL: S3Link
        });
        logger.info(`TransactionPackage appended successfully in download: ${packageId}`);
        res.sendStatus(200);
    }catch(error){
        logger.error(`Error in appendToDownloadTransaction: ${error}`);
        res.sendStatus(500);
    }
}

export async function executeDownloadTransaction(req: Request, res: Response){
    const transactionId = req.body?.transactionId;
    if(!transactionId){
        logger.info(`Error in executeDownloadTransaction: transactionId is undefined`);
        return res.sendStatus(400);
    }

    try{
        const transaction = await prismaCalls.getTransactionById(transactionId);
        logger.info(`Transaction: ${JSON.stringify(transaction)}`);
        if(!transaction){
            logger.info(`Error in executeDownloadTransaction: Transaction not found`);
            return res.sendStatus(404);
        }

        if(transaction.status !== 'PENDING' || transaction.type !== 'DOWNLOAD'){
            logger.info(`Error in executeDownloadTransaction: Transaction is not in a state to be executed`);
            return res.sendStatus(422);
        }

        const transactionPackages = await prismaCalls.getTransactionPackages(transactionId);
        logger.info(`Transaction packages: ${JSON.stringify(transactionPackages)}`);
        if(!transactionPackages || transactionPackages.length === 0){
            logger.info(`Error in executeDownloadTransaction: Transaction has no packages`);
            return res.sendStatus(404);
        }

        const packageResponses = [];
        logger.info(`Executing download transaction: ${transactionId}`);
        for(const curPackage of transactionPackages){
            logger.info('Processing new download transaction package');
            if(!curPackage.URL){
                logger.info('Transaction package has no URL');
                throw new Error('Transaction package has no URL');
            }
            if(!isS3Link(curPackage.URL)){
                logger.info('Transaction package has no S3 link');
                throw new Error('Transaction package has no S3 link');
            }
            const packageContent = await downloadFromS3(curPackage.URL);
            const dbPackage = await prismaCalls.getPackage(curPackage.packageid);
            if(!dbPackage){
                logger.info(`Error in executeDownloadTransaction: Package not found`);
                return res.sendStatus(404);
            }
            const base64Content = packageContent.toString('base64');
            const packageMetaData: apiSchema.PackageMetadata = {
                Name: dbPackage.metadata.name,
                Version: dbPackage.metadata.version,
                ID: dbPackage.metadata.id,
            };
            const apiResponsePackageData: apiSchema.ApiResponsePackageData = {
                Content: base64Content,
            };
            const packageResponse: apiSchema.Package = {
                metadata: packageMetaData,
                data: apiResponsePackageData,
            };
            packageResponses.push(packageResponse);
        }
        await prismaCalls.updateTransactionStatus(transactionId, 'COMPLETED');
        await prismaCalls.deleteTransactionPackages(transactionId);
        return res.status(200).json(packageResponses);
    }
    catch(error){
        logger.error(`Error executing download transaction: ${error}`);
        await prismaCalls.updateTransactionStatus(transactionId, 'FAILED');
        await prismaCalls.deleteTransactionPackages(transactionId);
        return res.sendStatus(500);
    }
}
