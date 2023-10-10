"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRepoCommits = void 0;
const axios_1 = __importDefault(require("axios"));
const constants_1 = require("../config/helpers/constants");
const getRepoCommits = async (owner, repo) => {
    try {
        const response = await axios_1.default.get(`${constants_1.BASE_URL_GITHUB}/repos/${owner}/${repo}/commits`);
        return response.data;
    }
    catch (error) {
        //console.error('Error fetching repo commits:', error);
        throw error;
    }
};
exports.getRepoCommits = getRepoCommits;
