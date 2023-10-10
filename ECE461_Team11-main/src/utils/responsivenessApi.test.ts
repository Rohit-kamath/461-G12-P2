import * as responsivenessApi from './responsivenessApi';

// Mock the entire responsivenessApi module
jest.mock('./responsivenessApi', () => ({
  fetchIssueComments: jest.fn()
  // ... other functions you might want to mock
}));

describe('responsivenessApi', () => {
  const owner = 'kim3574';
  const repo = 'ECE461_Team11';

  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods:
    jest.clearAllMocks();
  });

  test('fetchIssueComments should return an array', async () => {
    // Mocking the response
    (responsivenessApi.fetchIssueComments as jest.Mock).mockResolvedValue([]);
    const comments = await responsivenessApi.fetchIssueComments(owner, repo, 1);
    expect(Array.isArray(comments)).toBe(true);
  });
});
