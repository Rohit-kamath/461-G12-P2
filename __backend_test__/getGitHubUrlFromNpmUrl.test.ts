import axios from 'axios';
import { getGitHubUrlFromNpmUrl } from '../backend/apiPackage';

jest.mock('axios');

const mockAxiosGet = axios.get as jest.Mock;

describe('getGitHubUrlFromNpmUrl', () => {
    beforeEach(() => {
        mockAxiosGet.mockClear();
    });

    it('should return GitHub URL for a valid npm package', async () => {
        mockAxiosGet.mockResolvedValue({
            data: {
                repository: {
                    url: 'https://github.com/expressjs/express.git'
                }
            }
        });

        const url = await getGitHubUrlFromNpmUrl('https://www.npmjs.com/package/express');
        expect(url).toBe('https://github.com/expressjs/express');
    });

    it('should handle npm URLs with git+ prefix', async () => {
        mockAxiosGet.mockResolvedValue({
            data: {
                repository: {
                    url: 'git+https://github.com/expressjs/express.git'
                }
            }
        });

        const url = await getGitHubUrlFromNpmUrl('https://www.npmjs.com/package/express');
        expect(url).toBe('https://github.com/expressjs/express');
    });

    it('should handle ssh format URLs', async () => {
        mockAxiosGet.mockResolvedValue({
            data: {
                repository: {
                    url: 'git@github.com:expressjs/express.git'
                }
            }
        });

        const url = await getGitHubUrlFromNpmUrl('https://www.npmjs.com/package/express');
        expect(url).toBe('https://github.com/expressjs/express');
    });

    it('should return null for packages without a repository field', async () => {
        mockAxiosGet.mockResolvedValue({
            data: {}
        });

        const url = await getGitHubUrlFromNpmUrl('https://www.npmjs.com/package/somepackage');
        expect(url).toBeNull();
    });

    it('should return null for invalid npm URLs', async () => {
        const url = await getGitHubUrlFromNpmUrl('https://www.npmjs.com/package/invalid');
        expect(url).toBeNull();
    });

});
