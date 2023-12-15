import axios from 'axios';
import * as apiSchema from "../backend/apiSchema";
import createModuleLogger from '../src/logger';
const APIURL = 'http://ece461-packageregistry-depenv.eba-bphpcw3d.us-east-2.elasticbeanstalk.com';
const logger = createModuleLogger('getPackageByID.test.ts');
const axiosInstance = axios.create({baseURL: APIURL, headers : {"x-authorization": "0"}});
logger.info("Starting tests for getPackageByID.test.ts");
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

describe('GET /package/{id} endpoint', () => {
    it('should return 404 status code for an invalid package id', async () => {
        try {
            await axiosInstance.get(`/package/1234`);
            throw new Error('should not reach here');
        } catch (error: any) {
            expect(error.response.status).toBe(404);
        }
    });

    let packageID : apiSchema.PackageID;
    it('upload endpoint to put something in registry. should return 200 status code and something for a valid github repo link', async () => {
        try {
            const response= await axiosInstance.post(`package`, {
                "URL": "https://github.com/expressjs/express"
            });
            expect(response.status).toBe(201);
            const packageResponse : apiSchema.Package = response.data;
            packageID = packageResponse.metadata.ID;
        } catch (error: any) {
            console.log(error.response.status);
            throw error;
        }
    });

    it('should return 200 status code and something for a valid package id. Used to get package download', async () => {
        try {
            const response = await axiosInstance.get(`/package/${packageID}`);
            expect(response.status).toBe(200);
        } catch (error: any) {
            console.log(error.response.status);
            throw error;
        }
    });
});

describe('reset', () => { // rerun reset test for clean deployment
    it('should return 200 status code to signifiy successful reset', async () => {
        try {
            const response = await axiosInstance.delete(`/reset`);
            expect(response.status).toBe(200);
        } catch (error: any) {
            console.log(error.response.status);
            throw error;
        }
    });
});
logger.info("Finished tests for getPackageByID.test.ts");