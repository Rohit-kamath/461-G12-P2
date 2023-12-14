import express from 'express';
import multer from 'multer';
import * as apiPackage from './apiPackage';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import createModuleLogger from '../src/logger';

dotenv.config();

const port = process.env.PORT || 3000;

const app = express();
const logger = createModuleLogger('Server');

logger.info('Starting server...');
// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(express.json( { limit: '50mb' }));

// Serve static files from the "Frontend" directory
app.use(express.static('Frontend/dist'));

const storage = multer.memoryStorage(); // Store the file in memory
const upload = multer({
    storage: storage,
    limits: { 
        fileSize: 50 * 1024 * 1024, // 50 MB
        fieldSize: 50 * 1024 * 1024 // 50 MB
    }
});


/*
app.get('/upload-page', (req, res) => {
    // This is just for testing purposes
    res.sendFile(path.join(__dirname, '../Frontend/testwebsite.html'));
});
*/

app.post('/package', upload.single('packageContent'), async (req, res) => {
    try {
        logger.info(`POST /package request headers: ${JSON.stringify(req.headers)}`);
        const xAuthHeaderValue = req.headers['X-Authorization'];
        if(xAuthHeaderValue !== "0"){
            logger.info("400 Unauthorized, uploadPackage");
            return res.sendStatus(400);
        }
        logger.info(`POST /package request body: ${JSON.stringify(req.body)}`);
        logger.info(`POST /package request headers: ${JSON.stringify(req.headers)}`);
        await apiPackage.uploadPackage(req, res);
    } catch (error) {
        logger.info(`Error in post(/package) server.ts: ${error}`);
        res.sendStatus(500);
    }
});

app.post('/packages', async (req, res) => {
    try {
        logger.info(`POST /packages request headers: ${JSON.stringify(req.headers)}`);
        const xAuthHeaderValue = req.headers['X-Authorization'];
        if(xAuthHeaderValue !== "0"){
            logger.info("400 Unauthorized, uploadPackage");
            return res.sendStatus(400);
        }
        logger.info(`POST /packages request body: ${JSON.stringify(req.body)}`);
        logger.info(`POST /packages request query: ${JSON.stringify(req.query)}`);
        await apiPackage.getPackages(req, res);
    } catch (error) {
        logger.info(`Error in post(/packages) in server.ts: ${error}`);
        res.sendStatus(500);
    }
});

app.delete('/reset', async (req, res) => {
    try {
        logger.info(`DELETE /reset request headers: ${JSON.stringify(req.headers)}`);
        const xAuthHeaderValue = req.headers['X-Authorization'];
        if(xAuthHeaderValue !== "0"){
            logger.info("400 Unauthorized, uploadPackage");
            return res.sendStatus(400);
        }
        logger.info(`DELETE /reset request`);
        await apiPackage.callResetDatabase(req, res);
    } catch (error) {
        logger.info(`Error in delete(/reset) in server.ts: ${error}`);
        res.sendStatus(500);
    }
});

app.get('/package/byName/:name', async (req, res) => {
    try {
        logger.info(`GET /package/byName/:name headers: ${JSON.stringify(req.headers)}`);
        const xAuthHeaderValue = req.headers['X-Authorization'];
        if(xAuthHeaderValue !== "0"){
            logger.info("400 Unauthorized, uploadPackage");
            return res.sendStatus(400);
        }
        logger.info(`GET /package/byName/:name params: ${JSON.stringify(req.params)}`);
        await apiPackage.getPackagesByName(req, res);
    } catch (error) {
        logger.info(`Error in get(/packages/byName/:name) in server.ts: ${error}`);
        res.sendStatus(500);
    }
});

