import { getRequest } from '../utils/api.utils';
import { response } from 'express';

interface Contributor {
  login : string;
  totalContributions : number;
}

export const getContributors = async (
  owner: string,
  repo: string
): Promise<Contributor[] | null> => {
  const contributors: Contributor[] = [];
  try {
    const response = await getRequest(
      `/repos/${owner}/${repo}/contributors`
    );
    response.forEach((contributor: any) => {
      console.log(contributor);
      const contributor_object : Contributor = {
        login: contributor.login,
        totalContributions: contributor.contributions
      }
      contributors.push(contributor_object);
    });
    contributors.sort((a, b) => b.totalContributions - a.totalContributions);
    return contributors;
  } catch (error: any) {
    console.log(`response: ${response}`)
    console.log(`Error in getContributors: with repo: ${repo} and owner: ${owner}`)
    return null;
  }
};

export const calculateBusFactor = async (owner: string, repo: string) => {
  const contributors = await getContributors(owner, repo);
  if (!contributors) {
    return 0;
  }
  let totalContributions = 0;
  let busFactor = 0;
  if (contributors) {
    contributors.forEach((contributor) => {
      totalContributions += contributor.totalContributions;
    });
    const fractionContributors = 0.7 * totalContributions;
    let contributions = 0;
    for(const contributor of contributors) {
      contributions += contributor.totalContributions;
      busFactor += 0.2;
      if (contributions >= fractionContributors) {
        break;
      }
    }
  }

  return Math.min(busFactor, 1);
};