import { Request, Response } from 'express';
import * as prismaCalls from '../backend/prismaCalls';
import { getPackages } from '../backend/apiPackage';

jest.mock('../backend/prismaCalls');

describe('getPackages', () => {
    it('should return package history when valid data is provided', async () => {
        const req: Partial<Request> = {
            body: {
                Version: '1.2.3',
                Name: 'underscore',
            },
        };

        const res: Partial<Response> = {
            setHeader: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnValue({
                json: jest.fn().mockImplementation((JSONdata) => {
                    return JSONdata;
                }),
            }),
        };

        const mockData = [
            {
                name: 'packageName',
                version: '1.2.3',
                id: 'packageId',
            },
        ];

        (prismaCalls.getMetaDataByQuery as jest.Mock).mockResolvedValue(mockData);

        await getPackages(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            mockData.map((data) => ({
                Name: data.name,
                Version: data.version,
                ID: data.id,
            })),
        );
    });
});
