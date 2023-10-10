import { getRequest } from './api.utils';

export const fetchIssueComments = async (
  owner: string,
  repo: string,
  issueNumber: number
) => {
  const endpoint = `/repos/${owner}/${repo}/issues/${issueNumber}/comments`;
  return await getRequest(endpoint);
};

export const fetchPullRequestComments = async (
  owner: string,
  repo: string,
  pullNumber: number
) => {
  const endpoint = `/repos/${owner}/${repo}/pulls/${pullNumber}/comments`;
  return await getRequest(endpoint);
};

export const fetchPullRequestMergeTime = async (
  owner: string,
  repo: string,
  pullNumber: number
) => {
  const endpoint = `/repos/${owner}/${repo}/pulls/${pullNumber}/merge`;
  return await getRequest(endpoint);
};

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
