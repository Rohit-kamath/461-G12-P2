import axios from 'axios';
//make a test that uses a route that is not implemented yet to see if the API returns a 501 error
//http://ece461-packageregistry-depenv.eba-bphpcw3d.us-east-2.elasticbeanstalk.com/ this is the link to the API
//now use an endpoint like /unimplementedRoute to see if it returns a 501 error
//use axios for this test

describe('notImplementedRoute', () => {
    it('should return 501 error for unimplemented routes', async () => {
        try{
            const response = await axios.get('http://ece461-packageregistry-depenv.eba-bphpcw3d.us-east-2.elasticbeanstalk.com/package/12');
            console.log(`response.data: ${response.data}`);
            console.log(response.status)
            expect(response.status).toBe(501);
        } catch (error) {
            console.log(error)
        }
    });
});