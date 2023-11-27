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

app.post('/package', upload.single('packageContent'), async (req, res) => {
    try {
        await apiPackage.uploadPackage(req, res);
        logger.info(`Package POST request successful`);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

app.post('/packages', async (req, res) => {
    try {
        await apiPackage.getPackages(req, res);
        logger.info(`Packages POST request successful`);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

app.delete('/reset', async (req, res) => {
    try {
        await apiPackage.callResetDatabase(req, res);
        logger.info(`Reset DELETE request successful`);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

app.get('/packages/byName/:name', async (req, res) => {
    try {
        await apiPackage.getPackagesByName(req, res);
        logger.info(`Packages by name GET request successful`);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

app.post('/package/byRegEx', async (req, res) => {
    try {
        await apiPackage.getPackagesByRegEx(req, res);
        logger.info(`Packages by RegEx POST request successful`);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

//GET package download
app.get('/package/:id', async (req, res) => {
    try {
        await apiPackage.getPackageDownload(req, res);
        logger.info(`Package download GET request successful`);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

//PUT package update
app.put('/packages/:id', async (req, res) => {
    try {
        await apiPackage.updatePackage(req, res);
        logger.info(`Package update PUT request successful`);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../Frontend/dist', 'index.html'));
});

app.listen(port, () => {
    console.log(`server started at http://localhost:${port}`);
    logger.info(`server started at http://localhost:${port}`);
});
