import axios from 'axios';
const APIURL = 'http://ece461-packageregistry-depenv.eba-bphpcw3d.us-east-2.elasticbeanstalk.com';

describe('groupRate Process', () => {

    let transaction1Id: string;
    let transaction2Id: string;
    let emptyTransactionId: string;
    let nonRateTransactionId: string;
    const metadataIds: string[] = [];

    describe('reset', () => {
        it('should return 200 status code to signify successful reset. Used for clean test environment', async () => {
            try {
                const response = await axios.delete(`${APIURL}/reset`);
                expect(response.status).toBe(200);
            } catch (error: any) {
                console.log(error.response?.status);
                throw error;
            }
        });
    });

    describe('uploading packages to later pull ratings', () => {
        it('should return 200 status code for successful upload', async () => {
            try {
                const response = await axios.post(`${APIURL}/package`, {
                    "URL": "https://github.com/remy/nodemon"
                });
                expect(response.status).toBe(200);
                metadataIds.push(response.data.metadata.ID);
            } catch (error: any) {
                console.log(error.response.status);
                throw error;
            }
        }, 20000);
        it('should return 200 status code for successful upload', async () => {
            try {
                const response = await axios.post(`${APIURL}/package`, {
                    "URL": "https://github.com/ladjs/supertest"
                });
                expect(response.status).toBe(200);
                metadataIds.push(response.data.metadata.ID);
            } catch (error: any) {
                console.log(error.response.status);
                throw error;
            }
        }, 20000);
    });

    describe('Initiate Rate Transaction', () => {
        it('should initiate a transaction successfully for RATE type', async () => {
            try {
                const response = await axios.post(`${APIURL}/transaction/initiate`, {
                    transactionType: 'RATE'
                });
                expect(response.status).toBe(200);
                transaction1Id = response.data.transactionId;
            } catch (error: any) {
                console.log(error.response?.status);
                throw error;
            }
        });
        it('should initiate another transaction successfully for RATE type', async () => {
            try {
                const response = await axios.post(`${APIURL}/transaction/initiate`, {
                    transactionType: 'RATE'
                });
                expect(response.status).toBe(200);
                transaction2Id = response.data.transactionId;
            } catch (error: any) {
                console.log(error.response?.status);
                throw error;
            }
        });
        it('should initiate another transaction successfully for RATE type, will be keeping it empty by not appending to it', async () => {
            try {
                const response = await axios.post(`${APIURL}/transaction/initiate`, {
                    transactionType: 'RATE'
                });
                expect(response.status).toBe(200);
                emptyTransactionId = response.data.transactionId;
            } catch (error: any) {
                console.log(error.response?.status);
                throw error;
            }
        });
        it('should initiate another transaction successfully for UPLOAD type, will be invalid when appending or executing with rate', async () => {
            try {
                const response = await axios.post(`${APIURL}/transaction/initiate`, {
                    transactionType: 'UPLOAD'
                });
                expect(response.status).toBe(200);
                nonRateTransactionId = response.data.transactionId;
            } catch (error: any) {
                console.log(error.response?.status);
                throw error;
            }
        });
    });

    describe('Append to Rate Transaction', () => {
        it('should append to transaction successfully', async () => {
            try {
                const response = await axios.post(`${APIURL}/transaction/append/rate`, {
                    transactionId: transaction1Id,
                    packageId: metadataIds[0]
                });
                expect(response.status).toBe(200);
            } catch (error: any) {
                console.log(error.response?.status);
                throw error;
            }
        });
        it('should append to transaction successfully', async () => {
            try {
                const response = await axios.post(`${APIURL}/transaction/append/rate`, {
                    transactionId: transaction1Id,
                    packageId: metadataIds[1]
                });
                expect(response.status).toBe(200);
            } catch (error: any) {
                console.log(error.response?.status);
                throw error;
            }
        });    
        it('should append to transaction successfully', async () => {
            try {
                const response = await axios.post(`${APIURL}/transaction/append/rate`, {
                    transactionId: transaction2Id,
                    packageId: metadataIds[0]
                });
                expect(response.status).toBe(200);
            } catch (error: any) {
                console.log(error.response?.status);
                throw error;
            }
        });
        it('should append to transaction successfully, this should later fail in execute', async () => {
            try {
                const response = await axios.post(`${APIURL}/transaction/append/rate`, {
                    transactionId: transaction2Id,
                    packageId: 'invalid package id'
                });
                expect(response.status).toBe(200);
            } catch (error: any) {
                console.log(error.response?.status);
                throw error;
            }
        });
        it('should fail to append due to invalid transaction ID', async () => {
            try {
                await axios.post(`${APIURL}/transaction/append/rate`, {
                    transactionId: '1234',
                    packageId: metadataIds[0]
                });
                throw new Error('Expected Axios to throw an error, but it did not.');
            } catch (error: any) {
                if (axios.isAxiosError(error)) {
                    expect(error.response?.status).toBe(404);
                } else {
                    throw error;
                }
            }
        });
        it('should fail to append due invalid request data', async () => {
            try {
                await axios.post(`${APIURL}/transaction/append/rate`, {
                    transactionId: emptyTransactionId,
                    Invalid: 'invalid'
                });
                throw new Error('Expected Axios to throw an error, but it did not.');
            } catch (error: any) {
                if (axios.isAxiosError(error)) {
                    expect(error.response?.status).toBe(400);
                } else {
                    throw error;
                }
            }
        });
        it('should fail to append due to missing package ID', async () => {
            try {
                await axios.post(`${APIURL}/transaction/append/rate`, {
                    transactionId: emptyTransactionId,
                });
                throw new Error('Expected Axios to throw an error, but it did not.');
            } catch (error: any) {
                if (axios.isAxiosError(error)) {
                    expect(error.response?.status).toBe(400);
                } else {
                    throw error;
                }
            }
        });
        it('should fail to append due to invalid transaction type', async () => {
            try {
                await axios.post(`${APIURL}/transaction/append/rate`, {
                    transactionId: nonRateTransactionId,
                    packageId: metadataIds[0]
                });
                throw new Error('Expected Axios to throw an error, but it did not.');
            } catch (error: any) {
                if (axios.isAxiosError(error)) {
                    expect(error.response?.status).toBe(404);
                } else {
                    throw error;
                }
            }
        });
    });

    describe('Execute Rate Transaction', () => {
        it('should successfully execute the transaction', async () => {
            try {
                const response = await axios.post(`${APIURL}/transaction/execute/rate`, {
                    transactionId: transaction1Id
                });
                expect(response.status).toBe(200);
            } catch (error: any) {
                console.log(error.response?.status);
                throw error;
            }
        });
        it('should fail to execute the transaction due to not being able to find package with certain ID', async () => {
            try {
                await axios.post(`${APIURL}/transaction/execute/rate`, {
                    transactionId: transaction2Id
                });
                throw new Error('Expected Axios to throw an error, but it did not.');
            } catch (error: any) {
                if (axios.isAxiosError(error)) {
                    expect(error.response?.status).toBe(404);
                } else {
                    throw error;
                }
            }
        });
        it('should fail to execute the transaction due to transaction not having any packages (not appended on yet)', async () => {
            try {
                await axios.post(`${APIURL}/transaction/execute/rate`, {
                    transactionId: emptyTransactionId
                });
                throw new Error('Expected Axios to throw an error, but it did not.');
            } catch (error: any) {
                if (axios.isAxiosError(error)) {
                    expect(error.response?.status).toBe(404);
                } else {
                    throw error;
                }
            }
        });
        it('should fail to execute the transaction because it is not in a state to be executed', async () => {
            try {
                await axios.post(`${APIURL}/transaction/execute/rate`, {
                    transactionId: transaction2Id
                });
                throw new Error('Expected Axios to throw an error, but it did not.');
            } catch (error: any) {
                if (axios.isAxiosError(error)) {
                    expect(error.response?.status).toBe(422);
                } else {
                    throw error;
                }
            }
        });
        it('should fail to execute the transaction due to no transaction ID specified in request', async () => {
            try {
                await axios.post(`${APIURL}/transaction/execute/rate`, {
                });
                throw new Error('Expected Axios to throw an error, but it did not.');
            } catch (error: any) {
                if (axios.isAxiosError(error)) {
                    expect(error.response?.status).toBe(400);
                } else {
                    throw error;
                }
            }
        });
        it('should fail to execute due to invalid transaction ID', async () => {
            try {
                await axios.post(`${APIURL}/transaction/execute/rate`, {
                    transactionId: '1234'
                });
                throw new Error('Expected Axios to throw an error, but it did not.');
            } catch (error: any) {
                if (axios.isAxiosError(error)) {
                    expect(error.response?.status).toBe(404);
                } else {
                    throw error;
                }
            }
        });
    
    describe('reset', () => {
        it('should return 200 status code to signify successful reset. Used for clean test environment', async () => {
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
});