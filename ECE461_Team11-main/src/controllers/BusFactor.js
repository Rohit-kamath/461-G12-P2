"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.calculateBusFactor = exports.getAllClosedIssues = exports.getAllPullRequests = exports.getAllRepoCommits = exports.getAllRepoBranches = void 0;
var api_utils_1 = require("../utils/api.utils");
var axios_1 = require("axios");
var getAllRepoBranches = function (owner, repo) { return __awaiter(void 0, void 0, void 0, function () {
    var response, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, (0, api_utils_1.getRequest)("/repos/".concat(owner, "/").concat(repo, "/branches?state=closed"))];
            case 1:
                response = _a.sent();
                return [2 /*return*/, parseBranchData(response)];
            case 2:
                error_1 = _a.sent();
                ////console.log('Error!!!:', error);
                return [2 /*return*/, null];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getAllRepoBranches = getAllRepoBranches;
// export const getAllCollaborators = async (req: Request, res: Response) => {
//   const { owner, repo } = req.query;
//   ////console.log('owner:', owner, 'repo:', repo);
//   if (typeof owner !== 'string' || typeof repo !== 'string') {
//     return res.status(400).json({ error: 'Owner and repo name required!' });
//   }
//   try {
//     const response = await getRequest(`/repos/${owner}/${repo}/collaborators`);
//     if (response) {
//       return res.status(200).json({ message: 'Success!!!', response });
//     } else {
//       return res.status(400).json({ error: 'Error getting collaborators' });
//     }
//   } catch (error: any) {
//     ////console.log('Error:', error);
//     return res.status(400).json({ error: 'Error getting collabs!!' });
//   }
// };
var getAllRepoCommits = function (owner, repo) { return __awaiter(void 0, void 0, void 0, function () {
    var branches, commitCounts, _i, branches_1, branchUrl, response, author, error_2;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0: return [4 /*yield*/, (0, exports.getAllRepoBranches)(owner, repo)];
            case 1:
                branches = _c.sent();
                if (!branches) {
                    return [2 /*return*/, null];
                }
                commitCounts = new Map();
                _i = 0, branches_1 = branches;
                _c.label = 2;
            case 2:
                if (!(_i < branches_1.length)) return [3 /*break*/, 7];
                branchUrl = branches_1[_i];
                _c.label = 3;
            case 3:
                _c.trys.push([3, 5, , 6]);
                return [4 /*yield*/, axios_1["default"].get(branchUrl.url)];
            case 4:
                response = _c.sent();
                author = (_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.user) === null || _b === void 0 ? void 0 : _b.login;
                if (author) {
                    commitCounts.set(author, (commitCounts.get(author) || 0) + 1);
                }
                return [3 /*break*/, 6];
            case 5:
                error_2 = _c.sent();
                return [3 /*break*/, 6];
            case 6:
                _i++;
                return [3 /*break*/, 2];
            case 7: return [2 /*return*/, commitCounts];
        }
    });
}); };
exports.getAllRepoCommits = getAllRepoCommits;
var parseBranchData = function (branches) {
    var branchDetails = [];
    branches.forEach(function (item) {
        var _a;
        var branchName = item === null || item === void 0 ? void 0 : item.name;
        var branchUrl = (_a = item === null || item === void 0 ? void 0 : item.commit) === null || _a === void 0 ? void 0 : _a.url;
        if (branchName && branchUrl) {
            branchDetails.push({ name: branchName, url: branchUrl });
        }
    });
    return branchDetails;
};
var getAllPullRequests = function (owner, repo) { return __awaiter(void 0, void 0, void 0, function () {
    var response, pullRequests, contributors;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, api_utils_1.getRequest)("/repos/".concat(owner, "/").concat(repo, "/pulls?state=closed"))];
            case 1:
                response = _a.sent();
                pullRequests = response || [];
                contributors = new Map();
                pullRequests.forEach(function (pr) {
                    var author = pr.user.login;
                    contributors.set(author, (contributors.get(author) || 0) + 1);
                });
                return [2 /*return*/, contributors];
        }
    });
}); };
exports.getAllPullRequests = getAllPullRequests;
var getAllClosedIssues = function (owner, repo) { return __awaiter(void 0, void 0, void 0, function () {
    var response, issues, contributors;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, api_utils_1.getRequest)("/repos/".concat(owner, "/").concat(repo, "/issues?state=closed"))];
            case 1:
                response = _a.sent();
                issues = response || [];
                contributors = new Map();
                issues.forEach(function (issue) {
                    var author = issue.user.login;
                    contributors.set(author, (contributors.get(author) || 0) + 1);
                });
                return [2 /*return*/, contributors];
        }
    });
}); };
exports.getAllClosedIssues = getAllClosedIssues;
var calculateBusFactor = function (owner, repo) { return __awaiter(void 0, void 0, void 0, function () {
    var allContributors, commitContributors, prContributors, issueContributors, totalContributions, totalContributors, busFactor, runningTotal, sortedContributors, _i, sortedContributors_1, _a, contributions, formattedContributors;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                allContributors = new Map();
                return [4 /*yield*/, (0, exports.getAllRepoCommits)(owner, repo)];
            case 1:
                commitContributors = _b.sent();
                ////console.log('Commit Contributors', commitContributors);
                commitContributors === null || commitContributors === void 0 ? void 0 : commitContributors.forEach(function (count, author) {
                    var current = allContributors.get(author) || {
                        commits: 0,
                        prs: 0,
                        issues: 0
                    };
                    allContributors.set(author, __assign(__assign({}, current), { commits: count }));
                });
                return [4 /*yield*/, (0, exports.getAllPullRequests)(owner, repo)];
            case 2:
                prContributors = _b.sent();
                ////console.log('PR contributors', prContributors);
                prContributors.forEach(function (count, author) {
                    var current = allContributors.get(author) || {
                        commits: 0,
                        prs: 0,
                        issues: 0
                    };
                    allContributors.set(author, __assign(__assign({}, current), { prs: count }));
                });
                return [4 /*yield*/, (0, exports.getAllClosedIssues)(owner, repo)];
            case 3:
                issueContributors = _b.sent();
                ////console.log('Issue contributors', issueContributors);
                issueContributors.forEach(function (count, author) {
                    var current = allContributors.get(author) || {
                        commits: 0,
                        prs: 0,
                        issues: 0
                    };
                    allContributors.set(author, __assign(__assign({}, current), { issues: count }));
                });
                totalContributions = 0;
                totalContributors = 0;
                allContributors.forEach(function (contribution) {
                    totalContributions +=
                        contribution.commits + contribution.prs + contribution.issues;
                    totalContributors++;
                });
                busFactor = 0;
                runningTotal = 0;
                sortedContributors = Array.from(allContributors.entries()).sort(function (a, b) {
                    return (b[1].commits +
                        b[1].prs +
                        b[1].issues -
                        (a[1].commits + a[1].prs + a[1].issues));
                });
                for (_i = 0, sortedContributors_1 = sortedContributors; _i < sortedContributors_1.length; _i++) {
                    _a = sortedContributors_1[_i], contributions = _a[1];
                    runningTotal +=
                        contributions.commits + contributions.prs + contributions.issues;
                    busFactor++;
                    if (runningTotal / totalContributions > 0.5) {
                        break;
                    }
                }
                formattedContributors = sortedContributors.map(function (_a) {
                    var author = _a[0], contributions = _a[1];
                    return (__assign({ author: author }, contributions));
                });
                ////console.log("BUS FACTOR", busFactor);
                return [2 /*return*/, busFactor];
        }
    });
}); };
exports.calculateBusFactor = calculateBusFactor;
