import { Octokit } from '@octokit/rest';
import { ESLint } from 'eslint';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import createModuleLogger from '../logger';

const logger = createModuleLogger('Correctness');

config(); 

interface RepoData {
    stars_count: number;
    forks_count: number;
}

export class Correctness {
    private octokit: Octokit;
    private errors = 0;
    private warnings = 0;
    private securityIssues = 0;
    private maxDepth = 3;

    constructor(
        private owner: string,
        private repo: string,
    ) {
        const token = process.env.GITHUB_TOKEN;
        if (!token) {
            throw new Error('GITHUB_TOKEN is not set in the environment variables.');
        }
        this.octokit = new Octokit({ auth: token });
    }

    public async check(owner: string, repo: string): Promise<number> {
        repo = repo.trim().replace('\r', '');
        logger.info('Fetching repo data');

        const repoData = await this.fetchRepoData(owner, repo);

        if (repoData === null) return 0;

        logger.info('Calculating GitHub score');
        const githubScore = this.calculateGitHubScore(repoData.stars_count, repoData.forks_count);

        logger.info('Calculating ESLint score');
        const eslintScore = await this.linterAndTestChecker(owner, repo);

        logger.info('Successfully calculated GitHub & ESLint score, calculating final score');
        return this.calculateFinalScore(githubScore, eslintScore);
    }

    public async fetchRepoData(owner: string, repo: string): Promise<RepoData | null> {
        try {
            const { data } = await this.octokit.repos.get({
                owner,
                repo,
            });
            return {
                stars_count: data.stargazers_count,
                forks_count: data.forks_count,
            };
        } catch (error) {
            console.error('Error fetching repo data:', error);
            return null;
        }
    }

    public calculateGitHubScore(stars: number, forks: number): number {
        return Math.min(1, (stars + forks) / 1000);
    }

    private calculateFinalScore(githubScore: number, eslintScore: number): number {
        return Math.min(1, 0.3 * githubScore + 0.7 * eslintScore);
    }

    private async lintFile(filePath: string): Promise<void> {
    
        let eslintInstance;
        try {
            // Try using the existing ESLint configuration
            eslintInstance = new ESLint();
        } catch (configError) {
            logger.info(`Failed to load ESLint config, using default ESLint config for ${filePath}`);
    
            // Using a default ESLint configuration as a fallback
            eslintInstance = new ESLint({
                baseConfig: {
                    env: {
                        browser: true,
                        es2021: true,
                        node: true,
                    },
                    extends: [
                        'eslint:recommended',
                    ],
                    parserOptions: {
                        ecmaVersion: 12,
                        sourceType: 'module',
                    },
                    rules: {
                        // Define some default rules or leave it empty
                    },
                },
            });
        }
        try {
            // Perform linting using the selected ESLint instance
            const results = await eslintInstance.lintFiles([filePath]);
            results.forEach(result => {
                result.messages.forEach(message => {
                    if (message.severity === 2) this.errors++;
                    else if (message.severity === 1) this.warnings++;
                    if (message.ruleId && ['no-eval', 'no-implied-eval'].includes(message.ruleId)) {
                        this.securityIssues++;
                    }
                });
            });
        } catch (lintError) {
            logger.error(`Error linting file ${filePath}`);
        }
        logger.info(`Linting complete for file ${filePath}`);
    }
    

    public hasTestInName(dirPath: string, visited = new Set()): boolean {
        // Check if we have already visited this directory to prevent infinite recursion
        if (visited.has(dirPath)) {
            return false;
        }
        visited.add(dirPath);
    
        let stats;
        try {
            stats = fs.statSync(dirPath);
        } catch (error) {
            logger.error(`Error accessing directory ${dirPath}: ${error}`);
            return false;
        }
    
        // Skip irrelevant directories (like .git)
        if (this.isIrrelevantDirectory(dirPath)) {
            return false;
        }
    
        if (stats.isDirectory()) {
            if (dirPath.toLowerCase().includes('test')) {
                return true;
            }
            let files;
            try {
                files = fs.readdirSync(dirPath);
            } catch (error) {
                logger.error(`Error reading directory ${dirPath}: ${error}`);
                return false;
            }
    
            for (const file of files) {
                const filePath = path.join(dirPath, file);
                if (this.hasTestInName(filePath, visited)) {
                    return true;
                }
            }
        }
    
        return false;
    }
    
    private isIrrelevantDirectory(dirPath: string): boolean {
        // Add more directory names here if needed
        const irrelevantDirs = ['.git', 'node_modules', 'dist', 'build'];
        return irrelevantDirs.some(dir => dirPath.includes(dir));
    }
    
    

    public async linterAndTestChecker(owner: string, repo: string): Promise<number> {
        const tempdir = path.join('temp', owner, repo);

        if (fs.existsSync(tempdir)) {
            fs.rmSync(tempdir, { recursive: true, force: true });
        }

        fs.mkdirSync(tempdir, { recursive: true });

        const githuburl = `https://github.com/${owner}/${repo}.git`;

        // Cloning repo to the temp directory
        execSync(`git clone --depth 1 ${githuburl} ${tempdir}`, { stdio: 'ignore' });

        // Might need this later depending on if we run into issues with missing packages from repos

        // Change into the directory
        // process.chdir(tempdir);

        // // Install dependencies, catching any errors (optional if you choose to do so)
        // try {
        //     execSync('npm install', { stdio: 'ignore' });
        // } catch (error) {
        //     console.error('Failed to install dependencies:', error);
        //     // Handle the error as necessary for your application
        // }

        // Check if the repo has any tests
        logger.info(`Checking if ${tempdir} has any tests`);
        const hasTest = this.hasTestInName(tempdir);
        const testSuiteScore = hasTest ? 1 : 0;

        logger.info(`Beggining to lint ${tempdir}`);
        await this.lintFile(tempdir);

        execSync(`rm -rf ${tempdir}`, { stdio: 'ignore' });

        try {
            const tempRoot = path.join('temp');
            if (fs.existsSync(tempRoot)) {
                fs.rmSync(tempRoot, { recursive: true, force: true });
            }
        } catch (error) {
            console.error('Failed to delete temp directory:', error);
        }

        // Calculate the eslintScore based on errors and warnings
        const maxIssues = 250;
        const issuesCount = this.errors + this.warnings;
        const eslintScore = Math.max(0, 1 - issuesCount / maxIssues);

        // Combining the test suite score with the eslint score
        return testSuiteScore * 0.6 + eslintScore * 0.4;
    }
}