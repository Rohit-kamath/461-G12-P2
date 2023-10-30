import * as prismaSchema from '@prisma/client'
import * as apiSchema from './apiSchema'

const prisma = new prismaSchema.PrismaClient();

// async function uploadPackage(packageData : apiSchema.AuthenticationRequest) {
// }

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
// For download endpoint
export async function getPackageWithMetadataAndData(queryName: string, version: string): Promise<{ metadata: prismaSchema.PackageMetadata, data: prismaSchema.PackageData } | null> {
    try {
        const packageEntry = await prisma.package.findFirst({
            where: {
                metadata: {
                    name: queryName,
                    version: version
                }
            },
            include: {
                metadata: true,
                data: true
            }
        });

        if (!packageEntry || !packageEntry.data || !packageEntry.metadata) {
            return null;
        }

        return {
            metadata: packageEntry.metadata,
            data: packageEntry.data
        };
    } catch (error) {
        console.log(`Error in getPackageWithMetadataAndData: ${error}`);
        return null;
    }
}

// For update endpoint
export async function updatePackageDetails(name: string, version: string, content: string, URL: string, JSProgram: string) {
    try {
        // find the package
        const existingPackage = await prisma.package.findFirst({
            where: {
                metadata: {
                    name: name,
                    version: version
                }
            }
        });

        if (!existingPackage) return null;

        // Update the PackageData related to this package
        const updatedData = await prisma.packageData.update({
            where: { id: existingPackage.dataId },
            data: {
                content: content,
                URL: URL,
                JSProgram: JSProgram
            }
        });

        return updatedData;
    } catch (error) {
        console.log(`Error in updatePackageDetails: ${error}`);
        return null;
    }
}