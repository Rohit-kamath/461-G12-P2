import { NetScore } from '../src/controllers/NetScore';
import { correctness } from '../src/controllers/correctness';
import { calculateBusFactor } from '../src/controllers/BusFactor';
import { Responsiveness } from '../src/controllers/Responsiveness';
import { License } from '../src/controllers/License';

jest.mock('../src/controllers/correctness', () => ({
  correctness: jest.fn(() => ({
    check: jest.fn(() => 0.8), // Mock correctness score
  })),
}));

jest.mock('../src/controllers/BusFactor', () => ({
  calculateBusFactor: jest.fn(() => 0.6), // Mock bus factor score
}));

jest.mock('../src/controllers/RampUp', () => ({
  calculateRampUp: jest.fn(() => 0.7), // Mock ramp-up score
}));

jest.mock('../src/controllers/Responsiveness', () => ({
  Responsiveness: {
    calculate: jest.fn(() => 0.9), // Mock responsiveness score
  },
}));

jest.mock('../src/controllers/License', () => ({
  License: {
    calculate: jest.fn(() => 0.95), // Mock license score
  },
}));

describe('NetScore', () => {
  it('calculates the net score correctly', async () => {
    const netScore = new NetScore('github_owner', 'repository_name');
    const score = await netScore.calculate();

    expect(correctness).toHaveBeenCalledWith('github_owner', 'repository_name');
    expect(calculateBusFactor).toHaveBeenCalled();
    expect(Responsiveness.calculate).toHaveBeenCalledWith('github_owner', 'repository_name');
    expect(License.calculate).toHaveBeenCalled();

    // Expected score calculation: 0.8 (correctness) + 0.6 (bus factor) + 0.7 (ramp-up) + 0.9 (responsiveness) + 0.95 (license) = 3.95
    expect(score).toBe(3.95);
  });
  it('calculates the net score with minimum values correctly', async () => {
    // Mock correctness to return the minimum score
    correctness.mockImplementation(() => ({
      check: jest.fn(() => 0),
    }));

    // Mock other dependencies as before
    const netScore = new NetScore('github_owner', 'repository_name');
    const score = await netScore.calculate();

    // Expected score calculation: 0 (correctness) + 0.6 (bus factor) + 0.7 (ramp-up) + 0.9 (responsiveness) + 0.95 (license) = 3.15
    expect(score).toBe(3.15);
  });

  it('calculates the net score with maximum values correctly', async () => {
    // Mock correctness to return the maximum score
    correctness.mockImplementation(() => ({
      check: jest.fn(() => 1),
    }));

    // Mock other dependencies as before
    const netScore = new NetScore('github_owner', 'repository_name');
    const score = await netScore.calculate();

    // Expected score calculation: 1 (correctness) + 0.6 (bus factor) + 0.7 (ramp-up) + 0.9 (responsiveness) + 0.95 (license) = 3.15
    expect(score).toBe(3.15);
  });

  it('calculates the net score with zero bus factor correctly', async () => {
    // Mock bus factor to return zero
    calculateBusFactor.mockImplementation(() => 0);

    // Mock other dependencies as before
    const netScore = new NetScore('github_owner', 'repository_name');
    const score = await netScore.calculate();

    // Expected score calculation: 0.8 (correctness) + 0 (bus factor) + 0.7 (ramp-up) + 0.9 (responsiveness) + 0.95 (license) = 3.35
    expect(score).toBe(3.35);
  });
});
