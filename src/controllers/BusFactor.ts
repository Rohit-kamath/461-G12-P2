import { getRequest } from '../utils/api.utils';

interface Contributor{
  login: string;
  contributions: number;
}

export async function getContributors(owner: string, repo: string) : Promise<Contributor[]> {
  const response = await getRequest(
    `/repos/${owner}/${repo}/contributors?per_page=100`
  );

  const contributors = response.map((contributor: any) => {
    return {
      login: contributor.login,
      contributions: contributor.contributions,
    };
  });
  return contributors;
}


function calculateBusFactor(contributors: Contributor[]) {
  if (contributors.length == 1 && contributors[0].contributions > 0){
    return 0;
  }

  const sortedContributors = [...contributors].sort((a, b) => b.contributions - a.contributions);
  let majorContributorsCount = 0;
	let contributionsCounted = 0;
	const percentOfTotalContributions =
		sortedContributors.reduce((acc, contributor) => acc + contributor.contributions, 0) * 0.6;

	for (const contributor of sortedContributors) {
		contributionsCounted += contributor.contributions;
		majorContributorsCount++;

		if (contributionsCounted >= percentOfTotalContributions) {
			break;
		}
	}

	const busFactor = Math.min(majorContributorsCount / 10, 1);
  return busFactor;
}

export async function getBusFactor(owner: string, repo: string) {
  const contributors = await getContributors(owner, repo);
  return calculateBusFactor(contributors);
}