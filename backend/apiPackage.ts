import * as apiSchema from './apiSchema';
import { Request, Response } from 'express';
import * as prismaCalls from './prismaCalls';
import * as prismaSchema from '@prisma/client';
import JSZip from 'jszip';
import { v4 as uuidv4 } from 'uuid';
import AWS from 'aws-sdk';
import { ManagedUpload } from 'aws-sdk/clients/s3';
import createModuleLogger from '../src/logger';
import { NET_SCORE } from '../src/controllers/netScore';
import semver from 'semver';
import { Action } from '@prisma/client';

const logger = createModuleLogger('API Package Calls');

const s3 = new AWS.S3({
  accessKeyId:  process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'us-east-2'
});


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