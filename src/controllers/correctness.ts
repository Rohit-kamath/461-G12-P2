import { Octokit } from "@octokit/rest";
import { ESLint } from "eslint";
import { config } from "dotenv";
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export class Correctness {
    private octokit: Octokit;
    private errors = 0;
    private warnings = 0;
    private securityIssues = 0;

    constructor(private owner: string, private repo: string) {
        // Initialize the Octokit client with an authentication token if needed
        config();
        const token = process.env.GITHUB_TOKEN;
        if (!token) {
            throw new Error('GITHUB_TOKEN is not set in the environment variables.');
        }
        this.octokit = new Octokit({
            auth: token,
        });
    }

    async check(): Promise<number> {
        let stars_count: number;
        let forks_count: number;

        try {
            const { data: repoData } = await this.octokit.repos.get({
                owner: this.owner,
                repo: this.repo,
            });
            stars_count = repoData.stargazers_count;
            forks_count = repoData.forks_count;
        } catch (error) {
            console.error("Error fetching repo data:", error);
            return 0;
        }

        const githubScore = Math.min(1, (stars_count + forks_count) / 1000);

        let eslintScore: number;
        try {
            eslintScore = await this.LinterandTestChecker();
        } catch (e) {
            console.error("Error running Linter and Test Checker:", e);
            eslintScore = 0;
        }

        const finalScore = (0.2 * githubScore) + (0.8 * eslintScore);
        return Math.min(finalScore, 1);
    }

    private async lintFiles(dir: string, linter: ESLint): Promise<void> {
        const fileRegex = /\.(ts|js)$/;
        const files = fs.readdirSync(dir);

        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                await this.lintFiles(filePath, linter);
            } else if (fileRegex.test(file)) {
                const results = await linter.lintFiles([filePath]);
                for (const result of results) {
                    for (const message of result.messages) {
                        if (message.severity === 2) {
                            this.errors += 1;
                        } else if (message.severity === 1) {
                            this.warnings += 1;
                        }
                        if (message.ruleId === "no-eval" || message.ruleId === "no-implied-eval") {
                            this.securityIssues += 1;
                        }
                    }
                }
            }
        }
    }

    private hasTestInName(dirPath: string): boolean {
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

    private async LinterandTestChecker(): Promise<number> {
        const tempdir = `./temp/${this.owner}/${this.repo}`;
        const githuburl = `https://github.com/${this.owner}/${this.repo}.git`;
    
        // Clone the repo to the temp directory
        execSync(`mkdir -p ${tempdir}`);
        execSync(`git clone ${githuburl} ${tempdir}`, { stdio: 'ignore' });
    
        // Check if the repo has any tests
        const hasTest = this.hasTestInName(tempdir);
        const test_suite_checker = hasTest ? 1 : 0;
    
        // Initialize ESLint and lint the files
        const linter = new ESLint();
        await this.lintFiles(tempdir, linter);
    
        // Delete the temporary directory
        execSync(`rm -rf ${tempdir}`);
    
        // Calculate the eslintScore
        const eslintScore = test_suite_checker;
    
        return eslintScore;
    }
}
