"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const gitHub_router_1 = __importDefault(require("./routers/gitHub.router"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8080;
app.use('/api/github', gitHub_router_1.default);
// //console.log('app:', app);
app.get('/', (req, res) => {
    res.send('Helloooo!!!');
});
app.listen(PORT, () => {
    //console.log(`Server started on http://localhost:${PORT}`);
});
