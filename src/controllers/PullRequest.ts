import { getRequest } from "../utils/api.utils";

//find the total number of commits from a repo
export async function numberOfCommits(owner : string, repo : string): Promise<number> {
    const response = await getRequest(`/repos/${owner}/${repo}/commits`);
    return response.length;
}

//find the number of approved pull requests from a repo
export async function numberOfApprovedPRs(owner: string, repo : string): Promise<number>{
    const response = await getRequest(`/repos/${owner}/${repo}/pulls?state=all`);
    let approvedPRs = 0;
    response.forEach((pr: any) => {
        if(pr.merged_at){
            approvedPRs++;
        }
    });
    return approvedPRs;
}

export async function getPullRequest(owner: string, repo : string): Promise<number> {
    const approvedPRs = await numberOfApprovedPRs(owner, repo);
    const commits = await numberOfCommits(owner, repo);
    const metric = (approvedPRs)/commits;
    //return metric and make it between 0 and 1
    return metric > 1 ? 1 : metric;
}