app.delete('/package/byID/:id', async (req, res) => {
    try {
        logger.info(`DELETE /package/byID/:id request headers: ${JSON.stringify(req.headers)}`);
        const xAuthHeaderValue = req.headers['X-Authorization'];
        if(xAuthHeaderValue !== "0"){
            logger.info("400 Unauthorized, uploadPackage");
            return res.sendStatus(400);
        }
        logger.info(`DELETE /package/byID/:id request params: ${JSON.stringify(req.params)}`);
        await apiPackage.deletePackageByID(req, res);
    } catch (error) {
        logger.info(`Error in delete(/package/byID/:id) in server.ts: ${error}`);
        res.sendStatus(500);
    }
});

app.delete('/package/byName/:name', async (req, res) => {
    try {
        logger.info(`DELETE /package/byName/:name request headers: ${JSON.stringify(req.headers)}`);
        const xAuthHeaderValue = req.headers['X-Authorization'];
        if(xAuthHeaderValue !== "0"){
            logger.info("400 Unauthorized, uploadPackage");
            return res.sendStatus(400);
        }
        logger.info(`DELETE /package/byName/:name request params: ${JSON.stringify(req.params)}`);
        await apiPackage.deletePackageByName(req, res);
    } catch (error) {
        logger.info(`Error in delete(/package/byName/:name) in server.ts: ${error}`);
        res.sendStatus(500);
    }
});

app.post('/package/byRegEx', async (req, res) => {
    try {
        logger.info(`POST /package/byRegEx request headers: ${JSON.stringify(req.headers)}`);
        const xAuthHeaderValue = req.headers['X-Authorization'];
        if(xAuthHeaderValue !== "0"){
            logger.info("400 Unauthorized, uploadPackage");
            return res.sendStatus(400);
        }
        logger.info(`POST /package/byRegEx request: ${JSON.stringify(req.body)}`);
        await apiPackage.getPackagesByRegEx(req, res);
    } catch (error) {
        logger.info(`Error in post(/package/byRegEx) in server.ts: ${error}`);
        res.sendStatus(500);
    }
});

app.get('/package/:id', async (req, res) => {
    try {
        logger.info(`GET /package/:id request headers: ${JSON.stringify(req.headers)}`);
        const xAuthHeaderValue = req.headers['X-Authorization'];
        if(xAuthHeaderValue !== "0"){
            logger.info("400 Unauthorized, uploadPackage");
            return res.sendStatus(400);
        }
        logger.info(`GET /package/:id request params: ${JSON.stringify(req.params)}`);
        await apiPackage.getPackageDownload(req, res);
    } catch (error) {
        logger.info(`Error in get(/package/:id) in server.ts: ${error}`);
        res.sendStatus(500);
    }
});

app.get('/package/:id/rate', async (req, res) => {
    try {
        logger.info(`GET /package/:id/rate request headers: ${JSON.stringify(req.headers)}`);
        const xAuthHeaderValue = req.headers['X-Authorization'];
        if(xAuthHeaderValue !== "0"){
            logger.info("400 Unauthorized, uploadPackage");
            return res.sendStatus(400);
        }
        logger.info(`GET /package/:id/rate request params: ${JSON.stringify(req.params)}`);
        await apiPackage.getPackageRatings(req, res);
    } catch (error) {
        logger.info(`Error in get(/package/:id/rate) in server.ts: ${error}`);
        res.sendStatus(500);
    }
});

app.put('/package/:id', async (req, res) => {
    try {
        logger.info(`PUT /package/:id request headers: ${JSON.stringify(req.headers)}`);
        const xAuthHeaderValue = req.headers['X-Authorization'];
        if(xAuthHeaderValue !== "0"){
            logger.info("400 Unauthorized, uploadPackage");
            return res.sendStatus(400);
        }
        const filteredBody = Object.fromEntries(Object.entries(req.body?.data || {}).filter(([key]) => key !== 'Content'));
        logger.info(`PUT /package/:id request body: ${JSON.stringify(filteredBody)}`);
        logger.info(`PUT /package/:id request params: ${JSON.stringify(req.params)} `);
        await apiPackage.updatePackage(req, res);
    } catch (error) {
        logger.info(`Error in put(/packages/:id) in server.ts: ${error}`);
        res.sendStatus(500);
    }
});

