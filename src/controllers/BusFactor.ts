import { getRequest } from '../utils/api.utils';
import axios from 'axios';

interface Branch {
  name: string;
  url: string;
}

export const getAllRepoBranches = async (
  owner: string,
  repo: string
) => {
  try {
    const response = await getRequest(
      `/repos/${owner}/${repo}/branches?state=closed`
    );
    return parseBranchData(response);
  } catch (error: any) {
    ////console.log('Error!!!:', error);
    return null;
  }
};

// export const getAllCollaborators = async (req: Request, res: Response) => {
//   const { owner, repo } = req.query;
//   ////console.log('owner:', owner, 'repo:', repo);
//   if (typeof owner !== 'string' || typeof repo !== 'string') {
//     return res.status(400).json({ error: 'Owner and repo name required!' });
//   }
//   try {
//     const response = await getRequest(`/repos/${owner}/${repo}/collaborators`);
//     if (response) {
//       return res.status(200).json({ message: 'Success!!!', response });
//     } else {
//       return res.status(400).json({ error: 'Error getting collaborators' });
//     }
//   } catch (error: any) {
//     ////console.log('Error:', error);
//     return res.status(400).json({ error: 'Error getting collabs!!' });
//   }
// };

export const getAllRepoCommits = async (
  owner: string,
  repo: string
): Promise<Map<string, number> | null> => {
  ////console.log("COMMITS");
  const branches = await getAllRepoBranches(
    owner,
    repo
  );
  if (!branches) {
    return null;
  }
    
  const commitCounts: Map<string, number> = new Map();
  for (const branchUrl of branches) {
    try {
      const response = await axios.get(branchUrl.url);
      ////console.log('RESPONSE!!', response);
      const author = response.data?.user?.login;
      if (author) {
        commitCounts.set(author, (commitCounts.get(author) || 0) + 1);
      }
    } catch (error: any) {
      ////console.error(`error with this url: ${branchUrl.url}!!!!`, error);
    }
  }
  return commitCounts;
};

const parseBranchData = (branches: any[]): Branch[] => {
  const branchDetails: Branch[] = [];
  branches.forEach((item: any) => {
    const branchName = item?.name;
    const branchUrl = item?.commit?.url;
    if (branchName && branchUrl) {
      branchDetails.push({ name: branchName, url: branchUrl });
    }
  });
  return branchDetails;
};

export const getAllPullRequests = async (
  owner: string,
  repo: string
) => {
  ////console.log("PRS");
  const response = await getRequest(
    `/repos/${owner}/${repo}/pulls?state=closed`
  );
  const pullRequests = response || [];
  const contributors: Map<string, number> = new Map();

  pullRequests.forEach((pr: any) => {
    const author = pr.user.login;
    contributors.set(author, (contributors.get(author) || 0) + 1);
  });

  return contributors;
};

export const getAllClosedIssues = async (
  owner: string,
  repo: string
) => {
  ////console.log("CLOSED ISSUES");
  const response = await getRequest(
    `/repos/${owner}/${repo}/issues?state=closed`
  );
  const issues = response || [];
  const contributors: Map<string, number> = new Map();

  issues.forEach((issue: any) => {
    const author = issue.user.login;
    contributors.set(author, (contributors.get(author) || 0) + 1);
  });

  return contributors;
};

export const calculateBusFactor = async (owner: string, repo: string) => {
  ////console.log("HELLOOOO");
  const allContributors: Map<
    string,
    { commits: number; prs: number; issues: number }
  > = new Map();
  ////console.log("CALCULATING BUS FACTOR");
  const commitContributors = await getAllRepoCommits(owner, repo);
  ////console.log('Commit Contributors', commitContributors);
  commitContributors?.forEach((count, author) => {
    const current = allContributors.get(author) || {
      commits: 0,
      prs: 0,
      issues: 0
    };
    allContributors.set(author, { ...current, commits: count });
  });

  const prContributors = await getAllPullRequests(owner, repo);
  ////console.log('PR contributors', prContributors);
  prContributors.forEach((count, author) => {
    const current = allContributors.get(author) || {
      commits: 0,
      prs: 0,
      issues: 0
    };
    allContributors.set(author, { ...current, prs: count });
  });

  const issueContributors = await getAllClosedIssues(owner, repo);
  ////console.log('Issue contributors', issueContributors);
  issueContributors.forEach((count, author) => {
    const current = allContributors.get(author) || {
      commits: 0,
      prs: 0,
      issues: 0
    };
    allContributors.set(author, { ...current, issues: count });
  });

  let totalContributions = 0;
  let totalContributors = 0;

  allContributors.forEach((contribution) => {
    totalContributions +=
      contribution.commits + contribution.prs + contribution.issues;
    totalContributors++;
  });

  let busFactor = 0;
  let runningTotal = 0;

  const sortedContributors = Array.from(allContributors.entries()).sort(
    (a, b) => {
      return (
        b[1].commits +
        b[1].prs +
        b[1].issues -
        (a[1].commits + a[1].prs + a[1].issues)
      );
    }
  );

  for (const [, contributions] of sortedContributors) {
    runningTotal +=
      contributions.commits + contributions.prs + contributions.issues;
    busFactor++;
    if (runningTotal / totalContributions > 0.5) {
      break;
    }
  }

  const formattedContributors = sortedContributors.map(
    ([author, contributions]) => ({ author, ...contributions })
  );
  ////console.log("BUS FACTOR", busFactor);
  return busFactor;
};
