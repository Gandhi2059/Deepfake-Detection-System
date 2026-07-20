import urllib.request
import os

url = "https://raw.githubusercontent.com/opencv/opencv/master/samples/data/lena.jpg"
urllib.request.urlretrieve(url, "lena.jpg")
print("Downloaded lena.jpg:", os.path.exists("lena.jpg"))
