import axios from 'axios';
import * as apiSchema from "../backend/apiSchema";
import createModuleLogger from '../src/logger';
const APIURL = 'http://ece461-packageregistry-depenv.eba-bphpcw3d.us-east-2.elasticbeanstalk.com';
const axiosInstance = axios.create({baseURL: APIURL, headers : {"x-authorization": "0"}});
const logger = createModuleLogger('groupDownload.test.ts');

logger.info('Starting groupDownload.test.ts');
describe('reset', () => {
    it('should return 200 status code to signifiy successful reset. Used for clean test environment', async () => {
        try {
            const response = await axiosInstance.delete(`/reset`);
            expect(response.status).toBe(200);
        } catch (error: any) {
            console.log(error.response.status);
            throw error;
        }
    });
});
let packageId1 : apiSchema.PackageID;
let packageId2 : apiSchema.PackageID;

describe('upload a package', () => {
    it('upload endpoint to put something in registry. should return 200 status code and something for a valid github repo link', async () => {
        try {
            const response1 = await axiosInstance.post(`/package`, {
                "URL": "https://github.com/inversify/InversifyJS"
            });
            expect(response1.status).toBe(201);
            const package1Response : apiSchema.Package = response1.data;
            packageId1 = package1Response.metadata.ID;
        }catch(error: any) {
            console.log(error.response.status);
            throw error;
        }
    });
});

describe('upload another package', () => {
    it('upload endpoint to put something in registry. should return 200 status code and something for a valid github repo link', async () => {
        try {
            const response2 = await axiosInstance.post(`/package`, {
                "URL": "https://www.npmjs.com/package/express"
            });
            expect(response2.status).toBe(201);
            const package2Response : apiSchema.Package = response2.data;
            packageId2 = package2Response.metadata.ID;
        }catch(error: any) {
            console.log(error.response.status);
            throw error;
        }
    });
});

describe('initiate transaction', () => {
    let transactionId : string;
    it('initiate endpoint should return 200 status code and valid transaction ID', async () => {
        try {
            const response = await axiosInstance.post(`/transaction/initiate`, {
                "transactionType": "DOWNLOAD"
            });
            expect(response.status).toBe(200);
            transactionId = response.data.transactionId;
        } catch (error: any) {
            console.log(error.response.status);
            throw error;
        }
    });

    it('append endpoint should return 200 status code and valid transaction ID', async () => {
        try {
            const response = await axiosInstance.post(`/transaction/append/download`, {
                "transactionId": transactionId,
                "packageId": packageId1
            });
            expect(response.status).toBe(200);
        } catch (error: any) {
            console.log(error.response.status);
            throw error;
        }
    });

    it('append endpoint should return 200 status code and valid transaction ID', async () => {
        try {
            const response = await axiosInstance.post(`/transaction/append/download`, {
                "transactionId": transactionId,
                "packageId": packageId2
            });
            expect(response.status).toBe(200);
        } catch (error: any) {
            console.log(`error status in append 2: ${error.response.status}`);
            throw error;
        }
    });

    it('execute endpoint should return 200 status code and valid transaction ID', async () => {
        try {
            const response = await axiosInstance.post(`/transaction/execute/download`, {
                "transactionId": transactionId
            });
            expect(response.status).toBe(200);
        } catch (error: any) {
            console.log(error.response.status);
            throw error;
        }
    });
});

describe('reset', () => {
    it('should return 200 status code to signifiy successful reset. Used for clean test environment', async () => {
        try {
            const response = await axiosInstance.delete(`/reset`);
            expect(response.status).toBe(200);
        } catch (error: any) {
            console.log(error.response.status);
            throw error;
        }
    });
});
logger.info('Finished groupDownload.test.ts');