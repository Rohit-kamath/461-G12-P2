import { MetricParent } from '../helpers/MetricParent';
import * as responsivenessApi from '../utils/responsivenessApi';
import createModuleLogger from '../logger';

const logger = createModuleLogger('Responsiveness');

export class Responsiveness extends MetricParent {
    private repoOwner: string;
    private repoName: string;
    private commitMergeTime: number = 0;
    private score_list: number[] = [];

    constructor(someSharedProperty: string, repoOwner: string, repoName: string) {
        super(someSharedProperty, 'Responsive Maintainer', 'ty-runner');
        this.repoOwner = repoOwner;
        this.repoName = repoName;
    }
    async fetchData(): Promise<void> {
        try {
            const issues = await responsivenessApi.fetchIssues(this.repoOwner, this.repoName);
            if (issues.length > 0) {
                for (const issue of issues) {
                    const creationTime = new Date(issue.created_at);
                    const closeTime = new Date(issue.closed_at);
                    this.commitMergeTime = (closeTime.valueOf() - creationTime.valueOf()) / (1000 * 3600 * 24); // in minutes
                    this.score_list.push(this.commitMergeTime);
                }
            }
        } catch (error) {
            logger.info('Error fetching data:', error);
            return Promise.reject(error);
        }
    }
    async findMedian(numbers: number[]) {
        // Step 1: Sort the list
        const sortedNumbers = numbers.slice().sort((a: any, b: any) => a - b);

        const middleIndex = Math.floor(sortedNumbers.length / 2);

        if (sortedNumbers.length % 2 === 0) {
            // Even number of elements, so take the average of the two middle elements
            const middle1 = sortedNumbers[middleIndex - 1];
            const middle2 = sortedNumbers[middleIndex];
            return (middle1 + middle2) / 2;
        } else {
            // Odd number of elements, so the middle element is the median
            return sortedNumbers[middleIndex];
        }
    }

    calculateMetric(): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            this.fetchData()
                .then(() => {
                    if (this.score_list.length === 0) {
                        resolve(0);
                    } else {
                        return this.findMedian(this.score_list);
                    }
                })
                .then((median) => {
                    if (median !== undefined) {
                        const maxResponseTime = 30;
    
                        if (median <= 7) {
                            resolve(1);
                        } else if (median > maxResponseTime) {
                            resolve(0);
                        } else {
                            const scaledScore = 1 - (median - 7) / (maxResponseTime - 7);
                            resolve(scaledScore);
                        }
                    }
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }
}