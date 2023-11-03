import * as prismaSchema from '@prisma/client';
import { Action } from '@prisma/client'
import * as apiSchema from './apiSchema';
import createModuleLogger from '../src/logger';

const logger = createModuleLogger('Prisma Calls');
const prisma = new prismaSchema.PrismaClient();

export async function getMetaDataByQuery(queryName: apiSchema.PackageName, minVersion: string, maxVersion: string, minInclusive: boolean, maxInclusive: boolean, offset : number): Promise<prismaSchema.PackageMetadata[] | null> {
    try {
        // Ensure that the offset is at least 1 (treat 0 as page 1)
        const page = Math.max(1, offset);

        // Calculate the number of records to skip based on the page number and page size
        const pageSize = 10;
        const recordsToSkip = (page - 1) * pageSize;

        const whereCondition = {
            version: {
            [minInclusive ? 'gte' : 'gt']: maxVersion,
            [maxInclusive ? 'lte' : 'lt']: minVersion,
            },
        };

        if (queryName !== '*') {
            (whereCondition as any).name = queryName;
        }

        const packages = await prisma.packageMetadata.findMany({
            where: whereCondition,
            skip: recordsToSkip, // Use skip to implement pagination
            take: pageSize, // Specify the number of records to retrieve for the current page
        });

        return packages;
    } catch (error) {
        logger.info(`Error in getMetaDataArray: ${error}`);
        return null;
    }
}

export async function getPackageHistories(queryName: apiSchema.PackageName) {
    try {
        const packageHistories = await prisma.packageHistoryEntry.findMany({
            where: {
                metadata: {
                    name: queryName,
                },
            },
            include: {
                user: true,
                metadata: true,
            },
        });
        return packageHistories;
    } catch (error) {
        logger.info(`Error in getPackageHistories: ${error}`);
        return null;
    }
}

export async function uploadMetadataToDatabase(metadata: apiSchema.PackageMetadata): Promise<void> {
    try {
        await prisma.packageMetadata.create({
            data: {
                name: metadata.Name,
                version: metadata.Version,
                id: metadata.ID
            }
        });
    } catch (error) {
        logger.info(`Error in uploadMetadataToDatabase: ${error}`);
        throw new Error('Failed to upload metadata to the database.');
    }
}

export async function createPackageHistoryEntry(metadataId: string, userId: number, action: Action): Promise<void> {
    try {
        await prisma.packageHistoryEntry.create({
            data: {
                metadataId: metadataId,
                userId: userId,
                action: action,
                date: new Date(),
            }
        });
    } catch (error) {
        logger.info(`Error in createPackageHistoryEntry: ${error}`);
        throw new Error('Failed to create package history entry in the database.');
    }
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
        console.error(`Error in getMetaDataArray: ${error}`);
        return null;
    }
}
