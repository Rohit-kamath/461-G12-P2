// Package
export type Package = {
    metadata: PackageMetadata; // Description: ""
    data: PackageData; // Description: ""
};

// PackageMetadata
export type PackageMetadata = {
    Name: PackageName; // Description: Package name
    Version: string; // Description: Package version
    ID: PackageID; // Description: Unique ID for use with the /package/{id} endpoint.
};

// PackageData
export type PackageData = {
    Content?: string; // Description: Package contents (Base64 encoded zip file)
    URL?: string; // Description: Package URL for public ingest
    JSProgram?: string; // Description: A JavaScript program
};

// User
export type User = {
    name: string; // Description: ""
    isAdmin: boolean; // Description: Is this user an admin?
};

// UserAuthenticationInfo
export type UserAuthenticationInfo = {
    password: string; // Description: Password for a user. Per the spec, this should be a "strong" password.
};

// PackageID
export type PackageID = string; // Description: ""

// PackageRating
export type PackageRating = {
    BusFactor: number; // Description: ""
    Correctness: number; // Description: ""
    RampUp: number; // Description: ""
    ResponsiveMaintainer: number; // Description: ""
    LicenseScore: number; // Description: ""
    GoodPinningPractice: number; // Description: The fraction of its dependencies that are pinned to at least a specific major+minor version, e.g. version 2.3.X of a package. (If there are zero dependencies, they should receive a 1.0 rating. If there are two dependencies, one pinned to this degree, then they should receive a ½ = 0.5 rating).
    PullRequest: number; // Description: The fraction of project code that was introduced through pull requests with a code review.
    NetScore: number; // Description: Scores calculated from other seven metrics.
};

// PackageHistoryEntry
export type PackageHistoryEntry = {
    User: User; // Description: ""
    Date: string; // Description: Date of activity using ISO-8601 Datetime standard in UTC format.
    PackageMetadata: PackageMetadata; // Description: ""
    Action: 'CREATE' | 'UPDATE' | 'DOWNLOAD' | 'RATE'; // Description: ""
};

// PackageName
export type PackageName = string; // Description: Name of a package. Names should only use typical "keyboard" characters. The name "*" is reserved. See the `/packages` API for its meaning.

// AuthenticationToken
export type AuthenticationToken = string; // Description: "The spec permits you to use any token format you like. You could, for example, look into JSON Web Tokens ("JWT," pronounced "jots"): https://jwt.io."

// AuthenticationRequest
export type AuthenticationRequest = {
    User: User; // Description: ""
    Secret: UserAuthenticationInfo; // Description: ""
};

// SemverRange
export type SemverRange = string; // Description: ""

// PackageQuery
export type PackageQuery = {
    Version: SemverRange; // Description: ""
    Name: PackageName; // Description: ""
};

// EnumerateOffset
export type EnumerateOffset = string; // Description: Offset in pagination.

// PackageRegEx
export type PackageRegEx = {
    RegEx: string; // Description: A regular expression over package names and READMEs that is used for searching for a package
};