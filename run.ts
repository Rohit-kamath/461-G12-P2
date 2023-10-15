import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { NET_SCORE } from './src/controllers/NetScore';
const ndjson = require('ndjson');

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
    ////console.log("CLASSIFY URLS CALLED!");
    const gitUrls: string[] = [];
    const npmPackageUrls: string[] = [];

    for (const url of this.urls) {
      if (
        url.startsWith('https://github.com/') ||
        url.startsWith('git+https://github.com/') ||
        url.startsWith('git+ssh://git@github.com/') ||
        url.startsWith('ssh://git@github.com/')
      ) {
        let cleanUrl = url
          .replace('git+', '')
          .replace('git+ssh://', '')
          .replace('ssh://', '');
        gitUrls.push(cleanUrl);
      } else if (url.startsWith('https://www.npmjs.com/package/')) {
        npmPackageUrls.push(url);
        const packageName = url.split('/').pop();
        if (packageName) {
          const repoUrl = this.getNpmPackageRepoUrl(packageName);
          if (repoUrl) {
            let cleanRepoUrl = repoUrl
              .replace('git+', '')
              .replace('git+ssh://', '')
              .replace('ssh://', '');
            gitUrls.push(cleanRepoUrl);
          }
        }
      }
    }
    const x  = { gitUrls, npmPackageUrls };
    ////console.log("X", x);
    return x;
  }

  getNpmPackageRepoUrl(packageName: string): string | null {
    try {
      const output = execSync(`npm view ${packageName} repository.url`, {
        encoding: 'utf-8'
      });
      return output.trim();
    } catch (error) {
      //console.error(
      //  `Error getting repository URL for package ${packageName}: ${error.message}`
      //);
      return null;
    }
  }
}

async function main() {
    try {
      const filename = process.argv[2];
      ////console.log("FILENAME!!!", filename);
      if (!filename) {
        //console.error("No filename provided.");
        process.exit(1);
      }
      const classifier = new PackageClassifier(filename);
      const { gitUrls, npmPackageUrls } = classifier.classifyUrls();
      const urls = classifier.getUrls();
      ////console.log("URLS", urls);
      ////console.log('Git URLs:');
      let i = 0;
      const results: any[] = [];
  
      for (const url of (gitUrls)) {

        const temp = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (temp) {
          const owner = temp[1];
          let repo = temp[2];
          repo = repo.replace(/\.git$/, '');
          ////console.log("URL", url);
          const NScore = new NET_SCORE(owner, repo);
          const scoreResults = await NScore.calculate();
          const URL = urls[i];
          const score_results_with_url = {URL, ...scoreResults};
          i++;
/*           //console.log("SCORE RESULTS", scoreResults); */
          results.push(scoreResults);
/*           //console.log("RESULTS", results); */
          //process.stdout.write(ndjson.stringify(scoreResults));
          console.log(JSON.stringify(score_results_with_url));
          
        }
      }
    } catch (error) {
      //console.error('An error occurred:', error);
    }

}
  
main();
  
