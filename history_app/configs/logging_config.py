# import logging
# import os
# import sys
# from loki_logger_handler.loki_logger_handler import LokiLoggerHandler as LokiHandler # We import the handler directly

# # --- Define Your Settings ---
# LOKI_URL = "http://localhost:3100/loki/api/v1/push"
# LOKI_TAGS = {
#     "application": "fastapi-app",
#     "environment": "development"
# }

# # Create an instance of the custom handler
# loki_handler = LokiHandler(
#     # url=os.environ["LOKI_URL"],
#     url=LOKI_URL,
#     labels={"application": "Test", "environment": "Develop"},
#     label_keys={},
#     timeout=10,
# )

# # --- 2. Create the Console (default) Handler ---
# # We still want to see logs in the console
# console_formatter = logging.Formatter(
#     fmt="%(levelname)-8s %(asctime)s - %(message)s",
#     # fmt="%(levelprefix)s %(asctime)s - %(message)s",
#     datefmt="%Y-%m-%d %H:%M:%S"
# )
# console_handler = logging.StreamHandler(sys.stderr)
# console_handler.setFormatter(console_formatter)


# def setup_logging():
#     """Call this function in your FastAPI main.py to apply the config."""
#     print("--- RUNNING NEW SETUP (Based on PyPI example) ---")
    
#     # --- 3. Get the loggers and add handlers ---
#     # We will configure the loggers you were using
    
#     logger_names = ["my_app", "uvicorn.access", "uvicorn.error"]
    
#     for name in logger_names:
#         logger = logging.getLogger(name)
#         logger.setLevel(logging.INFO)
        
#         # Add both the loki and console handlers
#         logger.addHandler(loki_handler)
#         logger.addHandler(console_handler)
        
#         # We set propagate to False to avoid duplicate logs
#         logger.propagate = False



import logging
import logging.handlers  # Import the handlers module
import os
import sys
from loki_logger_handler.loki_logger_handler import LokiLoggerHandler as LokiHandler # We import the handler directly
from config import settings


# SQLALCHEMY_DATABASE_URL = settings.SQLALCHEMY_DATABASE_URL or ""
# SQLALCHEMY_DATABASE_URL = 'mysql+pymysql://root:admin@localhost/test'
# SQLALCHEMY_DATABASE_URL = 'sqlite:///./todosapp.db'


# --- Define Your Settings ---
LOKI_URL = settings.LOKI_URL
# This path should be an absolute path on your Linux server
LOG_FILE_PATH = settings.LOG_FILE_PATH

# LOKI_TAGS = {
#     "application": "fastapi-app",
#     "environment": "development"
# }

# # --- 1. Create the Loki Handler ---
# loki_handler = LokiHandler(
#     url=LOKI_URL,
#     labels=LOKI_TAGS,
#     version="1"
# )

# Create an instance of the custom handler
loki_handler = LokiHandler(
    # url=os.environ["LOKI_URL"],
    url=LOKI_URL,
    labels={"application": "Test", "environment": "Develop"},
    label_keys={},
    timeout=10,
)

# --- 2. Create the Console (default) Handler ---
console_formatter = logging.Formatter(
    fmt="%(levelname)-8s %(asctime)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
console_handler = logging.StreamHandler(sys.stderr)
console_handler.setFormatter(console_formatter)

# --- 3. Create the File Handler (for logrotate) ---
# Ensure the directory exists.
# On Linux, you might need to handle permissions for /var/log separately.
os.makedirs(os.path.dirname(LOG_FILE_PATH), exist_ok=True) 

file_formatter = logging.Formatter(
    fmt="%(asctime)s - %(name)s - %(levelname)-8s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

# Use WatchedFileHandler. This handler detects when the file
# is moved by logrotate and re-opens the log.
file_handler = logging.handlers.WatchedFileHandler(
    filename=LOG_FILE_PATH
)
file_handler.setFormatter(file_formatter)


def setup_logging():
    """Call this function in your FastAPI main.py to apply the config."""
    print("--- RUNNING NEW SETUP (Loki + Console + WatchedFile) ---")
    
    # --- 4. Get the loggers and add handlers ---
    logger_names = ["station_history", "uvicorn.access", "uvicorn.error"]
    
    for name in logger_names:
        logger = logging.getLogger(name)
        logger.setLevel(logging.INFO)
        
        # Add all three handlers
        logger.addHandler(loki_handler)
        logger.addHandler(console_handler)
        logger.addHandler(file_handler)  # <-- ADDED THIS LINE
        
        # We set propagate to False to avoid duplicate logs
        logger.propagate = False