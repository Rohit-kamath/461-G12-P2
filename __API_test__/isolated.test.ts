import axios from 'axios';
import createModuleLogger from '../src/logger';
const APIURL = 'http://ece461-packageregistry-depenv.eba-bphpcw3d.us-east-2.elasticbeanstalk.com';
const axiosInstance = axios.create({baseURL: APIURL, headers : {"x-authorization": "0"}});
const logger = createModuleLogger('isolated.test.ts');
logger.info("Starting tests for isolated.test.ts");
describe('reset', () => {
    it('should return 200 status code to signifiy successful reset', async () => {
        try {
            //hit reset endpoint with X-authorization header
            const response = await axiosInstance.delete(`/reset`);
            expect(response.status).toBe(200);
        } catch (error: any) {
            console.log(error.response.status);
            throw error;
        }
    });
});
logger.info("Finished tests for isolated.test.ts");