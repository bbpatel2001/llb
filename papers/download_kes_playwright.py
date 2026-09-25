import os
import re
import requests
from bs4 import BeautifulSoup

URL = "https://keslawlibrary.wixsite.com/keslawcollegelibrary/copy-of-question-papers-1"

OUT_DIR = "KES_LLB_Papers"

HEADERS = {
    "User-Agent": "Mozilla/5.0"
}

os.makedirs(OUT_DIR, exist_ok=True)

print("Downloading page...")

html = requests.get(URL, headers=HEADERS, timeout=60).text

soup = BeautifulSoup(html, "html.parser")

links = soup.find_all("a", href=True)

print(f"Found {len(links)} links")

downloaded = set()

count = 0

for a in links:

    href = a["href"]

    if "drive.google.com/file/d/" not in href:
        continue

    m = re.search(r"/d/([^/]+)", href)

    if not m:
        continue

    file_id = m.group(1)

    # Skip duplicate Google Drive IDs only
    if file_id in downloaded:
        continue

    downloaded.add(file_id)

    year = a.get_text(strip=True)

    if not year:
        year = "Paper"

    year = re.sub(r'[\\/:*?"<>|]', "_", year)

    filename = f"{count+1:03d}_{year}_{file_id}.pdf"

    filepath = os.path.join(OUT_DIR, filename)

    download_url = f"https://drive.google.com/uc?export=download&id={file_id}"

    print(f"[{count+1}] Downloading {filename}")

    try:

        r = requests.get(
            download_url,
            headers=HEADERS,
            stream=True,
            timeout=120
        )

        r.raise_for_status()

        with open(filepath, "wb") as f:
            for chunk in r.iter_content(8192):
                if chunk:
                    f.write(chunk)

        count += 1

    except Exception as ex:
        print("FAILED:", ex)

print()
print("===================================")
print("Downloaded:", count)
print("===================================")