import { PrismaClient } from '@prisma/client'
import * as apiSchema from './apiSchema'
const prisma = new PrismaClient()

async function dbUploadPackage(packageData : apiSchema.Package) {
}