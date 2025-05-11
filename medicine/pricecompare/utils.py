import requests
from bs4 import BeautifulSoup

# Example: Scrape price from 1mg.com for a given medicine name
def scrape_1mg_price(medicine_name):
    search_url = f"https://www.1mg.com/search/all?name={medicine_name}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36"
    }
    resp = requests.get(search_url, headers=headers, timeout=10)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, 'html.parser')
    price_tag = soup.find('div', class_='style__price-tag___B2csA')
    if price_tag:
        price_text = price_tag.text.strip().replace('₹', '').replace(',', '')
        try:
            price = float(price_text)
        except ValueError:
            price = None
        return price
    return None

