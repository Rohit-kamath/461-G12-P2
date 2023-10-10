import { 
  getAllRepoCommits,
  getAllPullRequests,
  getAllClosedIssues,
  calculateBusFactor
} from '../src/controllers/BusFactor';

jest.mock('../src/controllers/BusFactor.ts', () => ({
  getAllRepoCommits: jest.fn(() => Promise.resolve(new Map([['helloAuthor', 5], ['author2', 3]]))),
  getAllPullRequests: jest.fn(() => Promise.resolve(new Map([['helloAuthor', 2], ['author2', 1]]))),
  getAllClosedIssues: jest.fn(() => Promise.resolve(new Map([['helloAuthor', 1], ['author2', 6]]))),
}));

describe('calculateBusFactor', () => {
  it('calculates the bus factor correctly', async () => {
    const mockResponse: any = {
      json: jest.fn(),
      status: jest.fn(() => mockResponse)
    };

    await calculateBusFactor('github_owner', 'repository_name');

    expect(getAllRepoCommits).toHaveBeenCalledWith('github_owner', 'repository_name');
    expect(getAllPullRequests).toHaveBeenCalledWith('github_owner', 'repository_name');
    expect(getAllClosedIssues).toHaveBeenCalledWith('github_owner', 'repository_name');

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        busFactor: expect.any(Number),
        // totalContributors: expect.any(Number),
        // sortedContributors: expect.any(Array)
      })
    );
  });

  it('HANDLING ERRoRS', async () => {
    const mockResponse: any = {
      json: jest.fn(),
      status: jest.fn(() => mockResponse)
    };

    (getAllRepoCommits as jest.Mock).mockImplementationOnce(() => Promise.reject(new Error('API error')));

    await calculateBusFactor('github_owner', 'repository_name');

    expect(getAllRepoCommits).toHaveBeenCalledWith('github_owner', 'repository_name');
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'API error'
      })
    );
  });
});
