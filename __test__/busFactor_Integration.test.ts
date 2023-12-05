import { getContributors, calculateBusFactor, getBusFactor } from '../src//controllers/busFactor';

describe('Bus Factor Calculations Integration Tests', () => {
    const owner = 'expressjs';
    const repo = 'express';

    test('Fetching contributors for a known repository', async () => {
        const contributors = await getContributors(owner, repo);

        expect(contributors).not.toBeNull();

        if (contributors) {
            expect(contributors.length).toBeGreaterThan(0);

            const firstContributor = contributors[0];
            expect(firstContributor).toHaveProperty('login');
            expect(firstContributor).toHaveProperty('totalContributions');
        }
    });

    test('Calculating bus factor for a known repository', async () => {
        const contributors = await getContributors(owner, repo);
        const busFactor = await calculateBusFactor(contributors);
        const score = await getBusFactor(owner, repo);
        console.log(score)
        expect(busFactor).toBeGreaterThanOrEqual(0);
        expect(busFactor).toBeLessThanOrEqual(1);
    });
});
