import { Responsiveness } from '../src/controllers/Responsiveness';
import * as responsivenessApi from '../src/utils/responsivenessApi';
import { mocked } from 'jest-mock';

// Mock the responsivenessApi methods
jest.mock('../src/utils/responsivenessApi');

const repoOwner = 'kim3574';
const repoName = 'ECE461_Team11';

describe('Responsiveness Class', () => {
  beforeEach(() => {
    // Reset the mocks before each test
    jest.clearAllMocks();
  });

  it('should fetch data and calculate metric', async () => {
    // Mock API responses
    mocked(responsivenessApi.fetchIssueComments).mockResolvedValue([
      {
        created_at: new Date('2023-01-01T00:00:00Z').toISOString(),
        updated_at: new Date('2023-01-01T01:00:00Z').toISOString()
      }
    ]);
    mocked(responsivenessApi.fetchPullRequestComments).mockResolvedValue([
      {
        created_at: new Date('2023-01-01T02:00:00Z').toISOString(),
        updated_at: new Date('2023-01-01T03:00:00Z').toISOString()
      }
    ]);
    mocked(responsivenessApi.fetchPullRequestMergeTime).mockResolvedValue({
      created_at: new Date('2023-01-01T04:00:00Z').toISOString(),
      merged_at: new Date('2023-01-01T05:00:00Z').toISOString()
    });

    const responsiveness = new Responsiveness(
      'sharedProperty',
      repoOwner,
      repoName
    );
    await responsiveness.fetchData();
    const result = responsiveness.calculateMetric();

    expect(result).toBeCloseTo(20);
  });

  it('should return 0 for calculateMetric when no API responses', async () => {
    const responsiveness = new Responsiveness(
      'sharedProperty',
      repoOwner,
      repoName
    );
    const result = responsiveness.calculateMetric();
    expect(result).toBe(0);
  });

  it('should handle empty API responses in fetchData', async () => {
    mocked(responsivenessApi.fetchIssueComments).mockResolvedValue([]);
    mocked(responsivenessApi.fetchPullRequestComments).mockResolvedValue([]);
    mocked(responsivenessApi.fetchPullRequestMergeTime).mockResolvedValue(null);

    const responsiveness = new Responsiveness(
      'sharedProperty',
      repoOwner,
      repoName
    );
    const fetchDataResult = await responsiveness.fetchData();
    expect(fetchDataResult).toBe(
      'Fetched and processed data for Responsive Maintainer'
    );
  });

  it('should handle API errors in fetchData', async () => {
    mocked(responsivenessApi.fetchIssueComments).mockRejectedValue(
      new Error('API Error')
    );

    const responsiveness = new Responsiveness(
      'sharedProperty',
      repoOwner,
      repoName
    );
    await expect(responsiveness.fetchData()).rejects.toThrow('API Error');
  });

  it('should calculate metric correctly with partial response times', async () => {
    mocked(responsivenessApi.fetchIssueComments).mockResolvedValue([
      {
        created_at: new Date('2023-01-01T00:00:00Z').toISOString(),
        updated_at: new Date('2023-01-01T01:00:00Z').toISOString()
      }
    ]);
    mocked(responsivenessApi.fetchPullRequestComments).mockResolvedValue([]);
    mocked(responsivenessApi.fetchPullRequestMergeTime).mockResolvedValue(null);

    const responsiveness = new Responsiveness(
      'sharedProperty',
      repoOwner,
      repoName
    );
    await responsiveness.fetchData();
    const result = responsiveness.calculateMetric();
    expect(result).toBeCloseTo(60); // Only issue response time is considered
  });
});
