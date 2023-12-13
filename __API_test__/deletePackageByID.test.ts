import axios from 'axios';
import * as apiSchema from "../backend/apiSchema";
import createModuleLogger from '../src/logger';

const APIURL = 'http://ece461-packageregistry-depenv.eba-bphpcw3d.us-east-2.elasticbeanstalk.com';
const logger = createModuleLogger('deletePackageByID.test.ts');

logger.info("Starting tests for deletePackageByID.test.ts");

describe('reset environment', () => {
    it('should return 200 status code for successful reset', async () => {
        const response = await axios.delete(`${APIURL}/reset`);
        expect(response.status).toBe(200);
    });
});

describe('DELETE /package/byID/:id endpoint', () => {
    let packageID: string;

    it('should create a package for testing delete operation', async () => {
        const uploadResponse = await axios.post(`${APIURL}/package`, {
            "URL": "https://github.com/feross/safe-buffer"
        });
        expect(uploadResponse.status).toBe(200);
        const uploadedPackage: apiSchema.Package = uploadResponse.data;
        packageID = uploadedPackage.metadata.ID;
        console.log(`Package uploaded with ID: ${packageID}`);
    });

    it('should return 200 status code for successful deletion of the package', async () => {
        console.log("Deleting package with ID:", packageID);
        const deleteResponse = await axios.delete(`${APIURL}/package/byID/${packageID}`);
        expect(deleteResponse.status).toBe(200);
    });

    it('should return 404 status code when trying to access the deleted package', async () => {
        try {
            await axios.get(`${APIURL}/package/${packageID}`);
            throw new Error('Package should not be accessible after deletion');
        } catch (error: unknown) {
            if (axios.isAxiosError(error) && error.response) {
                expect(error.response.status).toBe(404);
            } else {
                throw error;
            }
        }
    });
});

describe('reset environment', () => {
    it('should return 200 status code for successful reset', async () => {
        const response = await axios.delete(`${APIURL}/reset`);
        expect(response.status).toBe(200);
    });
});

logger.info("Finished tests for deletePackageByID.test.ts");