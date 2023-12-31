import { getRequest, fullGetRequest } from '../utils/api.utils';
import { response } from 'express';
import createModuleLogger from '../logger';

const logger = createModuleLogger('Bus Factor');

interface Contributor {
    login: string;
    totalContributions: number;
}

export const getContributors = async (owner: string, repo: string): Promise<Contributor[] | null> => {
    const contributors: Contributor[] = [];
    try {
        const response = await getRequest(`/repos/${owner}/${repo}/contributors`);
        response.forEach((contributor: any) => {
            const contributor_object: Contributor = {
                login: contributor.login,
                totalContributions: contributor.contributions,
            };
            contributors.push(contributor_object);
        });
        contributors.sort((a, b) => b.totalContributions - a.totalContributions);
        return contributors;
    } catch (error: any) {
        logger.info(`Error in getContributors: with repo: ${repo} and owner: ${owner}, response: ${JSON.stringify(response, null, 2)}, error: ${error}`);
        return null;
    }
};

export const calculateBusFactor = (contributors: Contributor[] | null): number => {
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
        for (const contributor of contributors) {
            contributions += contributor.totalContributions;
            busFactor += 0.45;
            if (contributions >= fractionContributors) {
                break;
            }
        }
    }

    return Math.min(busFactor, 1);
};

export const getNumberOfContrubiters = async (owner: string, repo: string): Promise<number> => {
    try{
        const response = await fullGetRequest(`/repos/${owner}/${repo}/contributors?per_page=1&anon=true`);
        const link = response.headers.link;
        if(link){
            const linkArray = link.split(',');
            const lastLink = linkArray[linkArray.length - 1];
            const lastLinkArray = lastLink.split(';');
            const lastLinkPage = lastLinkArray[0].split('&page=')[1].split('>')[0];
            const numPages = parseInt(lastLinkPage);
            return numPages;
        }
        return 0;
    }catch(error: any){
        logger.info(`Error in getNumberOfContributors: repo: ${repo}, owner: ${owner}, response: ${JSON.stringify(response, null, 2)}, error: ${error}`);
        return 0;
    }
}

export const getBusFactor = async (owner: string, repo: string): Promise<number> => {
    const contributors = await getContributors(owner, repo);
    const numberOfContributors = await getNumberOfContrubiters(owner, repo);
    const contributorLengthScore = (Math.min(numberOfContributors, 100) / 100);
    const busFactor = calculateBusFactor(contributors);
    return ( (contributorLengthScore * 0.5) + (busFactor * 0.5));
};