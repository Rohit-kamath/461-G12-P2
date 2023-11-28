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
    private maxDepth = 10;

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
        return Math.min(1, 0.2 * githubScore + 0.8 * eslintScore);
    }

    private async lintFiles(dir: string, depth = 0): Promise<void> {
        if (depth > this.maxDepth) {
            logger.info(`Max depth of ${this.maxDepth} reached, skipping directory ${dir}`);
            return; // Avoid going too deep into directory structures
        }

        const files = fs.readdirSync(dir);

        logger.info(`Linting ${files.length} files in ${dir}`);
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.lstatSync(filePath); // Use lstat to get symlink info

            if (stat.isSymbolicLink()) {
                logger.info(`Skipping symbolic link ${filePath}`);
                continue; // skipping symbolic links to prevent infinite loops
            } else if (stat.isDirectory()) {
                logger.info(`Recursively linting directory ${filePath}`);
                await this.lintFiles(filePath, depth + 1);
            } else if (/\.ts$|\.js$/.test(file)) { // Simplified file check
                logger.info(`Linting file ${filePath}`);
                const results = await new ESLint().lintFiles([filePath]);
                results.forEach(result => {
                    result.messages.forEach(message => {
                        if (message.severity === 2) this.errors++;
                        else if (message.severity === 1) this.warnings++;
                        if (message.ruleId && ['no-eval', 'no-implied-eval'].includes(message.ruleId)) {
                            this.securityIssues++;
                        }
                    });
                });
                logger.info(`Linting complete for file ${filePath}`);
            }
        }
    }

    public hasTestInName(dirPath: string): boolean {
        logger.info(`Checking if ${dirPath} has test in name`);
        const stats = fs.statSync(dirPath);
        if (stats.isDirectory()) {
            if (dirPath.includes('test')) {
                return true;
            }
            const files = fs.readdirSync(dirPath);
            for (const file of files) {
                if (this.hasTestInName(path.join(dirPath, file))) {
                    return true;
                }
            }
        }
        return false;
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
        const hasTest = this.hasTestInName(tempdir);
        const testSuiteScore = hasTest ? 1 : 0;

        await this.lintFiles(tempdir);

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