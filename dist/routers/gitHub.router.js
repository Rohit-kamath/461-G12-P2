"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const gitHub_controller_1 = require("../controllers/gitHub.controller");
const router = (0, express_1.Router)();
// //console.log('router:', router);
router.get('/commits', gitHub_controller_1.getAllRepoCommits);
exports.default = router;
