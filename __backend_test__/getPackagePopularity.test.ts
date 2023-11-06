import { getPackagePopularity } from '../backend/apiPackage';

describe('getPackagePopularity', () => {
    it('should return package popularity when valid data is provided', async () => {
        const url = 'https://github.com/cloudinary/cloudinary_npm';
        const popularity = await getPackagePopularity(url);
        console.log(popularity);
        expect(popularity.stars).toBeGreaterThan(500);
        expect(popularity.forks).toBeGreaterThan(300);
    });
    it('should return package popularity even for a npm url', async () => {
        const url = 'https://www.npmjs.com/package/express';
        const popularity = await getPackagePopularity(url);
        console.log(popularity);
        expect(popularity.stars).toBeGreaterThan(500);
        expect(popularity.forks).toBeGreaterThan(300);
    });
});
