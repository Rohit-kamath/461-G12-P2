import { getRequest } from '../utils/api.utils';
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
            busFactor += 0.2;
            if (contributions >= fractionContributors) {
                break;
            }
        }
    }

    return Math.min(busFactor, 1);
};

//getBusFactor uses both previous functions and returns the score
export const getBusFactor = async (owner: string, repo: string): Promise<number> => {
    const contributors = await getContributors(owner, repo);
    const busFactor = calculateBusFactor(contributors);
    return busFactor;
};
