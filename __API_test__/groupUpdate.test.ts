import axios from 'axios';
import * as apiSchema from "../backend/apiSchema";
const APIURL = 'http://ece461-packageregistry-depenv.eba-bphpcw3d.us-east-2.elasticbeanstalk.com';
let metadataObject1: apiSchema.PackageMetadata;
let metadataObject2: apiSchema.PackageMetadata;
describe('packageUpload', () => {
    it('POST /package endpoint to put something in registry. should return 200 status code and something for a valid github repo link', async () => {
        try {
            const response = await axios.post(`${APIURL}/package`, {
                URL: "https://www.npmjs.com/package/express"
            });
            expect(response.status).toBe(200);
            metadataObject1 = response.data.metadata;
        } catch (error: any) {
            console.log(error.response.status);
            throw error;
        }
    });
    it('POST /package endpoint to put something in registry. should return 200 status code and something for a valid github repo link', async () => {
        try {
            const response = await axios.post(`${APIURL}/package`, {
                URL: "https://github.com/microsoft/vscode-eslint"
            });
            expect(response.status).toBe(200);
            metadataObject2 = response.data.metadata;
        } catch (error: any) {
            console.log(error.response.status);
            throw error;
        }
    });
});

describe('groupUpdateProcess', () => {
    let transaction1Id: string;

    describe('Initiate Transaction', () => {
        it('should initiate a transaction successfully for UPDATE type', async () => {
            try {
                const response = await axios.post(`${APIURL}/transaction/initiate`, {
                    transactionType: 'UPDATE'
                });
                expect(response.status).toBe(200);
                transaction1Id = response.data.transactionId;
            } catch (error: any) {
                console.log(error.response?.status);
                throw error;
            }
        });
    });

    describe('Append to Upload Transaction', () => {
        const validURL = 'https://github.com/remy/nodemon';

        it('should successfully append a package using URL', async () => {
            try {
                const response = await axios.post(`${APIURL}/transaction/append/update`, {
                    transactionId: transaction1Id,
                    metadata: metadataObject1,
                    data: {
                        URL: validURL
                    }
                });
                expect(response.status).toBe(200);
            } catch (error: any) {
                console.log(error.response?.status);
                throw error;
            }
        });
    });

    describe('Execute Upload Transaction', () => {
        it('should successfully execute the transaction', async () => {
            try {
                const response = await axios.post(`${APIURL}/transaction/execute/update`, {
                    transactionId: transaction1Id
                });
                expect(response.status).toBe(200);
            } catch (error: any) {
                console.log(error.response?.status);
                throw error;
            }
        });
    });

    describe('Reset', () => {
        it('should return 200 status code to signify successful reset', async () => {
            try {
                const response = await axios.delete(`${APIURL}/reset`);
                expect(response.status).toBe(200);
            } catch (error: any) {
                console.log(error.response?.status);
                throw error;
            }
        });
    });
});