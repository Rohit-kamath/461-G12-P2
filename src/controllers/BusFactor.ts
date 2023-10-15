import { getRequest } from '../utils/api.utils';

interface Contributor {
  login : string;
  commits : number;
  prs : number;
  issues : number;
  totalContributions : number;
}

export const getContributors = async (
  owner: string,
  repo: string
): Promise<Contributor[] | null> => {
  const contributors: Contributor[] = [];
  try {
    const response = await getRequest(
      `/repos/${owner}/${repo}/stats/contributors`
    );
    response.forEach((contributor: any) => {
      const contributor_object : Contributor = {
        login: contributor.author.login,
        commits: contributor.total,
        prs: contributor.weeks.reduce( (accumulator: number, week: any) => accumulator + week.c, 0),
        issues: contributor.weeks.reduce( (accumulator: number, week: any) => accumulator + week.a, 0),
        totalContributions: contributor.total + contributor.weeks.reduce( (accumulator: number, week: any) => accumulator + week.c + week.a, 0)
      };
      contributors.push(contributor_object);
    });
    contributors.sort((a, b) => b.totalContributions - a.totalContributions);
    return contributors;
  } catch (error: any) {
    return null;
  }
};

export const calculateBusFactor = async (owner: string, repo: string) => {
  const contributors = await getContributors(owner, repo);
  let totalContributions = 0;
  let busFactor = 0;
  if (contributors) {
    contributors.forEach((contributor) => {
      totalContributions += contributor.totalContributions;
    });
    let sixtyPercent = 0.6 * totalContributions;
    let contributions = 0;
    for (let i = 0; i < contributors.length; i++) {
      contributions += contributors[i].totalContributions;
      busFactor += 0.1;
      if (contributions >= sixtyPercent) {
        break;
      }
    }
  }

  return Math.min(busFactor, 1);
};