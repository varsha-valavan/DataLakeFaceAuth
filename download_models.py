import urllib.request

print("Downloading MobileFaceNet...")

urllib.request.urlretrieve(
    "https://github.com/sirius-ai/MobileFaceNet_TF/raw/master/out/MobileFaceNet.pb",
    "MobileFaceNet.pb"
)

print("Downloaded MobileFaceNet.pb")