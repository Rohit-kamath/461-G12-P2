import * as prismaSchema from '@prisma/client';
import { Action } from '@prisma/client';
import * as apiSchema from './apiSchema';
import createModuleLogger from '../src/logger';
import { v4 as uuidv4 } from 'uuid';

const logger = createModuleLogger('Prisma Calls');
const prisma = new prismaSchema.PrismaClient();

type FullPackage = prismaSchema.Prisma.PackageGetPayload<{
    include: {
        metadata: true;
        data: true;
    };
}>;

export async function getMetaDataWithoutVersion(queryName: apiSchema.PackageName, offset : number): Promise<prismaSchema.PackageMetadata[] | null> {
    try {
        const page = Math.max(0, offset);

        const pageSize = 10;
        const recordsToSkip = page * pageSize;

        const packages = await prisma.packageMetadata.findMany({
            where: {
                name: queryName === '*' ? undefined : queryName,
            },
            skip: recordsToSkip, // Use skip to implement pagination
            take: pageSize, // Specify the number of records to retrieve for the current page
        });

        return packages;
    } catch (error) {
        logger.info(`Error in getMetaDataWithoutVersion: ${error}`);
        return null;
    }
}
export async function getMetaDataByQuery(queryName: apiSchema.PackageName, minVersion: string, maxVersion: string, minInclusive: boolean, maxInclusive: boolean, offset: number): Promise<prismaSchema.PackageMetadata[] | null> {
    try {
        // Ensure that the offset is at least 1 (treat 0 as page 1)
        const page = Math.max(0, offset);

        const pageSize = 10;
        const recordsToSkip = page * pageSize;

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
            User: {
                name: "ece30861defaultadminuser",
                isAdmin: true,
            },
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
        const metadataExists = await prisma.packageMetadata.findUnique({
            where: { id: metadataId },
        });
        if (!metadataExists) {
            throw new Error(`No metadata found for ID: ${metadataId}`);
        }

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

export async function checkPackageExists(packageName?: string, packageVersion?: string, packageID?: string): Promise<boolean> {
    logger.info(`checkPackageExists: Checking if package exists: ${packageName}@${packageVersion}`)
    const count = await prisma.packageMetadata.count({
        where: {
            name: packageName,
            version: packageVersion,
            id: packageID
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

export async function updatePackageDetails(packageId: apiSchema.PackageID, packageData: apiSchema.PackageData): Promise<apiSchema.PackageData | null> {
    try {
        // metadata has been validated in updatePackage
        const updatedData = await prisma.packageData.update({
            where: { id: packageId },
            data: {URL: packageData.URL ?? ''}
        });
        return updatedData;
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
                id: packageId,
            },
            action: Action.DOWNLOAD
        },
    });

    return downloadEntries.length;
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
        await prisma.transactionPackage.deleteMany();
        logger.info('Deleted transaction packages');
        await prisma.transaction.deleteMany();
        logger.info('Deleted transactions');
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

export async function storePackageDataInDatabase(metadataId: string, data: apiSchema.PackageData): Promise<prismaSchema.PackageData> {
    logger.info(`storePackageDataInDatabase: Storing package data in database`);

    if (data.S3Link === undefined || data.URL === undefined) {
        logger.info(`Error in storePackageDataInDatabase: One or more required fields are undefined`);
        throw new Error('Content and URL are required fields and cannot be undefined.');
    }

    try {
        const storedData = await prisma.packageData.create({
            data: {
                id: metadataId,
                S3Link: data.S3Link,
                URL: data.URL,
            },
        });
        return storedData;
    } catch (error) {
        logger.info(`Error in storePackageDataInDatabase: ${error}`);
        throw new Error('Failed to store package data in the database.');
    }
}

export async function storePackageInDatabase(packageData: apiSchema.Package): Promise<void> {
    try {
        await prisma.package.create({
            data: {
                id: uuidv4(), // Unique ID for the package
                metadataId: packageData.metadata.ID,
                dataId: packageData.metadata.ID, // Assuming PackageData ID matches Metadata ID
                sizeCost: packageData.sizeCost
            },
        });

        logger.info(`Package stored in database with metadataId: ${packageData.metadata.ID}`);
    } catch (error) {
        logger.error(`Error in storePackageInDatabase: ${error}`);
        throw new Error('Failed to store package in the database.');
    }
}

export async function getS3Link(metadataId: string): Promise<string | null> {
    try {
        const packageData = await prisma.packageData.findUnique({
            where: { id: metadataId },
        });

        if (!packageData) {
            logger.info(`No package data found for metadata ID: ${metadataId}`);
            return null;
        }

        return packageData.S3Link;
    } catch (error) {
        logger.error(`Error in getS3Link: ${error}`);
        throw error;
    }
}

export async function deletePackage(packageId: string): Promise<void> {
    await prisma.$transaction(async (prisma) => {
        const packageRecord = await prisma.package.findUnique({
            where: { metadataId: packageId },
        });
        
        if (packageRecord) {
            await prisma.package.delete({
                where: { id: packageRecord.id },
            });
        }

        await prisma.packageHistoryEntry.deleteMany({
            where: { metadataId: packageId },
        });

        const packageRating = await prisma.packageRating.findUnique({
            where: { metadataId: packageId },
        });
        if (packageRating) {
            await prisma.packageRating.delete({
                where: { metadataId: packageId },
            });
        }

        await prisma.packageMetadata.delete({
            where: { id: packageId },
        });

        const packageData = await prisma.packageData.findUnique({
            where: { id: packageId },
        });
        if (packageData) {
            await prisma.packageData.delete({
                where: { id: packageId },
            });
        }
    });
}

export async function deleteTransactionPackages(transactionId: string): Promise<void> {
    await prisma.$transaction(async (prisma) => {
        await prisma.transactionPackage.deleteMany({
            where: {
                transactionId: transactionId,
            },
        });
    });
}

export async function getPackageIDs(PackageName: string): Promise<string[]> {
    try {
        const packageIDs = await prisma.packageMetadata.findMany({
            where: {
                name: PackageName,
            },
            select: {
                id: true,
            },
        });

        return packageIDs.map((packageID) => packageID.id);
    } catch (error) {
        logger.error(`Error in getPackageIDs: ${error}`);
        throw new Error('Failed to retrieve package IDs from the database.');
    }
}

export async function createTransaction(transactionId: string, type: prismaSchema.TransactionType): Promise<prismaSchema.Transaction | null> {
    try {
        return await prisma.transaction.create({
            data: {
                id: transactionId,
                type: type,
                status: 'PENDING'
            }
        });
    } catch (error) {
        logger.error(`createTransaction: Error creating transaction in the database: ${error}`);
        return null;
    }
}

export async function createTransactionPackage(transactionData: { packageid: string; transactionId: string; URL?: string; }): Promise<void> {
    try {
        await prisma.transactionPackage.create({
            data: transactionData,
        });

        logger.info(`TransactionPackage created successfully: ${transactionData.packageid}`);
    } catch (error) {
        logger.error(`Error in createTransactionPackage: ${error}`);
        throw new Error('Failed to create TransactionPackage in the database.');
    }
}

export async function getTransactionById(id: string): Promise<prismaSchema.Transaction | null> {
    try {
        return await prisma.transaction.findUnique({
            where: { id },
        });
    } catch (error) {
        logger.error(`Error in getTransactionById: ${error}`);
        throw new Error('Failed to retrieve transaction from the database.');
    }
}

export async function getTransactionPackages(transactionId: string) {
    try {
        // Retrieve all packages associated with the given transaction ID
        const packages = await prisma.transactionPackage.findMany({
            where: { transactionId: transactionId },
            select: { id: true, packageid: true, URL: true }
        });

        return packages;
    } catch (error) {
        logger.error(`Error in getTransactionPackages: ${error}`);
        throw new Error('Failed to retrieve transaction packages from the database.');
    }
}

export async function updateTransactionStatus(transactionId: string, newStatus: string): Promise<void> {
    try {
        await prisma.transaction.update({
            where: {
                id: transactionId,
            },
            data: {
                status: newStatus,
            },
        });

        logger.info(`Transaction status updated successfully: ${transactionId} to ${newStatus}`);
    } catch (error) {
        logger.error(`Error in updateTransactionStatus: ${error}`);
        throw new Error('Failed to update transaction status in the database.');
    }
}