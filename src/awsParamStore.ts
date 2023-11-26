import AWS from 'aws-sdk';
import dotenv from 'dotenv';

dotenv.config();

// Initialize the AWS Systems Manager (SSM)
// Define the type for the configuration
interface SSMConfig {
    region: string;
    credentials?: {
        accessKeyId: string;
        secretAccessKey: string;
    };
}

const ssmConfig: SSMConfig = {
    region: 'us-east-2'
};

// Use bootstrap credentials only in a local environment
if (process.env.BOOTSTRAP_AWS_ACCESS_KEY_ID && process.env.BOOTSTRAP_AWS_SECRET_ACCESS_KEY) {
    ssmConfig.credentials = {
        accessKeyId: process.env.BOOTSTRAP_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.BOOTSTRAP_AWS_SECRET_ACCESS_KEY
    };
}

AWS.config.update(ssmConfig);
const ssm = new AWS.SSM();
export const loadConfig = async () => {
    try {
    // Define the parameters you want to load
        const paramNames = [
            'ACCESS_KEY_ID_AWS',
            'SECRET_ACCESS_KEY_AWS',
            'GITHUB_TOKEN',
            'LOG_LEVEL',
            'LOG_FILE',
            'S3_BUCKET_NAME',
            'DATABASE_URL'
        ];

    // Fetch and set each parameter
    for (const paramName of paramNames) {
        const data = await ssm.getParameter({
            Name: paramName,
            WithDecryption: true
        }).promise();

        if (data.Parameter && data.Parameter.Value) {
            process.env[paramName] = data.Parameter.Value;
            //console.log(`${paramName}: ${process.env[paramName]}`);
        } 
        else {
            console.log(`Parameter ${paramName} not found`);
            throw new Error(`Parameter ${paramName} not found`);
        }
    }
    } catch (error) {
        // logger.error('Error loading config:', error);
        console.error('Error loading config:', error);
        throw error;
    }
};
