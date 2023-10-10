"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllRepoCommits = exports.getAllRepoBranches = void 0;
const api_utils_1 = require("../utils/api.utils");
const axios_1 = __importDefault(require("axios"));
const getAllRepoBranches = async (req, res, owner, repo) => {
    try {
        const response = await (0, api_utils_1.getRequest)(`/repos/${owner}/${repo}/branches`);
        return parseBranchData(response);
    }
    catch (error) {
        //console.log('Error:', error);
        return null;
    }
};
exports.getAllRepoBranches = getAllRepoBranches;
const getAllRepoCommits = async (req, res) => {
    var _a, _b, _c;
    const { owner, repo } = req.query;
    if (typeof owner !== 'string' || typeof repo !== 'string') {
        return res.status(400).json({ error: 'Owner and repo name required!' });
    }
    const branches = await (0, exports.getAllRepoBranches)(req, res, owner, repo);
    if (!branches) {
        return res.status(400).json({ error: 'Error getting branches' });
    }
    // //console.log('branches:', branches);
    let parsedData = [];
    for (let branchUrl of branches) {
        try {
            const response = await axios_1.default.get(branchUrl);
            // //console.log("Response:", response.data);
            if (response.data) {
                parsedData.push((_c = (_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.commit) === null || _b === void 0 ? void 0 : _b.author) === null || _c === void 0 ? void 0 : _c.name);
            }
        }
        catch (error) {
            //console.error(`error with this url: ${branchUrl}!!!!`, error);
        }
    }
    return res.status(200).json({ message: 'Success!!!', parsedData });
};
exports.getAllRepoCommits = getAllRepoCommits;
const parseBranchData = (branches) => {
    const branchUrls = [];
    branches.forEach((item) => {
        var _a;
        const url = (_a = item === null || item === void 0 ? void 0 : item.commit) === null || _a === void 0 ? void 0 : _a.url;
        if (url) {
            branchUrls.push(url);
        }
    });
    return branchUrls;
};
