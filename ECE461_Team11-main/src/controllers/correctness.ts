import { Octokit } from "@octokit/rest";
import { ESLint } from "eslint";
import { execSync,exec } from "child_process";
/* import {config} from "dotenv"; */
import {
    fetchRepositoryStars,
    fetchRepositoryForks,
  } from '../utils/RampUpAPI';

export class correctness {
    //private octokit: Octokit;
    private errors = 0;
    private warnings = 0;
    private securityIssues = 0;
    

    constructor(private owner: string, private repo: string) {
        // Initialize the Octokit client with an authentication token if needed
       /*  config();
        const token = process.env.GITHUB_TOKEN;
        this.octokit = new Octokit({
            auth: token,
        }); */
    }

    async check(): Promise<number> {
        //////console.log("HEREEEE");
        // Get the repository information using the GitHub API
        /* try {
            const response = await this.octokit.repos.get({
                owner: this.owner,
                repo: this.repo,
            });
        }
        catch (error: any) {
            ////////console.log(error);
            return 0;
        } 
        const { data: repoData } = await this.octokit.repos.get({
            owner: this.owner,
            repo: this.repo,
        }); */
        const stars = await fetchRepositoryStars(this.owner, this.repo);
        const forks = await fetchRepositoryForks(this.owner, this.repo);
        const stars_count = stars.length;
        const forks_count = forks.length;
        /* ////console.log(`Stars: ${stars}, Forks: ${forks}`); */
        // Calculate a score based on the number of stars, forks, and watchers
        const power = this.calculateLowestPowerOf10(stars_count, forks_count);
        const githubScore = (stars_count + forks_count) / power;
        let eslintScore = await this.LinterandTestChecker();
        // try {
        //     eslintScore = await this.LinterandTestChecker();
        // } catch(e) {
        //     //////console.log("Error!", e);
        // }
        ////console.log(`Github Score: ${githubScore}, Eslint Score: ${eslintScore}`);
        const finalScore = (0.2 * githubScore) + (0.8 * eslintScore);
        if (finalScore > 1) {
            return 1;
        }
        return finalScore;
    

    }
    private calculateLowestPowerOf10(num1: number, num2: number): number {
        const sum = num1 + num2;
        let power = 1;
        while (power < sum) {
            power *= 10;
        }
        return power;
    }
    private hasTestInName(path: string): boolean {
    
        const fs = require('fs');
        const stats = fs.statSync(path);
        if (stats.isDirectory()) {
            if (path.includes('test')) {
                return true;
            }
            const files = fs.readdirSync(path);
            for (const file of files) {
            if (this.hasTestInName(`${path}/${file}`)) {
                return true;
            }
            }
        } else if (stats.isFile()) {
            if (path.includes('test')) {
            return true;
            }
        }
        return false;
    }
    

    private lintFiles(dir: string, linter: ESLint) {
        const fileRegex = /\.(ts|js)$/;
        const fs = require('fs');
        const path = require('path');
        const files = fs.readdirSync(dir);
        let numFiles = 0;
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                this.lintFiles(filePath, linter);
            }
            else if (fileRegex.test(file)) {
                linter.lintFiles([filePath]).then((results) => {
                    for (const result of results) {
                        for (const message of result.messages) {
                            ////////console.log(`Message: ${message.severity}, ${message.ruleId}`);
                            numFiles = numFiles + 1;
                            if (message.severity === 2) {
                                this.errors = this.errors + 1;
                            } else if (message.severity === 1) {
                                this.warnings = this.warnings + 1;
                            }
                            if (message.ruleId === "no-eval" || message.ruleId === "no-implied-eval") {
                                this.securityIssues = this.securityIssues + 1;
                            }
                        }
                    }
                });
            }
        }
        //////console.log(`Errors: ${this.errors}, Warnings: ${this.warnings}, Security Issues: ${this.securityIssues}, NumFiles: ${numFiles}`);
    }

    private async LinterandTestChecker(): Promise<number> {
        const tempdir = `./temp/${this.owner}/${this.repo}`;
        const githuburl = `https://github.com/${this.owner}/${this.repo}.git`;
        execSync(`mkdir -p ${tempdir}`);
        execSync(`cd ${tempdir}`)
        execSync(`git clone ${githuburl} ${tempdir}`, {stdio: 'ignore'});
        execSync(`ls ${tempdir}`)
        // Example usage
        const hasTest = this.hasTestInName(tempdir);
        let test_suite_checker = 0;
        if (hasTest) {
            test_suite_checker = 1;
        }
        ////////console.log(`Has test suite: ${test_suite_checker}`)        
       /*  const linter = new ESLint();
        this.lintFiles(tempdir, linter); */
        ////////console.log(`Errors: ${this.errors}, Warnings: ${this.warnings}, Security Issues: ${this.securityIssues}`);
        /* const results = linter.lintFiles(
            files.filter((file) => /\.(js|ts)$/.test(file))
        );
        let errors = 0;
        let warnings = 0;
        let securityIssues = 0;
        for (const result of results) {
            for (const message of result.messages) {
                if (message.severity === 2) {
                    errors = errors + 1;
                } else if (message.severity === 1) {
                    warnings = warnings + 1;
                }
                if (message.ruleId === "no-eval" || message.ruleId === "no-implied-eval") {
                    securityIssues = securityIssues + 1;
                }
            }
        } */
        await exec(`rm -rf ${tempdir}`);
        /* const error_prop = this.errors / (this.errors + this.warnings + this.securityIssues + 1);
        const warning_prop = this.warnings / (this.errors + this.warnings + this.securityIssues + 1);
        const security_prop = this.securityIssues / (this.errors + this.warnings + this.securityIssues + 1); */
        const eslintScore = (test_suite_checker);        
        return eslintScore;

    }
}
