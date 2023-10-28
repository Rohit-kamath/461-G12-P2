import { Request, Response } from 'express';
import * as prismOperations from '../backend/prismaOperations';
import { PackageDownloadResponseType, getPackages, getPackageDownload } from '../backend/apiPackage';

jest.mock('../backend/prismaOperations');

describe('getPackageHistory', () => {
  it('should return package history when valid data is provided', async () => {
    const req : Partial<Request>= {
        query: {
            Version: '1.2.3',
            Name: "underscore"
        },
    };
    let responseObject = {};

    const res : Partial<Response>= {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnValue({
            json: jest.fn().mockImplementation((JSONdata) => {
                responseObject = JSONdata;
            })
        })
    };

    const mockData = [
      {
        name: 'packageName',
        version: '1.2.3',
        id: 'packageId',
      },
    ];

    (prismOperations.dbGetPackageMetaDataArray as jest.Mock).mockResolvedValue(mockData);

    await getPackages(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockData.map((data) => ({
      Name: data.name,
      Version: data.version,
      ID: data.id,
    })));
  });
});

describe('getPackageDownload', () => {
  it('should return package download data when valid package name and version are provided', async () => {
    const req: Partial<Request> = {
      query: {
        name: 'underscore',
        version: '1.2.3',
      },
    };

    let responseObject = {};

    const res: Partial<Response> = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnValueOnce((JSONdata: PackageDownloadResponseType) => {
        responseObject = JSONdata;
      }),
      send: jest.fn().mockReturnThis(),
    };

    const mockMetaData = {
      id: 'metadataId',
      name: 'underscore',
      version: '1.2.3',
    };

    const mockData = {
      id: 'dataId',
      content: 'mockContent',
      URL: 'mockURL',
      JSProgram: 'mockJSProgram',
    };

    // Mock the database call to return the mock metadata and data
    (prismOperations.dbGetPackageByNameAndVersion as jest.Mock).mockResolvedValue({ metadata: mockMetaData, data: mockData });

    await getPackageDownload(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      metadata: {
        Name: mockMetaData.name,
        Version: mockMetaData.version,
        ID: mockMetaData.id,
      },
      data: {
        Content: mockData.content,
        URL: mockData.URL,
        JSProgram: mockData.JSProgram,
      },
    });
  });
});