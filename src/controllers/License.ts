import { MetricParent } from '../helpers/MetricParent';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

export class License extends MetricParent {
  private repoOwner: string;
  private repoName: string;

  constructor(someSharedProperty: string, repoOwner: string, repoName: string) {
    super(someSharedProperty, 'License Scorer', 'kim3574');
    this.repoOwner = repoOwner;
    this.repoName = repoName;
  }
  
  async fetchLicenseScore(): Promise<number> {
    const url = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/readme`;
    try{
      const response = await axios.get(url, {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
        },
      });
      const readmeContent = response.data;
      const readMe = Buffer.from(readmeContent.content, 'base64').toString('utf-8');
      const licenseRegex = /licen[sc]e/gi;
      const match = licenseRegex.test(readMe)
      return match ? 1 : 0;
    } catch (error) {
      console.log(error)
      return 0;
    }
  }
}
