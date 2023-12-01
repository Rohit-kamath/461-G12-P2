import axios from 'axios';

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
