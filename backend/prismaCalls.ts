import * as prismaSchema from '@prisma/client';
import * as apiSchema from './apiSchema';
const prisma = new prismaSchema.PrismaClient();

async function uploadPackage(packageData: apiSchema.AuthenticationRequest) {}

export async function getMetaDataByQuery(queryName: apiSchema.PackageName, minVersion: string, maxVersion: string, minInclusive: boolean, maxInclusive: boolean, offset : number): Promise<prismaSchema.PackageMetadata[] | null> {
    try {
        // Ensure that the offset is at least 1 (treat 0 as page 1)
        const page = Math.max(1, offset);

        // Calculate the number of records to skip based on the page number and page size
        const pageSize = 10;
        const recordsToSkip = (page - 1) * pageSize;

        let whereCondition = {
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
        console.log(`Error in getMetaDataByQuery: ${error}`);
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
        console.log(`Error in getPackageHistories: ${error}`);
        return null;
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
