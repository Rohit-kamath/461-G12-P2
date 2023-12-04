import axios from 'axios';
import * as apiSchema from "../backend/apiSchema";

const APIURL = 'http://ece461-packageregistry-depenv.eba-bphpcw3d.us-east-2.elasticbeanstalk.com';
describe('reset', () => {
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

describe('putPackageByID', () => {
    it('should return 404 status code to signifiy package not found', async () => {
        try {
            await axios.put(`${APIURL}/package/1`, {
                "metadata": {
                    "Name": 'test',
                    "Version": '1.0.0',
                    "ID": "1",
                },
                "data": {
                    "Content": 'test',
                }
            });
            throw new Error('should not reach here');
        } catch (error: any) {
            expect(error.response.status).toBe(404);
        }
    });
    let metadata : apiSchema.PackageMetadata;
    it('POST /package endpoint to put something in registry. should return 200 status code and something for a valid github repo link', async () => {
        try {
            const response = await axios.post(`${APIURL}/package`, {
                "URL": "https://www.npmjs.com/package/express",
                "JSProgram": "if (process.argv.length === 7) {\nconsole.log('Success')\nprocess.exit(0)\n} else {\nconsole.log('Failed')\nprocess.exit(1)\n}\n"
            });
            expect(response.status).toBe(200);
            metadata = response.data.metadata;
        } catch (error: any) {
            console.log(error.response.status);
            throw error;
        }
    });

    it('should return 200 status code to signifiy successful put', async () => {
        try {
            const response = await axios.put(`${APIURL}/package/${metadata.ID}`, {
                "metadata": {
                    "Name": metadata.Name,
                    "Version": metadata.Version,
                    "ID": metadata.ID,
                },
                "data": {
                    "Content": 'test',
                }
            }); 
            expect(response.status).toBe(200);
        } catch (error: any) {
            console.log(error.response.status);
            throw error;
        }
    });
});

describe('should always pass', () => {
    it('should always pass', () => {
        expect(true).toBe(true);
    });
});