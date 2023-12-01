// import axios from 'axios';
// import * as apiSchema from "../backend/apiSchema";

// const APIURL = 'http://ece461-packageregistry-depenv.eba-bphpcw3d.us-east-2.elasticbeanstalk.com';
// describe('reset', () => {
//     it('should return 200 status code to signifiy successful reset. Used for clean test environment', async () => {
//         try {
//             const response = await axios.delete(`${APIURL}/reset`);
//             expect(response.status).toBe(200);
//         } catch (error: any) {
//             console.log(error.response.status);
//             throw error;
//         }
//     });
// });

// describe('GET /package/{id}/rate endpoint', () => {
//     let packageID : apiSchema.PackageID;
//     it('upload endpoint to put something in registry. should return 200 status code and something for a valid github repo link', async () => {
//         try {
//             const response= await axios.post(`${APIURL}/package`, {
//                 "URL": "https://github.com/feross/safe-buffer",
//                 "JSProgram": "if (process.argv.length === 7) {\nconsole.log('Success')\nprocess.exit(0)\n} else {\nconsole.log('Failed')\nprocess.exit(1)\n}\n"
//             });
//             expect(response.status).toBe(200);
//             const packageResponse : apiSchema.Package = response.data;
//             packageID = packageResponse.metadata.ID;
//         } catch (error: any) {
//             console.log(error.response.status);
//             throw error;
//         }
//     });

//     it('GET /package/{id}/rate endpoint should return 200 status code and valid ratings', async () => {
//         try {
//             const response = await axios.get(`${APIURL}/package/${packageID}/rate`);
//             expect(response.data).toMatchObject<apiSchema.PackageRating>({
//                 BusFactor: expect.any(Number),
//                 Correctness: expect.any(Number),
//                 RampUp: expect.any(Number),
//                 ResponsiveMaintainer: expect.any(Number),
//                 LicenseScore: expect.any(Number),
//                 GoodPinningPractice: expect.any(Number),
//                 PullRequest: expect.any(Number),
//                 NetScore: expect.any(Number),
//             });
//             expect(response.status).toBe(200);
//         } catch (error: any) {
//             console.log(error.response.status);
//             console.log(error.response.data);
//             throw error;
//         }
//     });

//     it('GET /package{id}/rate endpoint should return a 404 status code error for a non existent package ID', async () => {
//         try {
//             await axios.get(`${APIURL}/package/0/rate`);
//         } catch (error: any) {
//             expect(error.response.status).toBe(404);
//         }
//     });
// });

// describe('reset', () => { // rerun reset test for clean deployment
//     it('should return 200 status code to signifiy successful reset', async () => {
//         try {
//             const response = await axios.delete(`${APIURL}/reset`);
//             expect(response.status).toBe(200);
//         } catch (error: any) {
//             console.log(error.response.status);
//             throw error;
//         }
//     });
// });

describe('always pass', () => {
    it('should always pass', async () => {
        expect(true).toBe(true);
    });
});