import os
import logging

# Constants for log levels
SILENT = "0"
INFO = "1"
DEBUG = "2"

# Read environment variables for log level and log file
LOG_LEVEL = os.getenv("LOG_LEVEL", SILENT)
LOG_FILE = os.getenv("LOG_FILE", "logfile.log")

# Configure logging based on verbosity level
log_format = '%(asctime)s - %(levelname)s - %(message)s'
logging.basicConfig(filename=LOG_FILE, format=log_format, level=logging.DEBUG)

def log_message(level, message):
    """Log a message at the given level."""
    if level == SILENT:
        return
    elif level == INFO:
        logging.info(message)
    elif level == DEBUG:
        logging.debug(message)
    else:
        logging.error(f"Invalid log level: {level}")

if __name__ == "__main__":
    import sys
    if len(sys.argv) != 3:
        print("Usage: log_file.py [LOG_LEVEL] [MESSAGE]")
        sys.exit(1)
    
    log_level = sys.argv[1]
    message = sys.argv[2]
    log_message(log_level, message)
