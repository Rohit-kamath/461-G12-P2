A CLI Interface to score npm packages on specified metrics

Our code leverages the GitHub API to judge the code on these metrics:
1) Bus Factor
2) Correctness
3) Ramp Up
4) Responsiveness
5) License

We evaluated the package on these metrics by obtaining valuable information about contributors, pull requests, issues, stars, forks etc.

There is an executable ./run file in the repository that lets the user run the following commands:
1) ./run install: To install any dependencies in userland
2) ./run URL_FILE:  This takes in a list of URLs and produces a NDJSON ouptut with the fields “URL”, “NetScore”, “RampUp”, “Correctness”, “BusFactor”, 
“ResponsiveMaintainer”, and “License” and values in the range [0, 1] where 0 indicates total failure and 1 indicates perfection.
3) ./run test: Runs the test cases for the given code outputs the number of tests passed and the code coverage obtained.

The metrics provided by this product can help ACME Corporation in its larger goal of establishing an internal package registry to reduce reliability on npm by providing ACME Corp employees with vital information regarding a particular package.

METRICS:
1) Bus Factor: <br />
Identify and count key contributors <br />
Check the code ownership distribution <br />
2) Correctness: <br />
Run ESLint through .ts/.js files <br />
Check for test suite <br />
Check stars and forks <br />
3) Responsive Maintainer: <br />
Check time between submiting a PR/issue and that PR/issue getting merged <br />
Check the length of comments on PRs <br />
4) License: <br />
Check if license file exists and is compatible <br />
5) Ramp Up: <br />
Examine number of forks, stars, and contributors <br />
Time taken by a new contributor to make their first commit <br />

Folder Structure:
src/ - contains all the source code  <br />
src/index.ts - entry point for the application  <br />
src/controllers/ - contains api logic  <br />
src/config/ - contains all environment variables, database connection, etc.  <br />
src/models/ - defines the interfaces for api  <br />
src/routes/ - contains all the routes  <br />
src/utils/ - all general purpose functions that can be used anywhere in the application  <br />
dist/ - contains all compiled javascript code  <br />

Project Members:
1) Dev Thakkar (duthakka@purdue.edu)
2) Jonathan Dow (dow3@purdue.edu)
3) Rohan Sagar (rsagar@purdue.edu)
4) Dongwon Kim (kim3574@purdue.edu)
