import axios from 'axios';

describe('notImplementedRoute', () => {
    it('should return 501 error for unimplemented routes', async () => {
        try{
            const response = await axios.put('http://ece461-packageregistry-depenv.eba-bphpcw3d.us-east-2.elasticbeanstalk.com/authenticate');
            console.log(`response.status: ${response.status}`);
            throw new Error(`Unimplemented route did not return 501 error`);
        } catch (error : any) {
            if (error.message === 'Unimplemented route did not return 501 error') {
                throw error;
            }
            expect(error.response.status).toBe(501);
        }
    });
});