import requests
import csv
import json
from datetime import datetime

def fetch_api_data(api_url, headers=None):
    """Fetch data from API"""
    try:
        response = requests.get(api_url, headers=headers)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error fetching data: {e}")
        return None

def save_to_csv(data, filename=None):
    """Save data to CSV file"""
    if not data:
        print("No data to save")
        return
    
    # Generate filename if not provided
    if not filename:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"daily_summary_{timestamp}.csv"
    
    # Handle list of dictionaries
    if isinstance(data, list) and len(data) > 0 and isinstance(data[0], dict):
        fieldnames = data[0].keys()
        
        with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(data)
            
        print(f"Data saved to {filename}")
        print(f"Rows: {len(data)}, Columns: {len(fieldnames)}")
    
    # Handle single dictionary
    elif isinstance(data, dict):
        with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=data.keys())
            writer.writeheader()
            writer.writerow(data)
            
        print(f"Data saved to {filename}")
    
    else:
        print("Unsupported data format")

def main():
    # API configuration
    api_url = "http://103.169.3.72:2107/api/qc/data/summary/2025-08-24"
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer DEBUG-BYPASS-TOKEN-2107"
    }
    
    # Fetch and save data
    print("Fetching data from API...")
    data = fetch_api_data(api_url, headers)
    
    if data:
        print("Saving to CSV...")
        save_to_csv(data, "daily_summary.csv")
    else:
        print("Failed to fetch data")

if __name__ == "__main__":
    main()