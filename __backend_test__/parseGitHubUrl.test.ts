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

    test('handles URL', () => {
        const url = 'https://github.com/olivernn/lunr.js';
        expect(parseGitHubUrl(url)).toEqual({ owner: 'olivernn', repo: 'lunr.js' });
    });

    test('parses GitHub URL with organization and subdirectory correctly', () => {
        const url = 'https://github.com/microsoft/playwright/tree/main/docs';
        expect(parseGitHubUrl(url)).toEqual({ owner: 'microsoft', repo: 'playwright' });
    });

    test('parses GitHub URL with branch specifier correctly', () => {
        const url = 'https://github.com/microsoft/playwright/tree/main';
        expect(parseGitHubUrl(url)).toEqual({ owner: 'microsoft', repo: 'playwright' });
    });
    
    test('returns null for non-repository GitHub URLs like Gist', () => {
        const url = 'https://gist.github.com/microsoft/123456';
        expect(parseGitHubUrl(url)).toBeNull();
    });
    
    test('parses GitHub URL with query parameters correctly', () => {
        const url = 'https://github.com/microsoft/playwright.git?param=value';
        expect(parseGitHubUrl(url)).toEqual({ owner: 'microsoft', repo: 'playwright' });
    });
    
    test('parses GitHub URL with URL fragment correctly', () => {
        const url = 'https://github.com/microsoft/playwright#readme';
        expect(parseGitHubUrl(url)).toEqual({ owner: 'microsoft', repo: 'playwright' });
    });
    
    test('returns null for non-GitHub URLs', () => {
        const url = 'https://gitlab.com/microsoft/playwright.git';
        expect(parseGitHubUrl(url)).toBeNull();
    });

    test('returns null for empty or malformed URLs', () => {
        expect(parseGitHubUrl('')).toBeNull();
        expect(parseGitHubUrl('not a url')).toBeNull();
        expect(parseGitHubUrl('http:///microsoft/playwright')).toBeNull();
    });
    
    test('parses GitHub URL with numerical repository name correctly', () => {
        const url = 'https://github.com/username/1234.git';
        expect(parseGitHubUrl(url)).toEqual({ owner: 'username', repo: '1234' });
    });
    
    // Add more test cases if necessary
});
