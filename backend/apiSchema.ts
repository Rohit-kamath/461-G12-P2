export type Package = {
    metadata: PackageMetadata;
    data: PackageData;
};

export type PackageMetadata = {
    Name: string;
    Version: string;
    ID: string;
};

export type PackageData = {
    Content?: string;
    URL?: string;
    JSProgram?: string;
};

export type User = {
    name: string;
    isAdmin: boolean;
};

export type UserAuthenticationInfo = {
    password: string;
};

export type PackageRating = {
    BusFactor: number;
    Correctness: number;
    RampUp: number;
    ResponsiveMaintainer: number;
    LicenseScore: number;
    GoodPinningPractice: number;
    PullRequest: number;
    NetScore: number;
};

export type PackageHistoryEntry = {
    User: User;
    Date: string;
    metadata: PackageMetadata;
    Action: 'CREATE' | 'UPDATE' | 'DOWNLOAD' | 'RATE';
};

export type PackageName = {
    Name: string;
};

export type AuthenticationToken = {
    token: string;
};

export type AuthenticationRequest = {
    User: User;
    Secret: UserAuthenticationInfo;
};

export type SemverRange = string;

export type PackageQuery = {
    Version: SemverRange;
    Name: PackageName;
};

export type EnumerateOffset = string;

export type PackageRegEx = {
    RegEx: string;
};