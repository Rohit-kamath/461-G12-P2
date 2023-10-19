import { calculateBusFactor, getContributors } from '../src/controllers/BusFactor';
import { getRequest } from '../src/utils/api.utils';

jest.mock('../src/utils/api.utils');

describe('Bus Factor calculations', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getContributors', () => {
        it('should correctly process contributor data', async () => {
        const mockContributors = {
            content: Buffer.from(JSON.stringify([
                {
                    author: { login: 'user1' },
                    total: 60,
                    weeks: [
                        { c: 30, a: 20 },
                        { c: 20, a: 10 },
                    ],
                },
                {
                    author: { login: 'user2' },
                    total: 30,
                    weeks: [
                        { c: 10, a: 10 },
                        { c: 5, a: 5 },
                    ],
                }
            ])).toString('base64')
        };
        
        (getRequest as jest.Mock).mockResolvedValue(mockContributors);

        const contributors = await getContributors('owner', 'repo');
        expect(contributors).not.toBeNull();
            if (contributors) {
                expect(contributors).toHaveLength(2);
                expect(contributors[0].login).toBe('user1');
                expect(contributors[0].totalContributions).toBe(140);
                expect(contributors[1].login).toBe('user2');
                expect(contributors[1].totalContributions).toBe(60);
            }
        });
    });

describe('calculateBusFactor', () => {
    it('should correctly calculate bus factor when contributors are present', async () => {
        const mockContributors = {
            content: Buffer.from(JSON.stringify([
                {
                    author: { login: 'user1' },
                    total: 60,
                    weeks: [
                        { c: 30, a: 20 },
                        { c: 20, a: 10 },
                    ],
                },
                {
                    author: { login: 'user2' },
                    total: 30,
                    weeks: [
                        { c: 10, a: 10 },
                        { c: 5, a: 5 },
                    ],
                }
            ])).toString('base64')
        };

        (getRequest as jest.Mock).mockResolvedValue(mockContributors);

        const result = await calculateBusFactor('owner', 'repo');
        expect(result).toBe(0.2);
    });

    it('should return a bus factor of 0 if no contributors are found', async () => {
        (getRequest as jest.Mock).mockResolvedValue([]);

        const result = await calculateBusFactor('owner', 'repo');
        expect(result).toBe(0);
    });

    it('should return null if encounters an error', async () => {
        (getRequest as jest.Mock).mockRejectedValue(new Error('API Error'));

        const result = await calculateBusFactor('owner', 'repo');
        //returns null if error
        expect(result).toBe(0);
    });

    it('should make correct API calls with given owner and repo', async () => {
        (getRequest as jest.Mock).mockResolvedValue([]);

        await calculateBusFactor('testOwner', 'testRepo');
    
        expect(getRequest).toHaveBeenCalledWith('/repos/testOwner/testRepo/stats/contributors');
    });
});
});

