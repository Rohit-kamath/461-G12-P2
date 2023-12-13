import axios from 'axios';
import * as apiSchema from "../backend/apiSchema";
import createModuleLogger from '../src/logger';

const APIURL = "http://ece461-packageregistry-depenv.eba-bphpcw3d.us-east-2.elasticbeanstalk.com";
const logger = createModuleLogger('deletePackageByName.test.ts');

logger.info("Starting tests for deletePackageByName.test.ts");

describe('reset environment', () => {
    it('should return 200 status code for successful reset', async () => {
        await axios.delete(`${APIURL}/reset`);
    });
});

describe('DELETE /package/byName/:name endpoint', () => {
    let packageName : apiSchema.PackageName;
    let packageID : apiSchema.PackageID;
    it('should create a package for testing delete operation', async () => {
        const uploadResponse = await axios.post(`${APIURL}/package`, {
            "URL": "https://github.com/mathiasbynens/jsesc", 
        });
        expect(uploadResponse.status).toBe(200);
        const packageResponse : apiSchema.Package = uploadResponse.data;
        packageID = packageResponse.metadata.ID;
        packageName = packageResponse.metadata.Name;
    });

    it('should return 200 status code for successful deletion of the package', async () => {
        const deleteResponse = await axios.delete(`${APIURL}/package/byName/${packageName}`);
        expect(deleteResponse.status).toBe(200);
    });

    it('should return 404 status code when trying to access the deleted package', async () => {
        try {
            await axios.get(`${APIURL}/package/byName/${packageName}`);
            throw new Error('Package should not be accessible after deletion');
            
        } catch (error: unknown) {
            if (axios.isAxiosError(error) && error.response) {
                expect(error.response.status).toBe(404);
            } else {
                throw error;
            }
        }
    });
    it("should return 404 status code when trying to access the deleted package by ID", async () => {
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
        await axios.delete(`${APIURL}/reset`);
    });
});

logger.info("Finished tests for deletePackageByName.test.ts");