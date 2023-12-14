import { calculateTotalSizeCost, debloatPackage, downloadGitHubRepoZip } from '../backend/apiPackage';
import { mocked } from 'jest-mock';

jest.mock('../backend/apiPackage', () => ({
    ...jest.requireActual('../backend/apiPackage'), // Import and retain other functions
    downloadGitHubRepoZip: jest.fn(),
    debloatPackage: jest.fn()
}));

describe('Size Cost Calculation with GitHub Repo Zip', () => {
    beforeAll(() => {
        // Mock downloadGitHubRepoZip to return size 5000
        (downloadGitHubRepoZip as jest.Mock).mockImplementation(() => Buffer.alloc(5000));

        // Mock debloatPackage to return a smaller buffer
        (debloatPackage as jest.Mock).mockImplementation(buffer => Buffer.alloc(buffer.length / 2));
    });

    test('Calculate size cost for a non-debloated package', async () => {
        const zipBuffer = await downloadGitHubRepoZip('https://github.com/example/example-repo');
        const size = await calculateTotalSizeCost(zipBuffer);
        expect(size).toBe(5000); 
    });

    test('Calculate size cost for a debloated package', async () => {
        const zipBuffer = await downloadGitHubRepoZip('https://github.com/example/example-repo');
        const debloatedBuffer = await debloatPackage(zipBuffer);
        const size = await calculateTotalSizeCost(debloatedBuffer);
        expect(debloatedBuffer.length).toBe(2500); // Half of the mocked buffer size
        expect(size).toBeLessThan(zipBuffer.length);
    });

    test('Calculate size cost for a manually created buffer', async () => {
        const buffer = Buffer.alloc(1000); 
        const size = await calculateTotalSizeCost(buffer);
        expect(size).toBe(1000); 
    });
    test('Calculate size cost for an actual GitHub repo', async () => {
        const repoUrl = 'https://github.com/feross/safe-buffer'; 
        jest.setTimeout(30000); 

        mocked(downloadGitHubRepoZip).mockImplementationOnce(jest.requireActual('../backend/apiPackage').downloadGitHubRepoZip);

        // Download GitHub repo zip
        const zipBuffer = await downloadGitHubRepoZip(repoUrl);
        expect(zipBuffer).toBeInstanceOf(Buffer);
        const originalSize = await calculateTotalSizeCost(zipBuffer);
        expect(originalSize).toBeGreaterThan(0);

        // Debloat 
        const debloatedBuffer = await debloatPackage(zipBuffer);
        const debloatedSize = await calculateTotalSizeCost(debloatedBuffer);
        expect(debloatedSize).toBeLessThanOrEqual(originalSize);
        
        //result for verification
        // console.log(`Original Size: ${originalSize}, Debloated Size: ${debloatedSize}`);
    });

});
