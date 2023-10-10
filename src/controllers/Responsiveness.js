"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.Responsiveness = void 0;
var MetricParent_1 = require("../helpers/MetricParent");
var responsivenessApi = require("../utils/responsivenessApi");
var Responsiveness = /** @class */ (function (_super) {
    __extends(Responsiveness, _super);
    function Responsiveness(someSharedProperty, repoOwner, repoName) {
        var _this = _super.call(this, someSharedProperty, 'Responsive Maintainer', 'kim3574') || this;
        _this.issueResponseTime = 0;
        _this.prResponseTime = 0;
        _this.commitMergeTime = 0;
        _this.repoOwner = repoOwner;
        _this.repoName = repoName;
        return _this;
    }
    Responsiveness.prototype.fetchData = function () {
        return __awaiter(this, void 0, void 0, function () {
            var issueComments, issueCreationTime, firstCommentTime, prComments, prCreationTime, firstPrCommentTime, prMergeData, prCreationTime, mergeTime, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, responsivenessApi.fetchIssueComments(this.repoOwner, this.repoName, 1)];
                    case 1:
                        issueComments = _a.sent();
                        if (issueComments && issueComments.length > 0) {
                            issueCreationTime = new Date(issueComments[0].created_at);
                            firstCommentTime = new Date(issueComments[0].updated_at);
                            this.issueResponseTime =
                                (firstCommentTime.getTime() - issueCreationTime.getTime()) /
                                    (1000 * 60); // in minutes
                        }
                        return [4 /*yield*/, responsivenessApi.fetchPullRequestComments(this.repoOwner, this.repoName, 1)];
                    case 2:
                        prComments = _a.sent();
                        if (prComments && prComments.length > 0) {
                            prCreationTime = new Date(prComments[0].created_at);
                            firstPrCommentTime = new Date(prComments[0].updated_at);
                            this.prResponseTime =
                                (firstPrCommentTime.getTime() - prCreationTime.getTime()) /
                                    (1000 * 60); // in minutes
                        }
                        return [4 /*yield*/, responsivenessApi.fetchPullRequestMergeTime(this.repoOwner, this.repoName, 1)];
                    case 3:
                        prMergeData = _a.sent();
                        if (prMergeData) {
                            prCreationTime = new Date(prMergeData.created_at);
                            mergeTime = new Date(prMergeData.merged_at);
                            this.commitMergeTime =
                                (mergeTime.getTime() - prCreationTime.getTime()) / (1000 * 60); // in minutes
                        }
                        return [2 /*return*/, Promise.resolve('Fetched and processed data for Responsive Maintainer')];
                    case 4:
                        error_1 = _a.sent();
                        //console.error('Error fetching data:', error_1);
                        return [2 /*return*/, Promise.reject(error_1)];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    Responsiveness.prototype.calculateMetric = function () {
        var validDataCount = 0;
        var totalResponseTime = 0;
        // Issue Response Time
        if (this.issueResponseTime !== null) {
            totalResponseTime += this.issueResponseTime;
            validDataCount++;
        }
        // PR Response Time
        if (this.prResponseTime !== null) {
            totalResponseTime += this.prResponseTime;
            validDataCount++;
        }
        // Commit Merge Time
        if (this.commitMergeTime !== null) {
            totalResponseTime += this.commitMergeTime;
            validDataCount++;
        }
        // Calculate the average response time based on valid data
        var averageResponseTime = validDataCount > 0 ? totalResponseTime / validDataCount : 0;
        return averageResponseTime;
    };
    return Responsiveness;
}(MetricParent_1.MetricParent));
exports.Responsiveness = Responsiveness;
