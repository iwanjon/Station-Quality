import logging
import json
from datetime import datetime
import sys

# --- Custom JSON Formatter for file logs ---
class JsonFormatter(logging.Formatter):
    def format(self, record):
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "filename": record.filename,
            "line": record.lineno,
            "function": record.funcName,
        }
        return json.dumps(log_data)

# --- Function to configure logger (called once) ---
def setup_logger(name="app", log_file="app.log", level=logging.INFO):
    logger = logging.getLogger(name)
    logger.setLevel(level)

    # Prevent duplicate handlers if already configured
    if logger.handlers:
        return logger

    # File handler (JSON logs)
    file_handler = logging.FileHandler(log_file)
    file_handler.setLevel(level)
    file_handler.setFormatter(JsonFormatter())

    # Console handler (normal logs)
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.DEBUG)
    console_formatter = logging.Formatter(
        "%(asctime)s - %(levelname)s - %(name)s - %(message)s"
    )
    console_handler.setFormatter(console_formatter)

    # Add both handlers
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)

    return logger


def handle_uncaught_exception(exc_type, exc_value, exc_tb, logger: logging.Logger):
    """
    Handle uncaught exceptions globally and log them.

    :param exc_type: Exception type.
    :param exc_value: Exception value.
    :param exc_tb: Traceback object.
    :param logger: Logger instance to log the uncaught exception.
    """
    logger.critical("Unhandled exception", exc_info=(exc_type, exc_value, exc_tb))
    
    
# Register global exception handler (make sure logger is passed)
def register_global_exception_handler(logger: logging.Logger):
    sys.excepthook = lambda exc_type, exc_value, exc_tb: handle_uncaught_exception(exc_type, exc_value, exc_tb, logger)