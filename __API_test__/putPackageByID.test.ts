import axios from 'axios';
import * as apiSchema from "../backend/apiSchema";
const newContent = "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"

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
    let originalContent : string;
    it('POST /package endpoint to put something in registry. should return 200 status code and something for a valid github repo link', async () => {
        try {
            const response = await axios.post(`${APIURL}/package`, {
                "URL": "https://www.npmjs.com/package/express"
            });
            originalContent = response.data.data.Content;
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
                    "Content": newContent,
                }
            }); 
            expect(response.status).toBe(200);
        } catch (error: any) {
            console.log(error.response.status);
            throw error;
        }
    });

    it('GET /package/id onto the just updated package to see if the Content = test', async () => {
        try {
            const response = await axios.get(`${APIURL}/package/${metadata.ID}`);
            expect(response.data.data.Content).toBe(originalContent);
        } catch (error: any) {
            console.log(error);
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