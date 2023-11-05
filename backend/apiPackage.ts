import * as apiSchema from './apiSchema';
import { Request, Response } from 'express';
import * as prismaCalls from './prismaCalls';
import * as prismaSchema from '@prisma/client';
import JSZip from 'jszip';
import { v4 as uuidv4 } from 'uuid';
import semver from 'semver';

function getMaxVersion(versionRange: string) {
    versionRange = versionRange.replace(/-0/g, '');
    const versions = versionRange.match(/\d+\.\d+\.\d+/g);
    if (versions && versions.length > 0) {
        return versions[versions.length - 1];
    } else {
        console.log('Error in getMaxVersion: No versions found in range');
        process.exit(1);
    }
}

export function parseVersion(version: string) {
    const comparators = semver.toComparators(version);
    const validRange = comparators.map((comparatorSet) => comparatorSet.join(' ')).join(' || ');
    const minVersion = semver.minVersion(validRange)?.version;
    if (minVersion === null) {
        console.log('Error in parseVersion: minVersion is null');
        process.exit(1);
    }
    if (minVersion === undefined) {
        console.log('Error in parseVersion: minVersion is undefined');
        process.exit(1);
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

export async function getPackages(req: Request, res: Response) {
    try {
        const offset = req.query?.offset === undefined ? 1 : parseInt(req.query.offset as string);
        if (req.body?.Name === undefined) {
            return res.status(400).send(`Error in getPackageMetaData: Name is undefined`);
        }
        if (req.body?.Version === undefined) {
            return res.status(400).send(`Error in getPackageMetaData: Version is undefined`);
        }

        const queryName = req.body.name as string;
        //use parseVersion function to get min and max version, and whether they are inclusive
        const { min: minVersion, max: maxVersion, minInclusive: minInclusive, maxInclusive: maxInclusive } = parseVersion(req.body.Version as string);

        const dbPackageMetaData = await prismaCalls.getMetaDataByQuery(queryName, minVersion, maxVersion, minInclusive, maxInclusive, offset);
        if (dbPackageMetaData === null) {
            return res.status(500).send(`Error in getPackageMetaData: packageMetaData is null`);
        }
        const apiPackageMetaData: apiSchema.PackageMetadata[] = dbPackageMetaData.map((dbPackageMetaData: prismaSchema.PackageMetadata) => {
            const metaData: apiSchema.PackageMetadata = {
                Name: dbPackageMetaData.name,
                Version: dbPackageMetaData.version,
                ID: dbPackageMetaData.id,
            };
            return metaData;
        });
        res.setHeader('offset', offset);
        return res.status(200).json(apiPackageMetaData);
    } catch (error) {
        return res.status(500).send(`Error in getPackageMetaData: ${error}`);
    }
}

export async function getPackagesByName(req: Request, res: Response) {
    try {
        if (req.params?.name === undefined) {
            return res.status(400).send(`Error in getPackagesByName: Name is undefined`);
        }
        const queryName = req.params.name;
        const dbPackageHistories = await prismaCalls.getPackageHistories(queryName);
        if (dbPackageHistories === null) {
            return res.status(500).send(`Error in getPackagesByName: dbPackageHistories is null`);
        }
        const apiPackageHistories: apiSchema.PackageHistoryEntry[] | null = dbPackageHistories.map((dbPackageHistory) => {
            const historyEntry: apiSchema.PackageHistoryEntry = {
                User: {
                    name: dbPackageHistory.user.name,
                    isAdmin: dbPackageHistory.user.isAdmin,
                },
                Date: dbPackageHistory.date.toISOString(),
                PackageMetadata: {
                    Name: dbPackageHistory.metadata.name,
                    Version: dbPackageHistory.metadata.version,
                    ID: dbPackageHistory.metadata.id,
                },
                Action: dbPackageHistory.action,
            };
            return historyEntry;
        });
        return res.status(200).json(apiPackageHistories);
    } catch (error) {
        return res.status(500).send(`Error in getPackagesByName: ${error}`);
    }
}

export async function getPackagesByRegEx(req: Request, res: Response) {
    try {
        if (req.body?.RegEx === undefined) {
            return res.status(400).send(`Error in getPackagesByRegEx: RegEx is undefined`);
        }
        const regEx: string = req.body.RegEx;
        const dbPackageMetaData = await prismaCalls.getMetaDataByRegEx(regEx);
        if (dbPackageMetaData === null) {
            return res.status(500).send(`Error in getPackagesByRegEx: dbPackageMetaData is null`);
        }
        const apiPackageMetaData: apiSchema.PackageMetadata[] = dbPackageMetaData.map((dbPackageMetaData: prismaSchema.PackageMetadata) => {
            const metaData: apiSchema.PackageMetadata = {
                Name: dbPackageMetaData.name,
                Version: dbPackageMetaData.version,
                ID: dbPackageMetaData.id,
            };
            return metaData;
        });
        return res.status(200).json(apiPackageMetaData);
    } catch (error) {
        return res.status(500).send(`Error in getPackagesByRegEx: ${error}`);
    }
}

export async function extractMetadataFromZip(filebuffer: Buffer): Promise<apiSchema.PackageMetadata> {
  const zip = await JSZip.loadAsync(filebuffer);
  
  let packageFile = zip.file("package.json");
  
  // If the top-level package.json is not found, search for any package.json in the ZIP.
  if (!packageFile) {
    const files = zip.file(/^.*package.json$/);  // This will return an array of matching files.
    if (files.length > 0) {
      packageFile = files[0];  // Use the first match.
    }
  }
  
  if (!packageFile) {
    throw new Error("package.json not found inside the zip.");
  }

  const packageContent = await packageFile.async('string');
  const packageJson = JSON.parse(packageContent);

  return {
    Name: packageJson.name,
    Version: packageJson.version,
    ID: uuidv4(),
  }
}

// For: get package download
export async function getPackageDownload(req: Request, res: Response) {
	try {
		const packageID = req.query.name;

		if (packageID === undefined) {
			return res.status(400).send('Package name or version is undefined');
		}
		const dbPackage = await prismaCalls.getPackage(packageID as string);
		if (dbPackage === null) {
			return res.status(404).send('Package not found');
		}
        
		const apiPackage: apiSchema.Package = {
			metadata: {
				Name: dbPackage.metadata.name,
				Version: dbPackage.metadata.version,
				ID: dbPackage.metadata.id,
			},
			data: {
				Content: dbPackage.data.content,
				URL: dbPackage.data.URL,
				JSProgram: dbPackage.data.JSProgram,
			},
		};
		return res.status(200).json(apiPackage);
	} catch (error) {
		return res.status(500).send(`Error in getPackageDownload: ${error}`);
	}
}

// For: put package update
export async function updatePackage(req: Request, res: Response) {
	try {
		// Validate required package fields from the request body
		const { metadata, data } = req.body as apiSchema.Package;

		// Validate required fields
		if (!metadata || !data || !metadata.Name || !metadata.Version || !metadata.ID) {
			return res.status(400).send('All fields are required and must be valid.');
		}

		const packageId = req.params.id;
		if (!packageId) {
			return res.status(400).send('Package ID is required.');
		}

		if (packageId !== metadata.ID) {
			return res.status(400).send('Package ID in the URL does not match the ID in the request body.');
		}

		//update the package data only
		try {
			const updatedData = await prismaCalls.updatePackageDetails(packageId, data);
			return res.status(200).json({ Data: updatedData });
		} catch (error) {
			if (error instanceof Error) {
				if (error.message.includes('do not match')) {
					return res.status(400).send('Package ID, name, or version do not match.');
				}
				return res.status(404).send('Package does not exist.');
			}
		}
	} catch (error) {
		console.error(`Error in updatePackage: ${error}`);
		return res.status(500).send(`Server error: ${error}`);
	}
}

