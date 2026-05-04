# import json
# import re
# import os
# import requests
# from dotenv import load_dotenv  # New import
# import __main__
# from external_logger import register_global_exception_handler, setup_logger
# import logging
# import traceback


# setup_logger(name="auto_update_history",log_file="cron_auto_update_history.log")

# log = logging.getLogger("auto_update_history")
# # Load variables from .env
# load_dotenv(".env_update_slmon")

# def parse_slmon_file(file_path):
#     # This regex captures 12 specific groups from your data lines
#     pattern = re.compile(r'(\d+\.\d+\.\d+\.\d+)\s+(IA)\s+(\w+)\s+(\w+)\s+(\w+)\s+(\w+)\s+(-?\d+\.\d+)\s+(\d+\.\d+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)')
    
#     parsed_data = []

#     if not file_path or not os.path.exists(file_path):
#         print(f"Error: File path is invalid or file not found: '{file_path}'")
#         return []

#     with open(file_path, 'r') as f:
#         content = f.read()
#         matches = pattern.findall(content)

#         for m in matches:
#             entry = {
#                 "ip_address": m[0],
#                 "network": m[1],
#                 "station_code": m[2],
#                 "location_code": m[3],
#                 "channel_group": m[4],
#                 "channel_type": m[5],
#                 "latitude": float(m[6]),
#                 "longitude": float(m[7]),
#                 "stage": m[8],
#                 "datalogger": m[9],
#                 "sensor_bb": m[10],
#                 "sensor_acc": m[11]
#             }
#             parsed_data.append(entry)

#     return parsed_data

# # 1. Configuration from Environment
# # os.getenv('KEY') returns None if the key isn't found
# FILE_PATH = os.getenv('FILE_PATH')
# API_URL = os.getenv('API_URL')

# log.info(__main__.__file__)
# # 2. Execution
# if not FILE_PATH or not API_URL:
#     print("Error: FILE_PATH or API_URL missing from .env file.")
# else:
#     data = parse_slmon_file(FILE_PATH)

#     if data:
#         print(f"Successfully parsed {len(data)} stations. Sending to API...")
        
#         try:
#             # 3. Send PUT request
#             response = requests.put(API_URL, json=data)
            
#             # 4. Handle Response
#             if response.status_code == 200:
#                 print("Successfully processed by API.")
#                 print("Server Response:", json.dumps(response.json(), indent=4))
#             else:
#                 print(f"API Error ({response.status_code}): {response.text}")
                
#         except requests.exceptions.ConnectionError:
#             print(f"Error: Could not connect to the API at {API_URL}. Is it running?")

# log.info("finish runing this script")
# log.info(__main__.__file__)








import json
import re
import os
import argparse
import requests
import logging
from dotenv import load_dotenv
import __main__
from external_logger import register_global_exception_handler, setup_logger

# 1. Setup Logger (Module Level)
setup_logger(name="auto_update_history", log_file="cron_auto_update_history.log")
log = logging.getLogger("auto_update_history")

# 2. Define Constants
SLMON_REGEX = re.compile(
    r'(\d+\.\d+\.\d+\.\d+)\s+(IA)\s+(\w+)\s+(\w+)\s+(\w+)\s+(\w+)\s+'
    r'(-?\d+\.\d+)\s+(\d+\.\d+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)'
)

SLMON_KEYS = [
    "ip_address", "network", "station_code", "location_code",
    "channel_group", "channel_type", "latitude", "longitude",
    "stage", "datalogger", "sensor_bb", "sensor_acc"
]

def parse_slmon_file(file_path: str) -> list[dict]:
    """Reads and parses the SLMON file into a list of dictionaries."""
    if not file_path or not os.path.exists(file_path):
        log.error(f"Invalid or missing file path: '{file_path}'")
        return []

    parsed_data = []
    try:
        with open(file_path, 'r') as f:
            matches = SLMON_REGEX.findall(f.read())

            for m in matches:
                # Zip the keys and regex match tuple into a dictionary automatically
                entry = dict(zip(SLMON_KEYS, m))
                # Cast coordinates to float
                entry["latitude"] = float(entry["latitude"])
                entry["longitude"] = float(entry["longitude"])
                parsed_data.append(entry)
                
    except IOError as e:
        log.error(f"Failed to read file '{file_path}': {e}")

    return parsed_data

def send_to_api(api_url: str, data: list[dict]) -> None:
    """Sends the parsed data to the target API endpoint."""
    if not data:
        log.warning("No data to send. Skipping API request.")
        return

    log.info(f"Successfully parsed {len(data)} stations. Sending to API...")
    
    try:
        response = requests.put(api_url, json=data)
        response.raise_for_status()  # Automatically raises an exception for 4xx or 5xx status codes
        
        log.info("Successfully processed by API.")
        log.info(f"Server Response: {json.dumps(response.json(), indent=4)}")
            
    except requests.exceptions.RequestException as e:
        log.error(f"API Request failed: {e}")

def main():
    """Main execution flow."""
    parser = argparse.ArgumentParser(description="Parse SLMON file and send to API.")
    parser.add_argument(
        '--config', 
        type=str, 
        default='.env_update_slmon',
        help='Path to the .env configuration file (e.g., --config=envg.env)'
    )
    args = parser.parse_args()

    log.info(f"--- Starting script: {__main__.__file__} ---")
    log.info(f"Loading configuration from: {args.config}")
    
    # Load environment variables
    load_dotenv(args.config)
    file_path = os.getenv('FILE_PATH')
    api_url = os.getenv('API_URL')

    # Guard clause to ensure env vars exist
    if not file_path or not api_url:
        log.error("FILE_PATH or API_URL missing from .env file.")
        return

    # Execute core logic
    data = parse_slmon_file(file_path)
    send_to_api(api_url, data)

    log.info(f"--- Finished running script: {__main__.__file__} ---")

if __name__ == "__main__":
    main()