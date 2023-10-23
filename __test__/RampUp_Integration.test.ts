import { calculateRampUp } from '../src/controllers/RampUp';

describe('RampUp Calculations Integration Tests', () => {
	const owner = 'facebook';
	const repo = 'react';

	test('Fetching and computing ramp-up score for a known repository', async () => {
		const rampUpScore = await calculateRampUp(owner, repo);

		expect(rampUpScore).toBeGreaterThanOrEqual(0);
		expect(rampUpScore).toBeLessThanOrEqual(1);
	});

	// will add more integration tests
});
