import requests
import json

url = "http://192.168.1.12:8000/rooms/"

payload = {
    "room_number": 1,
    "room_type": "single",
    "ac_non_ac": "NON_AC",
    "room_rent": 3000,
    "is_occupied": False,
    "is_active": True
}

headers = {
    "Content-Type": "application/json"
}

print("📤 Sending payload to backend:")
print(json.dumps(payload, indent=2))
print(f"\n🔗 URL: {url}\n")

try:
    response = requests.post(url, json=payload, headers=headers, timeout=5)
    print(f"Status: {response.status_code}")
    print(f"Response:\n{json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"❌ Error: {e}")
