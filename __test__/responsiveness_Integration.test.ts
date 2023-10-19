import { Responsiveness } from '../src/controllers/Responsiveness';

describe('Responsiveness Metric Integration Tests', () => {

    const owner = 'facebook';
    const repo = 'react';

    test('Fetching issue response times for a known repository', async () => {
        const responsiveness = new Responsiveness('sharedProp', owner, repo);
        const initialScore = await responsiveness.calculateMetric();
        
        expect(initialScore).toBeGreaterThanOrEqual(0);
        expect(initialScore).toBeLessThanOrEqual(1);
    });

    test('Calculating responsiveness score for a known repository', async () => {
        const responsiveness = new Responsiveness('sharedProp', owner, repo);

        const score = await responsiveness.calculateMetric();

        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
    });
});


