//import { Request, Response, NextFunction } from 'express';
import * as RampUpAPI from '../utils/rampUpAPI';

export const calculateRampUp = async (owner: string, repo: string) => {
    /* const { owner, repo } = req.query as { owner: string; repo: string }; */
    try {
        // Fetch data from GitHub API
        const contributors = await RampUpAPI.fetchRepositoryContributors(owner, repo);
        const stars = await RampUpAPI.fetchRepositoryStars(owner, repo);
        const forks = await RampUpAPI.fetchRepositoryForks(owner, repo);
        const firstCommitTime = await RampUpAPI.fetchFirstCommitTime(owner, repo);

        const weights = {
            Contributors: 0.3,
            Stars: 0.2,
            Forks: 0.2,
            FirstCommit: 0.3,
        };
        const maxContributors = 100; // hypothetical max value
        const maxStars = 5000; // hypothetical max value
        const maxForks = 1000; // hypothetical max value

        const normalizedContributors = contributors.length / maxContributors;
        const normalizedStars = stars.length / maxStars;
        const normalizedForks = forks.length / maxForks;

        // Calculate contributions of each metric towards the ramp-up score.
        const contributorsContribution = weights.Contributors * normalizedContributors;
        const starsContribution = weights.Stars * normalizedStars;
        const forksContribution = weights.Forks * normalizedForks;

        let rampUpScore = contributorsContribution + starsContribution + forksContribution;

        // If there's data for the first commit time, calculate its contribution.
        if (firstCommitTime) {
            const currentTime = new Date().getTime();
            const firstCommitTimestamp = new Date(firstCommitTime).getTime();
            const timeDifference = currentTime - firstCommitTimestamp;
            const maxTimeDifference = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds.
            const normalizedTimeDifference = 1 - Math.min(timeDifference / maxTimeDifference, 1); // Closer the commit, higher the score
            rampUpScore += weights.FirstCommit * normalizedTimeDifference;
        }

        // Clamp the ramp-up score to ensure it's between 0 and 1.
        rampUpScore = Math.min(Math.max(rampUpScore, 0), 1);

        return rampUpScore;
    } catch (error) {
        // Handle any potential errors during the calculation process.
        console.error('Error computing the ramp-up score:', error);
        return 0;
    }
};