app.post('/transaction/initiate', async (req, res) => {
    try {
        logger.info(`POST /transaction/initiate request: ${JSON.stringify(req.body)}`);
        await apiPackage.initiateTransaction(req, res);
    } catch (error) {
        logger.info(`Error in post(/transaction/initiate) in server.ts: ${error}`);
        res.sendStatus(500);
    }
});

app.post('/transaction/append/upload', async (req, res) => {
    try {
        logger.info(`POST /transaction/append/upload request: ${JSON.stringify(req.body)}`);
        await apiPackage.appendToUploadTransaction(req, res);
    } catch (error) {
        logger.info(`Error in post(/transaction/append) in server.ts: ${error}`);
        res.sendStatus(500);
    }
});

app.post('/transaction/execute/upload', async (req, res) => {
    try {
        logger.info(`POST /transaction/execute/upload request: ${JSON.stringify(req.body)}`);
        await apiPackage.executeUploadTransaction(req, res);
    } catch (error) {
        logger.info(`Error in post(/transaction/execute) in server.ts: ${error}`);
        res.sendStatus(500);
    }
});

app.post('/transaction/append/rate', async (req, res) => {
    try {
        logger.info(`POST /transaction/append/rate request: ${JSON.stringify(req.body)}`);
        await apiPackage.appendToRateTransaction(req, res);
    } catch (error) {
        logger.info(`Error in post(/transaction/append/rate) in server.ts: ${error}`);
        res.sendStatus(500);
    }
});

app.post('/transaction/execute/rate', async (req, res) => {
    try {
        logger.info(`GET /transaction/execute/rate request: ${JSON.stringify(req.body)}`);
        await apiPackage.executeRateTransaction(req, res);
    } catch (error) {
        logger.info(`Error in get(/transaction/execute/rate) in server.ts: ${error}`);
        res.sendStatus(500);
    }
});

app.post('/transaction/append/update', async (req, res) => {
    try {
        logger.info(`POST /transaction/append/update request: ${JSON.stringify(req.body)}`);
        await apiPackage.appendToUpdateTransaction(req, res);
    } catch (error) {
        logger.info(`Error in post(/transaction/append/update) in server.ts: ${error}`);
        res.sendStatus(500);
    }
});

app.post('/transaction/execute/update', async (req, res) => {
    try {
        logger.info(`POST /transaction/execute/update request: ${JSON.stringify(req.body)}`);
        await apiPackage.executeUpdateTransaction(req, res);
        } catch (error) {
            logger.info(`Error in post(/transaction/execute/update) in server.ts: ${error}`);
            res.sendStatus(500);
        }
});

app.post('/transaction/append/download', async (req, res) => {
    try {
        logger.info(`POST /transaction/append/download request: ${JSON.stringify(req.body)}`);
        await apiPackage.appendToDownloadTransaction(req, res);
    } catch (error) {
        logger.info(`Error in post(/transaction/append/download) in server.ts: ${error}`);
        res.sendStatus(500);
    }
});

app.post('/transaction/execute/download', async (req, res) => {
    try {
        logger.info(`POST /transaction/execute/download request: ${JSON.stringify(req.body)}`);
        await apiPackage.executeDownloadTransaction(req, res);
    } catch (error) {
        logger.info(`Error in post(/transaction/execute/download) in server.ts: ${error}`);
        res.sendStatus(500);
    }
});

app.put('/authenticate', (req, res) => {
    res.sendStatus(501)
});

app.use((req, res, next) => {
    if (req.method !== 'GET') {
        res.sendStatus(501);
    } else {
        next();
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../Frontend/dist', 'index.html'));
});

app.listen(port, () => {
    console.log(`server started at http://localhost:${port}`);
    logger.info(`server started at http://localhost:${port}`);
});