import axios from 'axios';
import * as apiSchema from "../backend/apiSchema";

const APIURL = 'http://ece461-packageregistry-depenv.eba-bphpcw3d.us-east-2.elasticbeanstalk.com';
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

describe('POST /packages endpoint', () => {
    let packageName : apiSchema.PackageName;
    let packageVersion : string;
    it('POST /package endpoint to put something in registry. should return 200 status code and something for a valid github repo link', async () => {
        try {
            const response= await axios.post(`${APIURL}/package`, {
                "URL": "https://github.com/feross/safe-buffer",
                "JSProgram": "if (process.argv.length === 7) {\nconsole.log('Success')\nprocess.exit(0)\n} else {\nconsole.log('Failed')\nprocess.exit(1)\n}\n"
            });
            expect(response.status).toBe(200);
            const packageResponse : apiSchema.Package = response.data;
            packageName = packageResponse.metadata.Name;
            packageVersion = packageResponse.metadata.Version;
        } catch (error: any) {
            console.log(error.response.status);
            throw error;
        }
    });

    it('POST /packages endpoint. should return 200 status code and something for a valid package id. Used to get package download', async () => {
        try {
            const response = await axios.post(`${APIURL}/packages`, [{
                "Version": packageVersion,
                "Name": packageName
            }]);
            console.log(response.data);
            expect(response.status).toBe(200);
        } catch (error: any) {
            console.log(error.response.status);
            console.log(error.response.data);
            throw error;
        }
    });

    it('POST /packages endpoint. should return 200 status code and something for a valid package id and when popularity flag is passed in request', async () => {
        try {
            const response = await axios.post(`${APIURL}/packages`, [{
                "Version": packageVersion,
                "Name": packageName,
                "Popularity": true
            }]);
            console.log(response.data);
            expect(response.status).toBe(200);
        } catch (error: any) {
            console.log(error.response.status);
            console.log(error.response.data);
            throw error;
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

describe('always pass', () => {
    it('should always pass', async () => {
        expect(true).toBe(true);
    });
});