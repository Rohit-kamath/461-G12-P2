import { getLicenseScore } from '../src/controllers/License';
import { getRequest } from '../src/utils/api.utils';

jest.mock('../src/utils/api.utils');

describe('License Score', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return 1 if the README contains a license', async () => {
        const mockData = {
            content: Buffer.from('This is a sample readme with a License').toString('base64')
        };
        (getRequest as jest.Mock).mockResolvedValue(mockData);

        const score = await getLicenseScore('testOwner', 'testRepo');
        expect(score).toBe(1);
    });

    it('should return 0 if the README does not contain a license', async () => {
        const mockData = {
            content: Buffer.from('This is a sample readme without the keyword').toString('base64')
        };
        (getRequest as jest.Mock).mockResolvedValue(mockData);

        const score = await getLicenseScore('testOwner', 'testRepo');
        expect(score).toBe(0);
    });

    it('should return 0 and log the error when there is an API issue', async () => {
        (getRequest as jest.Mock).mockRejectedValue(new Error('API Error'));
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        
        const score = await getLicenseScore('testOwner', 'testRepo');
        expect(score).toBe(0);
        expect(consoleSpy).toHaveBeenCalledWith(new Error('API Error'));
        
        consoleSpy.mockRestore(); 
    });
});