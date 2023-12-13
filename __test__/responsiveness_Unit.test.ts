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
                closed_at: '2023-01-03T10:00:00Z',
            },
            // ... you can add more mock issues if needed
        ];

        (responsivenessApi.fetchIssues as jest.Mock).mockResolvedValue(mockIssues);

        await responsiveness.fetchData();

        expect(responsiveness['score_list'][0]).toBe(2);
    });

    it('should calculate metric correctly for median <= 7', async () => {
        (responsivenessApi.fetchIssues as jest.Mock).mockResolvedValue([]);
        responsiveness['score_list'] = [2, 3, 1];

        const result = await responsiveness.calculateMetric();

        expect(result).toBe(1);
    });

    it('should calculate metric correctly for median > 30', async () => {
        (responsivenessApi.fetchIssues as jest.Mock).mockResolvedValue([]);
        responsiveness['score_list'] = [31, 33, 35];

        const result = await responsiveness.calculateMetric();

        expect(result).toBe(0);
    });

    it('should calculate metric correctly for 7 < median <= 30', async () => {
        (responsivenessApi.fetchIssues as jest.Mock).mockResolvedValue([]);
        responsiveness['score_list'] = [8, 9, 10];

        const result = await responsiveness.calculateMetric();
        const expectedScore = 1 - (9 - 7) / (30 - 7);
        expect(result).toBeCloseTo(expectedScore, 4);
    });
});
