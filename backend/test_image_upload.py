import requests

url = 'http://localhost:8000/api/predict'
files = {'file': open('dummy.jpg', 'rb')}
data = {'user_id': 1}
response = requests.post(url, files=files, data=data)

print(response.status_code)
print(response.text)
