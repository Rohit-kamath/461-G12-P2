import { Request, Response } from 'express';
import * as prismaCalls from '../backend/prismaCalls';
import { PackageUpdateRequestType, PackageDownloadResponseType, updatePackage, getPackages, getPackageDownload } from '../backend/apiPackage';

jest.mock('../backend/prismaCalls');

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

    (prismaCalls.getMetaDataArray as jest.Mock).mockResolvedValue(mockData);

    await getPackages(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockData.map((data) => ({
      Name: data.name,
      Version: data.version,
      ID: data.id,
    })));
  });
});

//GET package download test
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
      json: jest.fn().mockImplementation((JSONdata: PackageDownloadResponseType) => {
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
    (prismaCalls.getPackageWithMetadataAndData as jest.Mock).mockResolvedValue({ metadata: mockMetaData, data: mockData });

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

//Update package test
describe('updatePackage', () => {
  it('should successfully update the package details when valid data is provided', async () => {
    const req: Partial<Request> = {
      body: {
        name: 'underscore',
        version: '1.2.3',
        content: 'updatedContent',
        URL: 'updatedURL',
        JSProgram: 'updatedJSProgram',
      } as PackageUpdateRequestType,
    };

    const mockUpdatedData = {
      id: 'dataId',
      content: 'updatedContent',
      URL: 'updatedURL',
      JSProgram: 'updatedJSProgram',
    };

    const res: Partial<Response> = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };

    // Mock the database call to simulate a successful update
    (prismaCalls.updatePackageDetails as jest.Mock).mockResolvedValue(mockUpdatedData);

    await updatePackage(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockUpdatedData);
  });

  it('should return an error if any of the required fields is missing', async () => {
    const req: Partial<Request> = {
      body: {
        name: 'underscore',
        version: '1.2.3',
        content: 'updatedContent',
        // Missing URL and JSProgram
      } as Partial<PackageUpdateRequestType>,
    };

    const res: Partial<Response> = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await updatePackage(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith('All fields are required');
  });

  it('should return an error if the package is not found or could not be updated', async () => {
    const req: Partial<Request> = {
      body: {
        name: 'nonExistentPackage',
        version: '1.2.3',
        content: 'updatedContent',
        URL: 'updatedURL',
        JSProgram: 'updatedJSProgram',
      } as PackageUpdateRequestType,
    };

    const res: Partial<Response> = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    // Mock the database call to simulate a package not found scenario
    (prismaCalls.updatePackageDetails as jest.Mock).mockResolvedValue(null);

    await updatePackage(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith('Package not found or could not be updated');
  });
});