import { MetricParent } from '../helpers/MetricParent';
import * as responsivenessApi from '../utils/responsivenessApi';

export class Responsiveness extends MetricParent {
  private repoOwner: string;
  private repoName: string;
  private issueResponseTime: number = 0;
  private prResponseTime: number = 0;
  private commitMergeTime: number = 0;

  constructor(someSharedProperty: string, repoOwner: string, repoName: string) {
    super(someSharedProperty, 'Responsive Maintainer', 'kim3574');
    this.repoOwner = repoOwner;
    this.repoName = repoName;
  }

  async fetchData(): Promise<any> {
    try {
      // Fetch issue comments
      const issueComments = await responsivenessApi.fetchIssueComments(
        this.repoOwner,
        this.repoName,
        1
      );
      if (issueComments && issueComments.length > 0) {
        const issueCreationTime = new Date(issueComments[0].created_at);
        const firstCommentTime = new Date(issueComments[0].updated_at);
        this.issueResponseTime =
          (firstCommentTime.getTime() - issueCreationTime.getTime()) /
          (1000 * 60); // in minutes
      }

      // Fetch PR comments
      const prComments = await responsivenessApi.fetchPullRequestComments(
        this.repoOwner,
        this.repoName,
        1
      );
      if (prComments && prComments.length > 0) {
        const prCreationTime = new Date(prComments[0].created_at);
        const firstPrCommentTime = new Date(prComments[0].updated_at);
        this.prResponseTime =
          (firstPrCommentTime.getTime() - prCreationTime.getTime()) /
          (1000 * 60); // in minutes
      }

      // Fetch PR merge time
      const prMergeData = await responsivenessApi.fetchPullRequestMergeTime(
        this.repoOwner,
        this.repoName,
        1
      );
      if (prMergeData) {
        const prCreationTime = new Date(prMergeData.created_at);
        const mergeTime = new Date(prMergeData.merged_at);
        this.commitMergeTime =
          (mergeTime.getTime() - prCreationTime.getTime()) / (1000 * 60); // in minutes
      }

      return Promise.resolve(
        'Fetched and processed data for Responsive Maintainer'
      );
    } catch (error) {
      //console.error('Error fetching data:', error);
      return Promise.reject(error);
    }
  }

  calculateMetric(): number {
    let validDataCount = 0;
    let totalResponseTime = 0;

    // Issue Response Time
    if (this.issueResponseTime !== null) {
      totalResponseTime += this.issueResponseTime;
      validDataCount++;
    }

    // PR Response Time
    if (this.prResponseTime !== null) {
      totalResponseTime += this.prResponseTime;
      validDataCount++;
    }

    // Commit Merge Time
    if (this.commitMergeTime !== null) {
      totalResponseTime += this.commitMergeTime;
      validDataCount++;
    }

    // Calculate the average response time based on valid data
    const averageResponseTime =
      validDataCount > 0 ? totalResponseTime / validDataCount : 0;
    return averageResponseTime;
  }
}
