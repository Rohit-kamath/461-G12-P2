import { calculateRampUp } from '../src/controllers/RampUp';
import { correctness } from '../src/controllers/correctness';

jest.mock('../src/utils/RampUpAPI', () => ({
  fetchRepositoryContributors: jest.fn(() => Promise.resolve([])),
  fetchRepositoryStars: jest.fn(() => Promise.resolve([])),
  fetchRepositoryForks: jest.fn(() => Promise.resolve([])),
  fetchFirstCommitTime: jest.fn(() => Promise.resolve('2023-09-20T12:00:00Z')),
}));

describe('calculateRampUp', () => {
  it('calculates the ramp-up score correctly', async () => {
    const mockResponse: any = {
      json: jest.fn(),
      status: jest.fn(() => mockResponse),
      send: jest.fn(),
    };

    const {
      fetchRepositoryContributors,
      fetchRepositoryStars,
      fetchRepositoryForks,
      fetchFirstCommitTime,
    } = require('../src/utils/RampUpAPI');

    await calculateRampUp(
      { query: { owner: 'github_owner', repo: 'repository_name' } } as any,
      mockResponse as any
    );

    expect(fetchRepositoryContributors).toHaveBeenCalledWith('github_owner', 'repository_name');
    expect(fetchRepositoryStars).toHaveBeenCalledWith('github_owner', 'repository_name');
    expect(fetchRepositoryForks).toHaveBeenCalledWith('github_owner', 'repository_name');
    expect(fetchFirstCommitTime).toHaveBeenCalledWith('github_owner', 'repository_name');
    expect(mockResponse.json).toHaveBeenCalledWith({ rampUpScore: expect.any(Number) });
  });

  it('handles a case where fetchFirstCommitTime returns null', async () => {
    // Mock fetchFirstCommitTime to return null
    require('../src/utils/RampUpAPI').fetchFirstCommitTime = jest.fn(() => Promise.resolve(null));

    const mockResponse: any = {
      json: jest.fn(),
      status: jest.fn(() => mockResponse),
      send: jest.fn(),
    };

    await calculateRampUp(
      { query: { owner: 'github_owner', repo: 'repository_name' } } as any,
      mockResponse as any
    );

    // Expect that the code handles null firstCommitTime gracefully
    expect(mockResponse.json).toHaveBeenCalledWith({ rampUpScore: expect.any(Number) });
  });

  it('handles an error during API fetch', async () => {
    // Mock one of the API functions to throw an error
    require('../src/utils/RampUpAPI').fetchRepositoryContributors = jest.fn(() => {
      throw new Error('API Error');
    });

    const mockResponse: any = {
      json: jest.fn(),
      status: jest.fn(() => mockResponse),
      send: jest.fn(),
    };

    await calculateRampUp(
      { query: { owner: 'github_owner', repo: 'repository_name' } } as any,
      mockResponse as any
    );

    // Expect that the code handles errors during API fetch
    expect(mockResponse.status).toHaveBeenCalledWith(500);
  });

  it('handles a case with non-zero contributors, stars, forks, and first commit time', async () => {
    // Mock the API functions to return non-empty results
    require('../src/utils/RampUpAPI').fetchRepositoryContributors = jest.fn(() =>
      Promise.resolve([{ login: 'user1' }, { login: 'user2' }])
    );
    require('../src/utils/RampUpAPI').fetchRepositoryStars = jest.fn(() =>
      Promise.resolve([{ login: 'user3' }, { login: 'user4' }])
    );
    require('../src/utils/RampUpAPI').fetchRepositoryForks = jest.fn(() =>
      Promise.resolve([{ login: 'user5' }, { login: 'user6' }])
    );

    const mockResponse: any = {
      json: jest.fn(),
      status: jest.fn(() => mockResponse),
      send: jest.fn(),
    };

    await calculateRampUp(
      { query: { owner: 'github_owner', repo: 'repository_name' } } as any,
      mockResponse as any
    );

    // Expect that the code handles the case with non-zero contributors, stars, forks, and first commit time
    expect(mockResponse.json).toHaveBeenCalledWith({ rampUpScore: expect.any(Number) });
  });
});

