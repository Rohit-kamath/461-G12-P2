import * as prismaClient from '@prisma/client';

export type Package = {
    metadata: PackageMetadata;
    data: PackageData;
};

export type PackageMetadata = {
    Name: PackageName; // Description: Package name
    Version: string; // Description: Package version
    ID: PackageID; // Description: Unique ID for use with the /package/{id} endpoint.
    Rating?: PackageRating;
};

export type PackageData = {
    Content?: string; // Description: Package contents (Base64 encoded zip file)
    URL?: string; // Description: Package URL for public ingest
    JSProgram?: string; // Description: A JavaScript program
};

export type PackageID = string;

export type PackageRating = {
    BusFactor: number;
    Correctness: number;
    RampUp: number;
    ResponsiveMaintainer: number;
    LicenseScore: number;
    GoodPinningPractice: number; // Description: The fraction of its dependencies that are pinned to at least a specific major+minor version, e.g. version 2.3.X of a package. (If there are zero dependencies, they should receive a 1.0 rating. If there are two dependencies, one pinned to this degree, then they should receive a ½ = 0.5 rating).
    PullRequest: number; // Description: The fraction of project code that was introduced through pull requests with a code review.
    NetScore: number; // Description: Scores calculated from other seven metrics.
    Metadata?: PackageMetadata;
};

export type PackageHistoryEntry = {
    User: User;
    Date: string; // Description: Date of activity using ISO-8601 Datetime standard in UTC format.
    PackageMetadata: PackageMetadata;
    Action: prismaClient.Action;
};

export type PackageName = string; // Description: Name of a package. Names should only use typical "keyboard" characters. The name "*" is reserved. See the `/packages` API for its meaning.

export type SemverRange = string;

export type PackageQuery = {
    Version: SemverRange;
    Name: PackageName;
    Popularity?: boolean;
};

export type EnumerateOffset = string; // Description: Offset in pagination.

export type PackageRegEx = {
    RegEx: string; // Description: A regular expression over package names and READMEs that is used for searching for a package
};

export type User = {
    name: string;
    isAdmin: boolean;
};