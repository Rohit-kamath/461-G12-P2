import express from "express";
import multer from "multer";
import AWS, { S3 } from 'aws-sdk';
import * as apiPackage from "./apiPackage";
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';

dotenv.config();

const port = 3000;
const app = express();

// Enable CORS for all routes
app.use(cors());

// Serve static files from the "Frontend" directory
app.use(express.static('Frontend'));

// Set up AWS S3
const s3 = new AWS.S3({
    accessKeyId:  process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'us-east-2'
});

const storage = multer.memoryStorage(); // Store the file in memory
const upload = multer({ storage: storage });

app.get('/upload-page', (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/website.html'));
});

app.post('/upload', upload.single('packageContent'), (req, res, next) => {
    try {
        if (!req.file) {
            console.warn("No file provided in the upload.");
            return res.status(400).send('No file uploaded');
        }

        const bucketName = process.env.AWS_S3_BUCKET_NAME;

        if (!bucketName) {
            console.error("Error: S3 bucket name not configured.");
            return res.status(500).send("S3 bucket name not configured.");
        }

        const params = {
            Bucket: bucketName, 
            Key: req.file.originalname, // File name you want to save as in S3
            Body: req.file.buffer
        };

        // Uploading files to the bucket
        s3.upload(params, function(err: Error, data: S3.ManagedUpload.SendData) {
            if (err) {
                console.error("S3 upload error: ", err);
                return res.status(500).send("Error while uploading to S3.");
            }
            res.send(`File uploaded successfully to ${data.Location}`);
        });
    } catch (error) {
        next(error); // Forward the error to the error handler
    }
});

app.post('/packages', async (req, res) => {
    try {
        await apiPackage.getPackages(req, res);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
}); 

// Error handling middleware
app.use((err, res) => {
    console.error('Caught exception: ', err);
    res.status(500).send('Internal Server Error');
});

app.listen(port, () => {
    console.log(`server started at http://localhost:${port}`);
});

app.get('/package/download', async (req, res) => {
    try {
        await apiPackage.getPackageDownload(req, res);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});
