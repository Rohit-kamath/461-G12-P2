import { createLogger, format, transports } from 'winston';
import WinstonCloudWatch from 'winston-cloudwatch';
import dotenv from 'dotenv';

dotenv.config();

const LOG_LEVEL = process.env.LOG_LEVEL || '1';
const LOG_FILE = process.env.LOG_FILE || 'combined.log';
const ENVIRONMENT = process.env.ON_EC2 || 'false';
const ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const REGION = process.env.REGION_AWS || 'us-east-2';

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
    awsRegion: REGION || 'us-east-2',
    jsonMessage: true,
    level: winstonLogLevel,
    awsAccessKeyId: ACCESS_KEY_ID,
    awsSecretKey: SECRET_ACCESS_KEY,
});

const createModuleLogger = (moduleName: string) => {
    // Use both local file transport and CloudWatch transport
    const selectedTransports : (transports.ConsoleTransportInstance | transports.FileTransportInstance | WinstonCloudWatch)[] = [fileTransport];
    if (ENVIRONMENT === 'true') {
        selectedTransports.push(cloudWatchTransport);
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