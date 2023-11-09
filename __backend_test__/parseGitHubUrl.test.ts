import { parseGitHubUrl } from '../backend/apiPackage';

describe('parseGitHubUrl', () => {
    test('parses HTTPS GitHub URL correctly', () => {
        const url = 'https://github.com/microsoft/playwright.git';
        expect(parseGitHubUrl(url)).toEqual({ owner: 'microsoft', repo: 'playwright' });
    });

    test('parses HTTPS GitHub URL with git+ prefix correctly', () => {
        const url = 'git+https://github.com/microsoft/playwright.git';
        expect(parseGitHubUrl(url)).toEqual({ owner: 'microsoft', repo: 'playwright' });
    });

    test('parses SSH (git) GitHub URL correctly', () => {
        const url = 'git@github.com:microsoft/playwright.git';
        expect(parseGitHubUrl(url)).toEqual({ owner: 'microsoft', repo: 'playwright' });
    });

    test('returns null for invalid GitHub URL', () => {
        const url = 'https://example.com/microsoft/playwright.git';
        expect(parseGitHubUrl(url)).toBeNull();
    });

    test('handles URLs without .git suffix', () => {
        const url = 'https://github.com/microsoft/playwright';
        expect(parseGitHubUrl(url)).toEqual({ owner: 'microsoft', repo: 'playwright' });
    });

    // Add more test cases if necessary
});
