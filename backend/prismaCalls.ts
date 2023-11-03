import * as prismaSchema from '@prisma/client'
import { Action } from '@prisma/client'
import * as apiSchema from './apiSchema'
import createModuleLogger from '../src/logger';

const logger = createModuleLogger('Prisma Calls');
const prisma = new prismaSchema.PrismaClient();

//async function uploadPackage(packageData : apiSchema.AuthenticationRequest) {
//}

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
        logger.info(`Error in getMetaDataArray: ${error}`);
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
