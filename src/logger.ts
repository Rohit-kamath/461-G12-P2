import { createLogger, format, transports } from 'winston';
import dotenv from 'dotenv';

dotenv.config();

const LOG_LEVEL = process.env.LOG_LEVEL || '0';
const LOG_FILE = process.env.LOG_FILE;
const NODE_ENV = process.env.NODE_ENV || 'development';

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

const createModuleLogger = (moduleName: string) => {
    // Determine the appropriate transport based on the environment.
    const selectedTransports = [];

    if (NODE_ENV === 'test') {
        selectedTransports.push(
            new transports.Console({
                format: format.combine(
                    format.colorize(),
                    format.printf(({ timestamp, level, message }) => `${timestamp} ${level} [${moduleName}]: ${message}`),
                ),
            }),
        );
    } else {
        selectedTransports.push(new transports.File({ filename: LOG_FILE }));
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
