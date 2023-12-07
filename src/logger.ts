import { createLogger, format, transports } from 'winston';
import WinstonCloudWatch from 'winston-cloudwatch';
import dotenv from 'dotenv';

dotenv.config();

const LOG_LEVEL = process.env.LOG_LEVEL || '1';
const LOG_FILE = process.env.LOG_FILE || 'combined.log';
const ENVIRONMENT = process.env.NODE_ENV || 'on_ec2';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_REGION = process.env.REGION_AWS || 'us-east-2';

let winstonLogLevel: 'silent' | 'info' | 'debug';
switch (LOG_LEVEL) {
    case '0':
        winstonLogLevel = 'silent';
        break;
    case '1':
        winstonLogLevel = 'info';
        break;
    case '2':
        winstonLogLevel = 'debug';
        break;
    default:
        winstonLogLevel = 'silent';
}

// Local File Transport for logging to a file
const fileTransport = new transports.File({ filename: LOG_FILE, level: winstonLogLevel });

// CloudWatch Transport
const cloudWatchTransport = new WinstonCloudWatch({
    logGroupName: 'MyApp/Production',
    logStreamName: `instance-${process.pid}`,
    awsRegion: AWS_REGION || 'us-east-2',
    jsonMessage: true,
    level: winstonLogLevel,
    awsAccessKeyId: AWS_ACCESS_KEY_ID,
    awsSecretKey: AWS_SECRET_ACCESS_KEY,
});

const createModuleLogger = (moduleName: string) => {
    // Use both local file transport and CloudWatch transport
    const selectedTransports = [fileTransport, cloudWatchTransport];
    if(ENVIRONMENT === 'development') {
        selectedTransports.pop();
    }

    return createLogger({
        level: winstonLogLevel,
        format: format.combine(
            format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss',
            }),
            format.printf(({ timestamp, level, message }) => `${timestamp} ${level} [${moduleName}]: ${message}`),
        ),
        transports: selectedTransports,
    });
};

export default createModuleLogger;