import { getRequest } from '../src/utils/api.utils';
import { calculateGoodPinningPractice } from '../src/controllers/GoodPinningPractice';

jest.mock('../src/utils/api.utils');

afterEach(() => {
    jest.clearAllMocks();
});

describe('Dependency Factor', () => {

    it('should return 1 if there are no dependencies', async () => {
        const mockData = {
            content: Buffer.from(JSON.stringify({})).toString('base64')
        };

        (getRequest as jest.Mock).mockResolvedValue(mockData);

        const score = await calculateGoodPinningPractice('testOwner', 'testRepo');
        expect(score).toBe(1);
    });

    it('should return 0.5 if there are 2 dependencies and 1 is pinned', async () => {
        const mockData = {
            content: Buffer.from(JSON.stringify({
                dependencies: {
                    dependency1: '1.0.0',
                    dependency2: '^1.0.0'
                }
            })).toString('base64')
        };

        (getRequest as jest.Mock).mockResolvedValue(mockData);

        const score = await calculateGoodPinningPractice('testOwner', 'testRepo');
        expect(score).toBe(0.5);
    });

    it('should return 0 if there are 2 dependencies and none are pinned', async () => {
        const mockData = {
            content: Buffer.from(JSON.stringify({
                dependencies: {
                    dependency1: '1.0.0',
                    dependency2: '1.0.0'
                }
            })).toString('base64')
        };

        (getRequest as jest.Mock).mockResolvedValue(mockData);

        const score = await calculateGoodPinningPractice('testOwner', 'testRepo');
        expect(score).toBe(0);
    });
});