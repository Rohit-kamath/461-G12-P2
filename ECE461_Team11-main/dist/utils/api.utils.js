"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRequest = void 0;
const axios_1 = __importDefault(require("axios"));
const constants_1 = require("../helpers/constants");
const getRequest = async (endpoint, params) => {
    const url = `${constants_1.BASE_URL_GITHUB}${endpoint}`;
    const token = process.env.GITHUB_ACCESS_TOKEN;
    if (!token) {
        throw new Error('No bearer token found');
    }
    try {
        const response = await axios_1.default.get(url, {
            headers: {
                Authorization: `Bearer ${token}`
            },
            params: params
        });
        return response.data;
    }
    catch (error) {
        //console.error('Error making GET request:', error);
        throw error;
    }
};
exports.getRequest = getRequest;
