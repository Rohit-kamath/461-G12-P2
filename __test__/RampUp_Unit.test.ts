import * as RampUpAPI from '../src/utils/RampUpAPI';
import { calculateRampUp } from '../src/controllers/RampUp';

jest.mock('../src/utils/RampUpAPI');  // Mock the entire RampUpAPI module

describe('RampUp Unit Tests', () => {
    const owner = 'facebook';
    const repo = 'react';

    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();
    });

    it('should correctly compute a ramp-up score based on mock data', async () => {
        // Mocking the data fetched from GitHub API
        (RampUpAPI.fetchRepositoryContributors as jest.Mock).mockImplementation(() => Promise.resolve([{ /*...mock contributor data...*/ }]));
        (RampUpAPI.fetchRepositoryStars as jest.Mock).mockImplementation(() => Promise.resolve([{ /*...mock star data...*/ }]));
        (RampUpAPI.fetchRepositoryForks as jest.Mock).mockImplementation(() => Promise.resolve([{ /*...mock fork data...*/ }]));
        (RampUpAPI.fetchFirstCommitTime as jest.Mock).mockImplementation(() => Promise.resolve('2022-01-01T10:00:00Z'));

        const rampUpScore = await calculateRampUp(owner, repo);

        expect(rampUpScore).toBeGreaterThanOrEqual(0);
        expect(rampUpScore).toBeLessThanOrEqual(1);
    });

    // will add more unit tests here

});

