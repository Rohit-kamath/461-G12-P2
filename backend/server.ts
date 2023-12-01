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
app.use(express.json());

// Serve static files from the "Frontend" directory
app.use(express.static('Frontend/dist'));

const storage = multer.memoryStorage(); // Store the file in memory
const upload = multer({ storage: storage });

/*
app.get('/upload-page', (req, res) => {
    // This is just for testing purposes
    res.sendFile(path.join(__dirname, '../Frontend/testwebsite.html'));
});
*/

//package upload
app.post('/package', upload.single('packageContent'), async (req, res) => {
    try {
        logger.info('POST /package called');
        let shouldDebloat;
        if(req.body?.debloat === undefined) {
            shouldDebloat = false;
        }else{
            shouldDebloat = req.body.debloat === 'true' || false;
        }
        logger.info(`shouldDebloat: ${shouldDebloat}`)
        logger.info('Calling apiPackage uploadPackage');
        await apiPackage.uploadPackage(req, res, shouldDebloat);
    } catch (error) {
        logger.info(`Error in post(/package) server.ts: ${error}`);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/packages', async (req, res) => {
    try {
        await apiPackage.getPackages(req, res);
    } catch (error) {
        logger.info(`Error in post(/packages) in server.ts: ${error}`);
        res.status(500).send('Internal Server Error');
    }
});

app.delete('/reset', async (req, res) => {
    try {
        await apiPackage.callResetDatabase(req, res);
    } catch (error) {
        logger.info(`Error in delete(/reset) in server.ts: ${error}`);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/package/byName/:name', async (req, res) => {
    try {
        await apiPackage.getPackagesByName(req, res);
    } catch (error) {
        logger.info(`Error in get(/packages/byName/:name) in server.ts: ${error}`);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/package/byRegEx', async (req, res) => {
    try {
        await apiPackage.getPackagesByRegEx(req, res);
    } catch (error) {
        logger.info(`Error in post(/package/byRegEx) in server.ts: ${error}`);
        res.status(500).send('Internal Server Error');
    }
});

//GET package download
app.get('/package/:id', async (req, res) => {
    try {
        await apiPackage.getPackageDownload(req, res);
    } catch (error) {
        logger.info(`Error in get(/package/:id) in server.ts: ${error}`);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/package/:id/rate', async (req, res) => {
    logger.info('GET /package/:id/rate called');
    try {
        await apiPackage.getPackageRatings(req, res);
    } catch (error) {
        logger.info(`Error in get(/package/:id/rate) in server.ts: ${error}`);
        res.status(500).send('Internal Server Error');
    
    }
});

//PUT package update
app.put('/packages/:id', async (req, res) => {
    try {
        let shouldDebloat;
        if(req.body?.debloat === undefined) {
            shouldDebloat = false;
        }else{
            shouldDebloat = req.body.debloat === 'true' || false;
        }

        await apiPackage.updatePackage(req, res, shouldDebloat);
    } catch (error) {
        logger.info(`Error in put(/packages/:id) in server.ts: ${error}`);
        res.status(500).send('Internal Server Error');
    }
});

app.put('/authenticate', (req, res) => {
    res.status(501).json({
        error: {
            message: 'This system does not support authentication.',
        },
    });
});

app.use((req, res, next) => {
    if (req.method !== 'GET') {
        res.status(501).json({
            error: {
                message: 'Not Implemented',
            },
        });
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