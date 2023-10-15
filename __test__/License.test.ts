import {getLicenseScore } from '../src/controllers/License';
import { mocked } from 'jest-mock';

// Mock the licenseApi methods
jest.mock('../src/utils/licenseApi');

const repoOwner = 'kim3574';
const repoName = 'ECE461_Team11';

describe('License Class', () => {
  beforeEach(() => {
    // Reset the mocks before each test
    jest.clearAllMocks();
  });

  it('should fetch data and calculate metric', async () => {
    // Mock API response
    mocked(licenseApi.fetchLicense).mockResolvedValue({
      license: {
        spdx_id: 'MIT'
      }
    });

    const license = new License('sharedProperty', repoOwner, repoName);
    await license.fetchData();
    const result = license.calculateMetric();

    expect(result).toBe(10); // MIT license score
  });

  it('should return 1 for calculateMetric when unknown license', async () => {
    mocked(licenseApi.fetchLicense).mockResolvedValue({
      license: {
        spdx_id: 'UNKNOWN'
      }
    });

    const license = new License('sharedProperty', repoOwner, repoName);
    await license.fetchData();
    const result = license.calculateMetric();

    expect(result).toBe(1); // Unknown license score
  });

  it('should handle empty API responses in fetchData', async () => {
    mocked(licenseApi.fetchLicense).mockResolvedValue(null);

    const license = new License('sharedProperty', repoOwner, repoName);
    const fetchDataResult = await license.fetchData();
    expect(fetchDataResult).toBe('Fetched license data successfully');
  });

  it('should handle API errors in fetchData', async () => {
    mocked(licenseApi.fetchLicense).mockRejectedValue(new Error('API Error'));

    const license = new License('sharedProperty', repoOwner, repoName);
    await expect(license.fetchData()).rejects.toThrow('API Error');
  });
});