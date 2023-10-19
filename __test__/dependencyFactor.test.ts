import { getRequest } from '../src/utils/api.utils';
import { calculateDependencyFactor } from '../src/controllers/DependencyFactor';

jest.mock('../src/utils/api.utils');

//clear all mocks after each test
afterEach(() => {
    jest.clearAllMocks();
});

//create a test that sees if it returns a 1 if there are no dependencies
describe('Dependency Factor', () => {
    it('should return 1 if there are no dependencies', async () => {
        const mockData = [
            {
                name: 'dependency1',
                version: '1.0.0'
            },
            {
                name: 'dependency2',
                version: '^1.0.0'
            }
        ];

        (getRequest as jest.Mock).mockResolvedValue([]);

        const score = await calculateDependencyFactor('testOwner', 'testRepo');
        expect(score).toBe(1);
    });
});

// //create a test that returns 1/2 if there are 2 dependencies and 1 is pinned
// describe('Dependency Factor', () => {
//     it('should return 1/2 if there are 2 dependencies and 1 is pinned', async () => {
//         const mockData = [
//             {
//                 name: 'dependency1',
//                 version: '1.0.0'
//             },
//             {
//                 name: 'dependency2',
//                 version: '^1.0.0'
//             }
//         ];
//         (getRequest as jest.Mock).mockResolvedValue(mockData);

//         const score = await calculateDependencyFactor('testOwner', 'testRepo');
//         expect(score).toBe(0.5);
//     });
// });

// //create a test that returns 0 if there's 2 dependencies and none are pinned
// describe('Dependency Factor', () => {
//     it('should return 0 if there are 2 dependencies and none are pinned', async () => {
//         const mockData = [
//             {
//                 name: 'dependency1',
//                 version: '1.0.0'
//             },
//             {
//                 name: 'dependency2',
//                 version: '1.0.0'
//             }
//         ];
//         (getRequest as jest.Mock).mockResolvedValue(mockData);

//         const score = await calculateDependencyFactor('testOwner', 'testRepo');
//         expect(score).toBe(0);
//     });
// });