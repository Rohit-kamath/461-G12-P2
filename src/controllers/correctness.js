"use strict";
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
exports.correctness = void 0;
var child_process_1 = require("child_process");
/* import {config} from "dotenv"; */
var RampUpAPI_1 = require("../utils/RampUpAPI");
var correctness = /** @class */ (function () {
    function correctness(owner, repo) {
        this.owner = owner;
        this.repo = repo;
        //private octokit: Octokit;
        this.errors = 0;
        this.warnings = 0;
        this.securityIssues = 0;
        // Initialize the Octokit client with an authentication token if needed
        /*  config();
         const token = process.env.GITHUB_TOKEN;
         this.octokit = new Octokit({
             auth: token,
         }); */
    }
    correctness.prototype.check = function () {
        return __awaiter(this, void 0, void 0, function () {
            var stars, forks, stars_count, forks_count, power, githubScore, eslintScore, finalScore;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, RampUpAPI_1.fetchRepositoryStars)(this.owner, this.repo)];
                    case 1:
                        stars = _a.sent();
                        return [4 /*yield*/, (0, RampUpAPI_1.fetchRepositoryForks)(this.owner, this.repo)];
                    case 2:
                        forks = _a.sent();
                        stars_count = stars.length;
                        forks_count = forks.length;
                        power = this.calculateLowestPowerOf10(stars_count, forks_count);
                        githubScore = (stars_count + forks_count) / power;
                        return [4 /*yield*/, this.LinterandTestChecker()];
                    case 3:
                        eslintScore = _a.sent();
                        finalScore = (0.2 * githubScore) + (0.8 * eslintScore);
                        if (finalScore > 1) {
                            return [2 /*return*/, 1];
                        }
                        return [2 /*return*/, finalScore];
                }
            });
        });
    };
    correctness.prototype.calculateLowestPowerOf10 = function (num1, num2) {
        var sum = num1 + num2;
        var power = 1;
        while (power < sum) {
            power *= 10;
        }
        return power;
    };
    correctness.prototype.hasTestInName = function (path) {
        var fs = require('fs');
        var stats = fs.statSync(path);
        if (stats.isDirectory()) {
            if (path.includes('test')) {
                return true;
            }
            var files = fs.readdirSync(path);
            for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
                var file = files_1[_i];
                if (this.hasTestInName("".concat(path, "/").concat(file))) {
                    return true;
                }
            }
        }
        else if (stats.isFile()) {
            if (path.includes('test')) {
                return true;
            }
        }
        return false;
    };
    correctness.prototype.lintFiles = function (dir, linter) {
        var _this = this;
        var fileRegex = /\.(ts|js)$/;
        var fs = require('fs');
        var path = require('path');
        var files = fs.readdirSync(dir);
        var numFiles = 0;
        for (var _i = 0, files_2 = files; _i < files_2.length; _i++) {
            var file = files_2[_i];
            var filePath = path.join(dir, file);
            var stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                this.lintFiles(filePath, linter);
            }
            else if (fileRegex.test(file)) {
                linter.lintFiles([filePath]).then(function (results) {
                    for (var _i = 0, results_1 = results; _i < results_1.length; _i++) {
                        var result = results_1[_i];
                        for (var _a = 0, _b = result.messages; _a < _b.length; _a++) {
                            var message = _b[_a];
                            ////////console.log(`Message: ${message.severity}, ${message.ruleId}`);
                            numFiles = numFiles + 1;
                            if (message.severity === 2) {
                                _this.errors = _this.errors + 1;
                            }
                            else if (message.severity === 1) {
                                _this.warnings = _this.warnings + 1;
                            }
                            if (message.ruleId === "no-eval" || message.ruleId === "no-implied-eval") {
                                _this.securityIssues = _this.securityIssues + 1;
                            }
                        }
                    }
                });
            }
        }
        //////console.log(`Errors: ${this.errors}, Warnings: ${this.warnings}, Security Issues: ${this.securityIssues}, NumFiles: ${numFiles}`);
    };
    correctness.prototype.LinterandTestChecker = function () {
        return __awaiter(this, void 0, void 0, function () {
            var tempdir, githuburl, hasTest, test_suite_checker, eslintScore;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tempdir = "./temp/".concat(this.owner, "/").concat(this.repo);
                        githuburl = "https://github.com/".concat(this.owner, "/").concat(this.repo, ".git");
                        (0, child_process_1.execSync)("mkdir -p ".concat(tempdir));
                        (0, child_process_1.execSync)("cd ".concat(tempdir));
                        (0, child_process_1.execSync)("git clone ".concat(githuburl, " ").concat(tempdir), { stdio: 'ignore' });
                        (0, child_process_1.execSync)("ls ".concat(tempdir));
                        hasTest = this.hasTestInName(tempdir);
                        test_suite_checker = 0;
                        if (hasTest) {
                            test_suite_checker = 1;
                        }
                        ////////console.log(`Has test suite: ${test_suite_checker}`)        
                        /*  const linter = new ESLint();
                         this.lintFiles(tempdir, linter); */
                        ////////console.log(`Errors: ${this.errors}, Warnings: ${this.warnings}, Security Issues: ${this.securityIssues}`);
                        /* const results = linter.lintFiles(
                            files.filter((file) => /\.(js|ts)$/.test(file))
                        );
                        let errors = 0;
                        let warnings = 0;
                        let securityIssues = 0;
                        for (const result of results) {
                            for (const message of result.messages) {
                                if (message.severity === 2) {
                                    errors = errors + 1;
                                } else if (message.severity === 1) {
                                    warnings = warnings + 1;
                                }
                                if (message.ruleId === "no-eval" || message.ruleId === "no-implied-eval") {
                                    securityIssues = securityIssues + 1;
                                }
                            }
                        } */
                        return [4 /*yield*/, (0, child_process_1.exec)("rm -rf ".concat(tempdir))];
                    case 1:
                        ////////console.log(`Has test suite: ${test_suite_checker}`)        
                        /*  const linter = new ESLint();
                         this.lintFiles(tempdir, linter); */
                        ////////console.log(`Errors: ${this.errors}, Warnings: ${this.warnings}, Security Issues: ${this.securityIssues}`);
                        /* const results = linter.lintFiles(
                            files.filter((file) => /\.(js|ts)$/.test(file))
                        );
                        let errors = 0;
                        let warnings = 0;
                        let securityIssues = 0;
                        for (const result of results) {
                            for (const message of result.messages) {
                                if (message.severity === 2) {
                                    errors = errors + 1;
                                } else if (message.severity === 1) {
                                    warnings = warnings + 1;
                                }
                                if (message.ruleId === "no-eval" || message.ruleId === "no-implied-eval") {
                                    securityIssues = securityIssues + 1;
                                }
                            }
                        } */
                        _a.sent();
                        eslintScore = (test_suite_checker);
                        return [2 /*return*/, eslintScore];
                }
            });
        });
    };
    return correctness;
}());
exports.correctness = correctness;
