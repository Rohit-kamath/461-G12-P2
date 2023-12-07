import axios from 'axios';
import * as apiSchema from "../backend/apiSchema";
import createModuleLogger from '../src/logger';
const APIURL = 'http://ece461-packageregistry-depenv.eba-bphpcw3d.us-east-2.elasticbeanstalk.com';
const logger = createModuleLogger('getPackageByName.test.ts');
logger.info("Starting tests for getPackageByName.test.ts");
describe('reset', () => {
    it('should return 200 status code to signifiy successful reset. Used for clean test environment', async () => {
        try {
            const response = await axios.delete(`${APIURL}/reset`);
            expect(response.status).toBe(200);
        } catch (error: any) {
            console.log(error.response.status);
            throw error;
        }
    });
});

describe('get /package/byName/{name} endpoint', () => {
    let packageName : apiSchema.PackageName;
    it('POST /package endpoint to put something in registry. should return 200 status code and something for a valid github repo link', async () => {
        try {
            const response= await axios.post(`${APIURL}/package`, {
                "URL": "https://github.com/feross/safe-buffer"
            });
            expect(response.status).toBe(200);
            const packageResponse : apiSchema.Package = response.data;
            packageName = packageResponse.metadata.Name;
        } catch (error: any) {
            console.log(error.response.status);
            throw error;
        }
    });

    it('get /package/byName/{name} endpoint (package history). should return 200 status code and something for a valid package name', async () => {
        try {
            const response = await axios.get(`${APIURL}/package/byName/${packageName}`);
            //console.log(response.data);
            expect(response.status).toBe(200);
        } catch (error: any) {
            console.log(error.response.status);
            console.log(error.response.data);
            throw error;
        }
    });

    it('get /package/byName/{name} endpoint (package history). should return 404 status code for an invalid package name', async () => {
        try {
            await axios.get(`${APIURL}/package/byName/invalidPackageName`);
            throw new Error('not returning 404 status code for invalid package name');
        } catch (error: any) {
            if(error.message === 'not returning 404 status code for invalid package name') {
                throw error;
            }
            expect(error.response.status).toBe(404);
        }
    });
});

describe('reset', () => { // rerun reset test for clean deployment
    it('should return 200 status code to signifiy successful reset', async () => {
        try {
            const response = await axios.delete(`${APIURL}/reset`);
            expect(response.status).toBe(200);
        } catch (error: any) {
            console.log(error.response.status);
            throw error;
        }
    });
});
logger.info("Finished tests for getPackageByName.test.ts");