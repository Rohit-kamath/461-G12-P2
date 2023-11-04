import * as prismaSchema from '@prisma/client';
import * as apiSchema from './apiSchema';
const prisma = new prismaSchema.PrismaClient();

export async function getMetaDataByQuery(queryName: apiSchema.PackageName, minVersion: string, maxVersion: string, minInclusive: boolean, maxInclusive: boolean, offset : number): Promise<prismaSchema.PackageMetadata[] | null> {
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
        console.log(`Error in getMetaDataByQuery: ${error}`);
        return null;
    }
}

type FullHistoryEntry = prismaSchema.Prisma.PackageHistoryEntryGetPayload<{
    include: {
        metadata: true;
        user: true;
    };
}>;

export async function getPackageHistories(queryName: apiSchema.PackageName) : Promise<FullHistoryEntry[] | null>{
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
        console.error(`Error in uploadMetadataToDatabase: ${error}`);
        throw new Error('Failed to upload metadata to the database.');
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
type FullPackage = prismaSchema.Prisma.PackageGetPayload<{
    include: {
        metadata: true;
        data: true;
    };
}>;

export async function getPackage(queryID: apiSchema.PackageID) : Promise<FullPackage | null>{
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
		console.error(`Error in getPackage: ${error}`);
		return null;
	}
}

// For update endpoint
export async function updatePackageDetails(
	packageId: apiSchema.PackageID,
	packageData: apiSchema.PackageData,
): Promise<apiSchema.PackageData | null> {
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
		console.error(`Error in updatePackageDetails: ${error}`);
		return null;
	}
}
