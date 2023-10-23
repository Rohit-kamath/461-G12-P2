interface Package {
    metadata: PackageMetadata;
    data: PackageData;
}

interface PackageMetadata {
    /*
     * The "Name" and "Version" are used as a unique identifier pair when uploading a package.
     * The "ID" is used as an internal identifier for interacting with existing packages.
     */
    Name: string;  // Package name
    Version: string;  // Package version
    ID: string;  // Unique ID for use with the /package/{id} endpoint.
}

interface PackageData {
    /*
     * This is a "union" type.
     * - On package upload, either Content or URL should be set. If both are set, returns 400.
     * - On package update, exactly one field should be set.
     * - On download, the Content field should be set.
     */
    Content?: string;
    /*
     * Package contents. This is the zip file uploaded by the user. (Encoded as text using a Base64 encoding).
     * This will be a zipped version of an npm package's GitHub repository, minus the ".git/" directory.
     * It will, for example, include the "package.json" file that can be used to retrieve the project homepage.
     * See https://docs.npmjs.com/cli/v7/configuring-npm/package-json#homepage.
     */
    URL?: string;  // Package URL (for use in public ingest).
    JSProgram?: string;  // A JavaScript program (for use with sensitive modules).
}

interface User {
    name: string;
    isAdmin: boolean;  // Is this user an admin?
}

interface UserAuthenticationInfo {
    /*
     * Password for a user. Per the spec, this should be a "strong" password.
     */
    password: string;
}

interface PackageRating {
    /*
     * Package rating (cf. Project 1).
     * If the Project 1 that you inherited does not support one or more of the original properties, denote this with the value "-1".
     */
    BusFactor: number;
    Correctness: number;
    RampUp: number;
    ResponsiveMaintainer: number;
    LicenseScore: number;
    /*
     * The fraction of its dependencies that are pinned to at least a specific major+minor version,
     * e.g. version 2.3.X of a package. (If there are zero dependencies, they should receive a 1.0 rating.
     * If there are two dependencies, one pinned to this degree, then they should receive a ½ = 0.5 rating.
     */
    GoodPinningPractice: number;
    /*
     * The fraction of project code that was introduced through pull requests with a code review.
     */
    PullRequest: number;
    /*
     * Scores calculated from other seven metrics.
     */
    NetScore: number;
}

interface PackageHistoryEntry {
    User: User;
    /*
     * Date of activity using ISO-8601 Datetime standard in UTC format.
     * Example: 2023-03-23T23:11:15Z
     */
    Date: string;
    metadata: PackageMetadata;
    Action: 'CREATE' | 'UPDATE' | 'DOWNLOAD' | 'RATE';
}

interface PackageName {
    /*
     * Name of a package.
     * - Names should only use typical "keyboard" characters.
     * - The name "*" is reserved. See the `/packages` API for its meaning.
     */
    Name: string;
}

interface AuthenticationToken {
    /*
     * The spec permits you to use any token format you like. You could,
     * for example, look into JSON Web Tokens ("JWT", pronounced "jots"): https://jwt.io.
     */
    token: string;
}

interface AuthenticationRequest {
    User: User;
    Secret: UserAuthenticationInfo;
}

type SemverRange = string;
    /*
     * Exact (1.2.3)
     * Bounded range (1.2.3-2.1.0)
     * Carat (^1.2.3)
     * Tilde (~1.2.0)
     */

interface PackageQuery {
    Version: SemverRange;
    Name: PackageName;
}

type EnumerateOffset = string;
    // Offset in pagination.

interface PackageRegEx {
    /*
     * A regular expression over package names and READMEs that is used for searching for a package.
     */
    RegEx: string;
}
