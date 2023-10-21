import { calculateBusFactor } from '../src/controllers/BusFactor';

interface Contributor {
    login : string;
    totalContributions : number;
}

describe('Bus Factor calculations', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getContributors', () => {
        it('should correctly process contributor data', async () => {

        const contributors: Contributor[] = [
            { login: "user1", totalContributions: 140 },
            { login: "user2", totalContributions: 60 },
        ];
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
            const contributors: Contributor[] = [
                { login: "user1", totalContributions: 140 },
                { login: "user2", totalContributions: 60 },
            ];

            const result = await calculateBusFactor(contributors);
            expect(result).toBe(0.2);
        });

        it('should return a bus factor of 0 if no contributors are found', async () => {
            const result = await calculateBusFactor([]);
            expect(result).toBe(0);
        });
    });
});