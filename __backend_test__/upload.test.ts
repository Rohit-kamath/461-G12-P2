//http://ece461-packageregistry-depenv.eba-bphpcw3d.us-east-2.elasticbeanstalk.com/ this is the link to the API
/*
{
  "Content": "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",
  "JSProgram": "if (process.argv.length === 7) {\nconsole.log('Success')\nprocess.exit(0)\n} else {\nconsole.log('Failed')\nprocess.exit(1)\n}\n"
}
this is the request body for the POST /package route
*/
//make sure it returns something and a 200 status code. It doesn't matter what exactly it returns, just that it returns something
import axios from 'axios';

const APIURL = 'http://ece461-packageregistry-depenv.eba-bphpcw3d.us-east-2.elasticbeanstalk.com';
// const APIURL = `http://localhost:${process.env.PORT}`;
describe('reset', () => {
  it('should return 200 status code to signifiy successful reset', async () => {
    try{
      const response = await axios.delete(`${APIURL}/reset`);
        expect(response.status).toBe(200);
      }catch(error:any){
        console.log(error.response.status);
        throw error;
      }
    });
});

describe('upload', () => {
  it('should return 200 status code and something for a valid github repo link', async () => {
    try{
      const response = await axios.post(`${APIURL}/package`, {
      "URL": "https://github.com/feross/safe-buffer",
      "JSProgram": "if (process.argv.length === 7) {\nconsole.log('Success')\nprocess.exit(0)\n} else {\nconsole.log('Failed')\nprocess.exit(1)\n}\n"
      });
        expect(response.status).toBe(200);
      }catch(error:any){
        console.log(error.response.status);
        throw error;
      }
    });
  it('should return 409 status code to indicate package already exists', async () => {
    try{
      await axios.post(`${APIURL}/package`, {
      "URL": "https://github.com/feross/safe-buffer",
      "JSProgram": "if (process.argv.length === 7) {\nconsole.log('Success')\nprocess.exit(0)\n} else {\nconsole.log('Failed')\nprocess.exit(1)\n}\n"
      });
      throw new Error('Request did not fail as expected');
      }catch(error:any){
        console.log(error.response.status);
        expect(error.response.status).toBe(409);
      }
    });
    it('should return 200 status code and something for a valid base64 zip upload', async () => {
      try{
        const response = await axios.post(`${APIURL}/package`, {
        "Content": "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",
        "JSProgram": "if (process.argv.length === 7) {\nconsole.log('Success')\nprocess.exit(0)\n} else {\nconsole.log('Failed')\nprocess.exit(1)\n}\n"
        });
          expect(response.status).toBe(200);
        }catch(error:any){
          console.log(error.response.status);
          throw error;
        }
      });
      it('should return 409 status code to indicate package already exists', async () => {
        try{
          await axios.post(`${APIURL}/package`, {
          "Content": "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",
          "JSProgram": "if (process.argv.length === 7) {\nconsole.log('Success')\nprocess.exit(0)\n} else {\nconsole.log('Failed')\nprocess.exit(1)\n}\n"
          });
          throw new Error('Request did not fail as expected');
          }catch(error:any){
            expect(error.response.status).toBe(409);
          }
        });
        it('should return 400 status code for invalid input type', async () => {
          try{
            await axios.post(`${APIURL}/package`, {
            "FileUpload": "UEsDBAoAAAAAAGMzpFAAAAAY0MD0x9a0c5MThkNGIyNWM5YzdkYzM4NzRhYmNhODNiZjE3YjgzMQ==",
            "JSProgram": "if (process.argv.length === 7) {\nconsole.log('Success')\nprocess.exit(0)\n} else {\nconsole.log('Failed')\nprocess.exit(1)\n}\n"
            });
            throw new Error('Request did not fail as expected');
            }catch(error:any){
              expect(error.response.status).toBe(400);
            }
          });
        it('should return 400 status code for invalid URL', async () => {
          try{
            await axios.post(`${APIURL}/package`, {
            "URL": "google.com",
            "JSProgram": "if (process.argv.length === 7) {\nconsole.log('Success')\nprocess.exit(0)\n} else {\nconsole.log('Failed')\nprocess.exit(1)\n}\n"
            });
            throw new Error('Request did not fail as expected');
            }catch(error:any){
              expect(error.response.status).toBe(400);
            }
          });
        
        it('should return 200 status code and something for a valid npm link', async () => {
          try{
            const response = await axios.post(`${APIURL}/package`, {
            "URL": "https://www.npmjs.com/package/express",
            "JSProgram": "if (process.argv.length === 7) {\nconsole.log('Success')\nprocess.exit(0)\n} else {\nconsole.log('Failed')\nprocess.exit(1)\n}\n"
            });
              expect(response.status).toBe(200);
            }catch(error:any){
              console.log(error.response.status);
              throw error;
            }
          });
});

describe('reset', () => { // rerun reset test for clean deployment
  it('should return 200 status code to signifiy successful reset', async () => {
    try{
      const response = await axios.delete(`${APIURL}/reset`);
        expect(response.status).toBe(200);
      }catch(error:any){
        console.log(error.response.status);
        throw error;
      }
    });
});


