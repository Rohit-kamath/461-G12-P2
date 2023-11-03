import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { NET_SCORE } from './src/controllers/netScore';

class PackageClassifier {
    urls: string[];
    constructor(file: string) {
        if (!existsSync(file)) {
            throw new Error('ERORR!!');
        }
        this.urls = readFileSync(file, 'utf-8').split('\n').filter(Boolean);
    }

    getUrls(): string[] {
        return this.urls;
    }
    classifyUrls(): { gitUrls: string[]; npmPackageUrls: string[] } {
        const gitUrls: string[] = [];
        const npmPackageUrls: string[] = [];

        for (const url of this.urls) {
            if (url.startsWith('https://github.com/') || url.startsWith('git+https://github.com/') || url.startsWith('git+ssh://git@github.com/') || url.startsWith('ssh://git@github.com/')) {
                const cleanUrl = url.replace('git+', '').replace('git+ssh://', '').replace('ssh://', '');
                gitUrls.push(cleanUrl);
            } else if (url.startsWith('https://www.npmjs.com/package/')) {
                npmPackageUrls.push(url);
                const packageName = url.split('/').pop();
                if (packageName) {
                    const repoUrl = this.getNpmPackageRepoUrl(packageName);
                    if (repoUrl) {
                        const cleanRepoUrl = repoUrl.replace('git+', '').replace('git+ssh://', '').replace('ssh://', '');
                        gitUrls.push(cleanRepoUrl);
                    }
                }
            }
        }
        const x = { gitUrls, npmPackageUrls };
        return x;
    }

    getNpmPackageRepoUrl(packageName: string): string | null {
        try {
            const output = execSync(`npm view ${packageName} repository.url`, {
                encoding: 'utf-8',
            });
            return output.trim();
        } catch (error) {
            return null;
        }
    }
}

async function main() {
    try {
        const filename = process.argv[2];
        if (!filename) {
            process.exit(1);
        }
        const classifier = new PackageClassifier(filename);
        const { gitUrls } = classifier.classifyUrls();
        const urls = classifier.getUrls();
        let i = 0;
        const results: any[] = [];

        for (const url of gitUrls) {
            const temp = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
            if (temp) {
                const owner = temp[1];
                let repo = temp[2];
                repo = repo.replace(/\.git$/, '');
                const NScore = new NET_SCORE(owner, repo);
                const scoreResults = await NScore.calculate();
                const URL = urls[i];
                const score_results_with_url = { URL, ...scoreResults };
                i++;
                results.push(scoreResults);
                console.log(JSON.stringify(score_results_with_url));
            }
        }
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

main();
