import { debloatPackage, downloadGitHubRepoZip } from '../backend/apiPackage';
import createModuleLogger from '../src/logger';

const logger = createModuleLogger('debloatPackageIntegration.test.ts');
logger.info("Starting integration tests for debloatPackage");

describe('Integration tests for debloatPackage', () => {
    it('should download a GitHub repo, use valid identifier and debloat the ZIP file', async () => {
        const githubUrl = "https://github.com/feross/safe-buffer";
        const zipBuffer = await downloadGitHubRepoZip(githubUrl);
        expect(zipBuffer).toBeInstanceOf(Buffer);

        const debloatedBuffer = await debloatPackage(zipBuffer);
        expect(debloatedBuffer).toBeInstanceOf(Buffer);
        expect(debloatedBuffer.length).toBeLessThan(zipBuffer.length); 
    });

    it('should download a GitHub repo, find main file recursively and debloat the ZIP file', async () => {
        const githubUrl = "https://github.com/rrweb-io/CSSOM";
        const zipBuffer = await downloadGitHubRepoZip(githubUrl);
        expect(zipBuffer).toBeInstanceOf(Buffer);

        const debloatedBuffer = await debloatPackage(zipBuffer);

        expect(debloatedBuffer).toBeInstanceOf(Buffer);
        expect(debloatedBuffer.length).toBeLessThan(zipBuffer.length);
    });

    // Test for error handling in the integration
    it('should handle errors appropriately', async () => {
        const invalidUrl = "https://github.com/feross/safe-buffert";

        try {
            const zipBuffer = await downloadGitHubRepoZip(invalidUrl);
            await debloatPackage(zipBuffer);
        } catch (error) {
            expect(error).toBeDefined();
        }
    });
});

afterAll(() => {
    logger.info("Completed cleanup after integration tests");
});

logger.info("Finished integration tests for debloatPackage using downloadGitHubRepoZip");
