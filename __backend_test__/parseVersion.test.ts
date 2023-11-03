import { parseVersion } from '../backend/apiPackage';

describe('parseVersion', () => {
    it('should return {min: "1.2.3", max: "1.2.3", minInclusive: true, maxInclusive: true} when version is "1.2.3"', async () => {
        const version = '1.2.3';
        const expected = { min: '1.2.3', max: '1.2.3', minInclusive: true, maxInclusive: true };
        expect(parseVersion(version)).toEqual(expected);
    });
    it('should return {min: "1.2.3", max: "1.2.4", minInclusive: true, maxInclusive: true} when version is "1.2.3 - 1.2.4"', async () => {
        const version = '1.2.3 - 1.2.4';
        const expected = { min: '1.2.3', max: '1.2.4', minInclusive: true, maxInclusive: true };
        expect(parseVersion(version)).toEqual(expected);
    });
    it('should return {min: "1.2.3", max: "2.0.0", minInclusive: true, maxInclusive: false} when version is "^1.2.3"', async () => {
        const version = '^1.2.3';
        const expected = { min: '1.2.3', max: '2.0.0', minInclusive: true, maxInclusive: false };
        expect(parseVersion(version)).toEqual(expected);
    });
    it('should return {min: "1.2.3", max: "1.3.0", minInclusive: true, maxInclusive: false} when version is "~1.2.3"', async () => {
        const version = '~1.2.3';
        const expected = { min: '1.2.3', max: '1.3.0', minInclusive: true, maxInclusive: false };
        expect(parseVersion(version)).toEqual(expected);
    });
});
