import { getRequest } from './api.utils';

export const fetchRepositoryContributors = async (
  owner: string,
  repo: string
) => {
  const endpoint = `/repos/${owner}/${repo}/contributors`;
  return await getRequest(endpoint);
};

export const fetchRepositoryStars = async (owner: string, repo: string) => {
  const endpoint = `/repos/${owner}/${repo}/stargazers`;
  return await getRequest(endpoint);
};

export const fetchRepositoryForks = async (owner: string, repo: string) => {
  const endpoint = `/repos/${owner}/${repo}/forks`;
  return await getRequest(endpoint);
};

export const fetchFirstCommitTime = async (owner: string, repo: string) => {
  const endpoint = `/repos/${owner}/${repo}/commits`;
  const commits = await getRequest(endpoint);
  if (commits && commits.length > 0) {
    const firstCommit = commits[0];
    return firstCommit.commit.author.date;
  }
  return null;
};