import json
import re
import os
import requests
from dotenv import load_dotenv  # New import

# Load variables from .env
load_dotenv(".env_update_slmon")

def parse_slmon_file(file_path):
    # This regex captures 12 specific groups from your data lines
    pattern = re.compile(r'(\d+\.\d+\.\d+\.\d+)\s+(IA)\s+(\w+)\s+(\w+)\s+(\w+)\s+(\w+)\s+(-?\d+\.\d+)\s+(\d+\.\d+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)')
    
    parsed_data = []

    if not file_path or not os.path.exists(file_path):
        print(f"Error: File path is invalid or file not found: '{file_path}'")
        return []

    with open(file_path, 'r') as f:
        content = f.read()
        matches = pattern.findall(content)

        for m in matches:
            entry = {
                "ip_address": m[0],
                "network": m[1],
                "station_code": m[2],
                "location_code": m[3],
                "channel_group": m[4],
                "channel_type": m[5],
                "latitude": float(m[6]),
                "longitude": float(m[7]),
                "stage": m[8],
                "datalogger": m[9],
                "sensor_bb": m[10],
                "sensor_acc": m[11]
            }
            parsed_data.append(entry)

    return parsed_data

# 1. Configuration from Environment
# os.getenv('KEY') returns None if the key isn't found
FILE_PATH = os.getenv('FILE_PATH')
API_URL = os.getenv('API_URL')

# 2. Execution
if not FILE_PATH or not API_URL:
    print("Error: FILE_PATH or API_URL missing from .env file.")
else:
    data = parse_slmon_file(FILE_PATH)

    if data:
        print(f"Successfully parsed {len(data)} stations. Sending to API...")
        
        try:
            # 3. Send PUT request
            response = requests.put(API_URL, json=data)
            
            # 4. Handle Response
            if response.status_code == 200:
                print("Successfully processed by API.")
                print("Server Response:", json.dumps(response.json(), indent=4))
            else:
                print(f"API Error ({response.status_code}): {response.text}")
                
        except requests.exceptions.ConnectionError:
            print(f"Error: Could not connect to the API at {API_URL}. Is it running?")