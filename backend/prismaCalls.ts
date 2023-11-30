import * as prismaSchema from '@prisma/client';
import { Action } from '@prisma/client';
import * as apiSchema from './apiSchema';
import createModuleLogger from '../src/logger';

const logger = createModuleLogger('Prisma Calls');
const prisma = new prismaSchema.PrismaClient();

type FullPackage = prismaSchema.Prisma.PackageGetPayload<{
    include: {
        metadata: true;
        data: true;
    };
}>;

export async function getMetaDataByQuery(queryName: apiSchema.PackageName, minVersion: string, maxVersion: string, minInclusive: boolean, maxInclusive: boolean, offset: number): Promise<prismaSchema.PackageMetadata[] | null> {
    try {
        // Ensure that the offset is at least 1 (treat 0 as page 1)
        const page = Math.max(1, offset);

        // Calculate the number of records to skip based on the page number and page size
        const pageSize = 10;
        const recordsToSkip = (page - 1) * pageSize;

        const packages = await prisma.packageMetadata.findMany({
            where: {
                version: {
                    [minInclusive ? 'gte' : 'gt']: maxVersion,
                    [maxInclusive ? 'lte' : 'lt']: minVersion,
                },
                name: queryName === '*' ? undefined : queryName,
            },
            skip: recordsToSkip, // Use skip to implement pagination
            take: pageSize, // Specify the number of records to retrieve for the current page
        });

        return packages;
    } catch (error) {
        logger.info(`Error in getMetaDataArray: ${error}`);
        return null;
    }
}

export async function getPackageHistories(queryName: apiSchema.PackageName): Promise<apiSchema.PackageHistoryEntry[] | null> {
    try {
        const packageHistories = await prisma.packageHistoryEntry.findMany({
            where: {
                metadata: {
                    name: queryName,
                },
            },
            include: {
                metadata: true,
            },
        });

        return packageHistories.map(history => ({
            Date: history.date.toISOString(),
            PackageMetadata: {
                Name: history.metadata.name,
                Version: history.metadata.version,
                ID: history.metadata.id,
            },
            Action: history.action,
        }));
    } catch (error) {
        logger.info(`Error in getPackageHistories: ${error}`);
        return null;
    }
}


export async function uploadMetadataToDatabase(metadata: apiSchema.PackageMetadata): Promise<void> {
    logger.info(`uploadMetadataToDatabase: Uploading metadata to database: ${metadata.Name}@${metadata.Version}`);
    try {
        await prisma.packageMetadata.create({
            data: {
                name: metadata.Name,
                version: metadata.Version,
                id: metadata.ID,
            },
        });
    } catch (error) {
        logger.info(`Error in uploadMetadataToDatabase: ${error}`);
        throw new Error('Failed to upload metadata to the database.');
    }
}

export async function createPackageHistoryEntry(metadataId: string, action: Action): Promise<void> {
    logger.info(`createPackageHistoryEntry: Creating package history entry for metadata ID: ${metadataId}`)
    try {
        // Check if metadataId exists
        const metadataExists = await prisma.packageMetadata.findUnique({
            where: { id: metadataId },
        });
        if (!metadataExists) {
            throw new Error(`No metadata found for ID: ${metadataId}`);
        }

        // Create PackageHistoryEntry
        await prisma.packageHistoryEntry.create({
            data: {
                metadataId: metadataId,
                action: action,
                date: new Date(),
            },
        });
    } catch (error) {
        logger.info(`Error in createPackageHistoryEntry: ${error}`);
        throw new Error('Failed to create package history entry in the database.');
    }
}

export async function checkPackageExists(packageName: string, packageVersion: string): Promise<boolean> {
    logger.info(`checkPackageExists: Checking if package exists: ${packageName}@${packageVersion}`)
    const count = await prisma.packageMetadata.count({
        where: {
            name: packageName,
            version: packageVersion,
        },
    });
    return count > 0;
}

export async function getMetaDataByRegEx(regEx: string): Promise<prismaSchema.PackageMetadata[] | null> {
    const timeoutPromise = new Promise<prismaSchema.PackageMetadata[] | null>((_, reject) => {
        setTimeout(() => {
            reject(new Error('Query timeout after 5 seconds'));
        }, 5000);
    });

    try {
        const packagesPromise = prisma.packageMetadata.findMany({
            where: {
                name: {
                    contains: regEx,
                },
            },
        });

        const result = await Promise.race([packagesPromise, timeoutPromise]);

        return result;
    } catch (error) {
        logger.info(`getMetaDataByRegEx error: ${error}`);
        console.error(`Error in getMetaDataArray: ${error}`);
        return null;
    }
}

