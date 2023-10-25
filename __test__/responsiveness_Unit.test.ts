import { Responsiveness } from '../src/controllers/responsiveness';
import * as responsivenessApi from '../src/utils/responsivenessApi';

jest.mock('../src/utils/responsivenessApi');

describe('Responsiveness Metric', () => {
    let responsiveness: Responsiveness;

    beforeEach(() => {
        responsiveness = new Responsiveness('sharedProp', 'owner', 'repo');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch and process data correctly', async () => {
        const mockIssues = [
            {
                created_at: '2023-01-01T10:00:00Z',
                closed_at: '2023-01-03T10:00:00Z'
            },
            // ... you can add more mock issues if needed
        ];

        (responsivenessApi.fetchIssues as jest.Mock).mockResolvedValue(mockIssues);

        await responsiveness.fetchData();

        expect(responsiveness['score_list'][0]).toBe(2);
    });

    it('should calculate metric correctly for median <= 1', async () => {
        (responsivenessApi.fetchIssues as jest.Mock).mockResolvedValue([]);
        responsiveness['score_list'] = [0.5, 0.8, 0.6]; 

        const result = await responsiveness.calculateMetric();

        expect(result).toBe(1);
    });

    it('should calculate metric correctly for median > 10', async () => {
        (responsivenessApi.fetchIssues as jest.Mock).mockResolvedValue([]);
        responsiveness['score_list'] = [12, 14, 11];

        const result = await responsiveness.calculateMetric();

        expect(result).toBe(0);
    });

    it('should calculate metric correctly for 1 < median <= 10', async () => {
        (responsivenessApi.fetchIssues as jest.Mock).mockResolvedValue([]);
        responsiveness['score_list'] = [3, 4, 2]; 

        const result = await responsiveness.calculateMetric();

        expect(result).toBeCloseTo(0.7778, 4);  // (1 - (3 - 1) / 9) = 0.7778
    });
});
