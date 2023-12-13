import { getRequest } from '../utils/api.utils';
import createModuleLogger from '../logger';

const logger = createModuleLogger('License');

export async function getLicenseScore(owner: string, repo: string): Promise<number> {
    try {
        const response = await getRequest(`/repos/${owner}/${repo}/readme`);
        const readMe = Buffer.from(response.content, 'base64').toString();
        const licenseRegex = /licen[sc]e/gi;
        if (licenseRegex.test(readMe)) {
            logger.info('License found in README');
            return 1;
        }

        const licenseResponse = await getRequest(`/repos/${owner}/${repo}/license`);
        if (licenseResponse && licenseResponse.license) {
            logger.info('License found via GitHub API');
            return 1;
        }

        return 0;
    } catch (error) {
        console.log(error);
        logger.info('Error in License: with repo: ' + repo + ' and owner: ' + owner, error);
        return 0;
    }
}
