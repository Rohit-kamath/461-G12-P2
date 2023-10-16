import { getRequest } from './api.utils';

export async function fetchIssues(owner: string, repo: string) {
  const endpoint = `/repos/${owner}/${repo}/issues?state=closed&page=1&per_page=100`;
  return await getRequest(endpoint);
}

export const fetchRepoEvents = async (owner: string, repo: string) => {
  const endpoint = `/repos/${owner}/${repo}/events`;
  return await getRequest(endpoint);
};

export const fetchUserEvents = async (username: string) => {
  const endpoint = `/users/${username}/events`;
  return await getRequest(endpoint);
};

export const fetchRateLimit = async () => {
  const endpoint = `/rate_limit`;
  return await getRequest(endpoint);
};