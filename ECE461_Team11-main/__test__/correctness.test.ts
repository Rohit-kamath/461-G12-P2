import { correctness } from '../src/controllers/correctness';

describe('correctness', () => {

  it('should return a score of 0 if the repository does not exist', async () => {
    const checker = new correctness('DevT9', 'ThisRepoDoesNotExist');
    const score = await checker.check();
    expect(score).toBe(0);
  });

  it('should return a score greater than 0.8 if the repository has no errors and has a test suite', async () => {
    const checker = new correctness("PurdueIEEE", "IEEE-Website");
    const score = await checker.check();
    expect(score).toBeGreaterThan(0.8);
  });

  it('should return a score greater than 0.48 if the repository has no errors but doesnt have a test suite', async () => {
    const checker = new correctness('PurdueIEEE', 'boilerbooks');
    const score = await checker.check();
    expect(score).toBeGreaterThan(0.48);
  });
  it ('should return a score less than 0.48 because of errors', async () => {
    const checker = new correctness('DevT9', 'TestRepo');
    const score = await checker.check();
    expect(score).toBeLessThan(0.48);
  });
});