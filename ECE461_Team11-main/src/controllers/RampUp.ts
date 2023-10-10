import {
  fetchRepositoryContributors,
  fetchRepositoryStars,
  fetchRepositoryForks,
  fetchFirstCommitTime
} from '../utils/RampUpAPI';
//import { Request, Response, NextFunction } from 'express';
export const calculateRampUp = async (
  owner: string,
  repo: string,
) => {
  /* const { owner, repo } = req.query as { owner: string; repo: string }; */
  try {
    // Fetch data from GitHub API
    const contributors = await fetchRepositoryContributors(owner, repo);
    const stars = await fetchRepositoryStars(owner, repo);
    const forks = await fetchRepositoryForks(owner, repo);
    const firstCommitTime = await fetchFirstCommitTime(owner, repo);

    const weights = {
      Contributors: 0.3,
      Stars: 0.2,
      Forks: 0.2,
      FirstCommit: 0.3
    };
    const contributorsContribution = weights.Contributors * contributors.length;
    const starsContribution = weights.Stars * stars.length;
    const forksContribution = weights.Forks * forks.length;
    ////console.log('Contributors:', contributorsContribution);
    ////console.log('Stars:', starsContribution);
    ////console.log('Forks:', forksContribution);

    // Calculate the ramp-up score
    let rampUpScore =
      (contributorsContribution + starsContribution + forksContribution) *
      (weights.Contributors + weights.Stars + weights.Forks);
      ////console.log('Ramp-Up Score:', rampUpScore);

    if (firstCommitTime) {
      // Calculate the time difference for the first commit in milliseconds
      const currentTime = new Date().getTime();
      const firstCommitTimestamp = new Date(firstCommitTime).getTime();
      const timeDifference = currentTime - firstCommitTimestamp;

      // Normalize the time difference (0 to 1) and add it to the ramp-up score
      const maxTimeDifference = 365 * 24 * 60 * 60 * 1000; // Max time difference set to 1 year
      const normalizedTimeDifference = Math.min(
        timeDifference / maxTimeDifference,
        1
      );
      ////console.log('First Commit:', normalizedTimeDifference);
      rampUpScore += weights.FirstCommit * normalizedTimeDifference;
    }

    /* //console.log('Ramp-Up Score:', rampUpScore);
    res.json({ rampUpScore }); */
    rampUpScore = Math.min(Math.max(rampUpScore, 0), 1);
    return rampUpScore;
  } catch (error) {
    //console.error('Error:', error);
    return 0;
    /* res.status(500).send('Internal Server Error'); */
  }
};
