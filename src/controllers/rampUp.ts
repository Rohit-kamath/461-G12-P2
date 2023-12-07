//import { Request, Response, NextFunction } from 'express';
import * as RampUpAPI from '../utils/rampUpAPI';
import createModuleLogger from '../logger';

const logger = createModuleLogger('Ramp Up');

export const calculateRampUp = async (owner: string, repo: string) => {
    /* const { owner, repo } = req.query as { owner: string; repo: string }; */
    try {
        // Fetch data from GitHub API
        const contributors = await RampUpAPI.fetchRepositoryContributors(owner, repo);
        const stars = await RampUpAPI.fetchRepositoryStars(owner, repo);
        const forks = await RampUpAPI.fetchRepositoryForks(owner, repo);
        const firstCommitTime = await RampUpAPI.fetchFirstCommitTime(owner, repo);

        const weights = {
            Contributors: 0.2,
            Stars: 0.2,
            Forks: 0.2,
            FirstCommit: 0.4,
        };
        const maxContributors = 15; // hypothetical max value
        const maxStars = 250; // hypothetical max value
        const maxForks = 125; // hypothetical max value

        const normalizedContributors = contributors.length / maxContributors;
        const normalizedStars = stars.length / maxStars;
        const normalizedForks = forks.length / maxForks;

        // Calculate contributions of each metric towards the ramp-up score.
        const contributorsContribution = weights.Contributors * normalizedContributors;
        const starsContribution = weights.Stars * normalizedStars;
        const forksContribution = weights.Forks * normalizedForks;

        let rampUpScore = contributorsContribution + starsContribution + forksContribution;
        logger.info(`Ramp up score prior to first commit time calculated: ${rampUpScore}`);

        // If there's data for the first commit time, calculate its contribution.
        if (firstCommitTime) {
            const currentTime = new Date().getTime();
            const firstCommitTimestamp = new Date(firstCommitTime).getTime();
            const timeDifference = currentTime - firstCommitTimestamp;
            const maxTimeDifference = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds.
            const normalizedTimeDifference = 1 - Math.min(timeDifference / maxTimeDifference, 1); // Closer the commit, higher the score
            rampUpScore += weights.FirstCommit * normalizedTimeDifference;
            logger.info(`First commit time calculated: ${normalizedTimeDifference}`)
        }

        // Clamp the ramp-up score to ensure it's between 0 and 1.
        rampUpScore = Math.min(Math.max(rampUpScore, 0), 1);

        return rampUpScore;
    } catch (error) {
        // Handle any potential errors during the calculation process.
        logger.info('Error computing the ramp-up score:', error);
        return 0;
    }
};
