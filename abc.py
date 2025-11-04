import requests

res= requests.get("http://202.90.198.40/sismon-slmon2/data/slmon.all.laststatus.json")

print(res)
print(res.json()["features"])
print(res.json().keys())
print(len(res.json()["features"]))