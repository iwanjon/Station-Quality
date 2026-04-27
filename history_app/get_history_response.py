import requests
import pandas as pd

# 1. Fetch the data from your API
url = "http://localhost:5000/api/history/public"
response = requests.get(url)
api_response = response.json()

# 2. Extract just the "data" list
data_list = api_response["data"]

# 3. Flatten the JSON into a DataFrame
df = pd.json_normalize(data_list)

# 4. Save to CSV
df.to_csv('station_history.csv', index=False)

print("Data successfully saved to station_history.csv!")