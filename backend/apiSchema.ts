// apiSchema.ts

interface Package {
    metadata: PackageMetadata;
    data: PackageData;
}

interface PackageMetadata {
    Name: string;
    Version: string;
    ID: string;
}

interface PackageData {
    Content?: string;
    URL?: string;
    JSProgram?: string;
}

interface User {
    name: string;
    isAdmin: boolean;
}

interface UserAuthenticationInfo {
    password: string;
}

interface PackageRating {
    BusFactor: number;
    Correctness: number;
    RampUp: number;
    ResponsiveMaintainer: number;
    LicenseScore: number;
    GoodPinningPractice: number;
    PullRequest: number;
    NetScore: number;
}

interface PackageHistoryEntry {
    User: User;
    Date: string;
    metadata: PackageMetadata;
    Action: 'CREATE' | 'UPDATE' | 'DOWNLOAD' | 'RATE';
}

interface PackageName {
    Name: string;
}

interface AuthenticationToken {
    token: string;
}

interface AuthenticationRequest {
    User: User;
    Secret: UserAuthenticationInfo;
}

type SemverRange = string;

interface PackageQuery {
    Version: SemverRange;
    Name: PackageName;
}

type EnumerateOffset = string;

interface PackageRegEx {
    RegEx: string;
}

// Export everything at the end of the file
export {
    Package,
    PackageMetadata,
    PackageData,
    User,
    UserAuthenticationInfo,
    PackageRating,
    PackageHistoryEntry,
    PackageName,
    AuthenticationToken,
    AuthenticationRequest,
    SemverRange,
    PackageQuery,
    EnumerateOffset,
    PackageRegEx,
};