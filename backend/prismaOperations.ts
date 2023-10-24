import { PrismaClient } from '@prisma/client'
import * as apiSchema from './apiSchema'
const prisma = new PrismaClient()

async function dbUploadPackage(packageData : apiSchema.AuthenticationRequest) {
}

//parameters: packageName,
export async function dbGetPackage(queryName : apiSchema.PackageName, minVersion : string, maxVersion : string) : Promise<apiSchema.PackageMetadata[] | null> {
    //in the future, have to parse query.Version to get a version range
    //also, will have to handle paginated request with a skip and take parameter
    try{
        const packages : apiSchema.PackageMetadata[] = await prisma.packageMetaData.findMany({
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
        console.log(`Error in dbGetPackage: ${error}`);
        return null;
    }
}