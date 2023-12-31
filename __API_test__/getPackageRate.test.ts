import axios from 'axios';
import * as apiSchema from "../backend/apiSchema";
import createModuleLogger from '../src/logger';
const APIURL = 'http://ece461-packageregistry-depenv.eba-bphpcw3d.us-east-2.elasticbeanstalk.com';
const logger = createModuleLogger('getPackageRate.test.ts');
const headers = {"x-authorization" : "0"};
logger.info("Starting tests for getPackageRate.test.ts");
describe('reset', () => {
    it('should return 200 status code to signifiy successful reset. Used for clean test environment', async () => {
        try {
            const response = await axios.delete(`${APIURL}/reset`, {headers});
            expect(response.status).toBe(200);
        } catch (error: any) {
            console.log(error.response.status);
            throw error;
        }
    });
});

describe('GET /package/{id}/rate endpoint', () => {
    let packageID : apiSchema.PackageID;
    it('upload endpoint to put something in registry. should return 200 status code and something for a valid github repo link', async () => {
        try {
            const response= await axios.post(`${APIURL}/package`, {
                "URL": "https://github.com/expressjs/express"
            }, {headers});
            expect(response.status).toBe(201);
            const packageResponse : apiSchema.Package = response.data;
            packageID = packageResponse.metadata.ID;
        } catch (error: any) {
            console.log(error.response.status);
            throw error;
        }
    });

    it('GET /package/{id}/rate endpoint should return 200 status code and valid ratings', async () => {
        try {
            const response = await axios.get(`${APIURL}/package/${packageID}/rate`, {headers});
            expect(response.data).toMatchObject<apiSchema.PackageRating>({
                BusFactor: expect.any(Number),
                Correctness: expect.any(Number),
                RampUp: expect.any(Number),
                ResponsiveMaintainer: expect.any(Number),
                LicenseScore: expect.any(Number),
                GoodPinningPractice: expect.any(Number),
                PullRequest: expect.any(Number),
                NetScore: expect.any(Number),
            });
            expect(response.status).toBe(200);
        } catch (error: any) {
            console.log(error.response.status);
            console.log(error.response.data);
            throw error;
        }
    });

    it('GET /package{id}/rate endpoint should return a 404 status code error for a non existent package ID', async () => {
        try {
            await axios.get(`${APIURL}/package/0/rate`, {headers});
        } catch (error: any) {
            expect(error.response.status).toBe(404);
        }
    });
});

describe('reset', () => { // rerun reset test for clean deployment
    it('should return 200 status code to signifiy successful reset', async () => {
        try {
            const response = await axios.delete(`${APIURL}/reset`, {headers});
            expect(response.status).toBe(200);
        } catch (error: any) {
            console.log(error.response.status);
            throw error;
        }
    });
});
logger.info("Finished tests for getPackageRate.test.ts");