export async function storeMetricsInDatabase(metadataId: string, packageRating: apiSchema.PackageRating): Promise<void> {
    try {
        await prisma.packageRating.create({
            data: {
                metadataId: metadataId,
                busFactor: packageRating.BusFactor,
                correctness: packageRating.Correctness,
                rampUp: packageRating.RampUp,
                responsiveMaintainer: packageRating.ResponsiveMaintainer,
                licenseScore: packageRating.LicenseScore,
                goodPinningPractice: packageRating.GoodPinningPractice,
                pullRequest: packageRating.PullRequest,
                netScore: packageRating.NetScore,
            },
        });

        logger.info('Package rating metrics stored in the database successfully.');
    } catch (error) {
        logger.info(`Error in storeMetricsInDatabase: ${error}`);
        throw new Error('Failed to store package rating metrics in the database.');
    }
}

export async function getPackage(queryID: apiSchema.PackageID): Promise<FullPackage | null> {
    try {
        const packageEntry = await prisma.package.findFirst({
            where: {
                metadata: {
                    id: queryID,
                },
            },
            include: {
                data: true,
                metadata: true,
            },
        });
        return packageEntry;
    } catch (error) {
        logger.info(`getPackage error: ${error}`);
        console.error(`Error in getPackage: ${error}`);
        return null;
    }
}

// For update endpoint
export async function updatePackageDetails(packageId: apiSchema.PackageID, packageData: apiSchema.PackageData): Promise<apiSchema.PackageData | null> {
    try {
        // metadata has been validated in updatePackage
        const updatedData = await prisma.packageData.update({
            where: { id: packageId },
            data: {
                content: packageData.Content ?? '', // nullish  to handle optional fields
                URL: packageData.URL ?? '',
                JSProgram: packageData.JSProgram ?? '',
            },
        });

        return {
            Content: updatedData.content,
            URL: updatedData.URL,
            JSProgram: updatedData.JSProgram,
        };
    } catch (error) {
        logger.info(`updatePackageDetails error: ${error}`);
        console.error(`Error in updatePackageDetails: ${error}`);
        return null;
    }
}

export async function checkMetricsExist(metadataId: string): Promise<boolean> {
    try {
        const existingMetrics = await prisma.packageRating.findUnique({
            where: { metadataId: metadataId },
        });
        return existingMetrics !== null;
    } catch (error) {
        logger.error(`Error in checkMetricsExist: ${error}`);
        throw error;
    }
}

export async function getDownloadCount(packageId: string): Promise<number> {
    const downloadEntries = await prisma.packageHistoryEntry.findMany({
        where: {
            metadata: {
            id: packageId, // Filtering by the package ID
            },
        action: Action.DOWNLOAD, // Filtering by the action "DOWNLOAD"
        },
    });

    return downloadEntries.length; // Return the length of the filtered entries
}


export async function resetDatabase() {
    try {
        await prisma.package.deleteMany();
        logger.info('Deleted packages');
        await prisma.packageData.deleteMany();
        logger.info('Deleted package data');
        await prisma.packageRating.deleteMany();
        logger.info('Deleted package ratings');
        await prisma.packageHistoryEntry.deleteMany();
        logger.info('Deleted package history');
        await prisma.packageMetadata.deleteMany();
        logger.info('Deleted package metadata');
    } catch (error) {
        logger.info('Error resetting database:', error);
    }
}

export async function getPackageRatingById(metadataId: string): Promise<apiSchema.PackageRating | null> {
    try {
        const packageRating = await prisma.packageRating.findUnique({
            where: {
                metadataId: metadataId,
            },
        });

        if (!packageRating) {
            logger.info(`No ratings found for package with ID: ${metadataId}`);
            return null;
        }

        return {
            BusFactor: packageRating.busFactor,
            Correctness: packageRating.correctness,
            RampUp: packageRating.rampUp,
            ResponsiveMaintainer: packageRating.responsiveMaintainer,
            LicenseScore: packageRating.licenseScore,
            GoodPinningPractice: packageRating.goodPinningPractice,
            PullRequest: packageRating.pullRequest,
            NetScore: packageRating.netScore,
        };
    } catch (error) {
        logger.error(`Error in getPackageRatingById: ${error}`);
        throw error;
    }
}
