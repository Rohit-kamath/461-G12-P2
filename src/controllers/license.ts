import { getRequest } from '../utils/api.utils';

export async function getLicenseScore(owner: string, repo: string): Promise<number> {
    try {
        const response = await getRequest(`/repos/${owner}/${repo}/readme`);
        const readMe = Buffer.from(response.content, 'base64').toString();
        const licenseRegex = /licen[sc]e/gi;
        const match = licenseRegex.test(readMe);
        return match ? 1 : 0;
    } catch (error) {
        console.log(error);
        return 0;
    }
}
