import { getContributors, calculateBusFactor } from '../src//controllers/BusFactor';

describe('Bus Factor Calculations Integration Tests', () => {

    const owner = 'facebook';
    const repo = 'react';

    test('Fetching contributors for a known repository', async () => {
        const contributors = await getContributors(owner, repo);
        
        expect(contributors).not.toBeNull();

        if (contributors) {
            expect(contributors.length).toBeGreaterThan(0);

            const firstContributor = contributors[0];
            expect(firstContributor).toHaveProperty('login');
            expect(firstContributor).toHaveProperty('commits');
            expect(firstContributor).toHaveProperty('prs');
            expect(firstContributor).toHaveProperty('issues');
            expect(firstContributor).toHaveProperty('totalContributions');
        }
    });

    test('Calculating bus factor for a known repository', async () => {
        const busFactor = await calculateBusFactor(owner, repo);

        expect(busFactor).toBeGreaterThanOrEqual(0);
        expect(busFactor).toBeLessThanOrEqual(1);
    });
});