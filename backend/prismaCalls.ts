import * as prismaSchema from '@prisma/client'
import * as apiSchema from './apiSchema'
const prisma = new prismaSchema.PrismaClient();

async function uploadPackage(packageData : apiSchema.AuthenticationRequest) {
}

export async function getMetaDataArray(queryName : apiSchema.PackageName, minVersion : string, maxVersion : string) : Promise<prismaSchema.PackageMetadata[] | null> {
    //in the future, have to handle paginated request with a skip and take parameter
    try{
        const packages = await prisma.packageMetadata.findMany({
            where: {
                name: queryName,
                version: {
                    gte: maxVersion,
                    lte: minVersion
                }
            }
        })
        return packages;
    } catch (error) {
        console.log(`Error in getMetaDataArray: ${error}`);
        return null;
    }
}

export async function getPackageHistories(queryName: apiSchema.PackageName){
    try{
        const packageHistories = await prisma.packageHistoryEntry.findMany({
            where: {
                metadata: {
                    name: queryName
                }
            },
            include: {
                user: true,
                metadata: true
            }
        })
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