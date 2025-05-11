from django.core.management.base import BaseCommand
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup
import requests
import time
from pricecompare.models import Platform, Medicine, PriceEntry

class Command(BaseCommand):
    help = 'Scrapes medicine prices from different platforms'

    def add_arguments(self, parser):
        parser.add_argument('medicine_name', type=str, help='Name of the medicine to search for')

    def handle(self, *args, **options):
        medicine_name = options['medicine_name']
        
        # Get or create medicine
        medicine, _ = Medicine.objects.get_or_create(name=medicine_name)
        
        # Get platforms
        platforms = Platform.objects.all()
        
        for platform in platforms:
            try:
                if platform.name.lower() == '1mg':
                    self.scrape_1mg(medicine, platform)
                elif platform.name.lower() == 'netmeds':
                    self.scrape_netmeds(medicine, platform)
                elif platform.name.lower() == 'pharmeasy':
                    self.scrape_pharmeasy(medicine, platform)
                elif platform.name.lower() == 'apollo pharmacy':
                    self.scrape_apollo(medicine, platform)
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error scraping {platform.name}: {str(e)}'))

    def scrape_1mg(self, medicine, platform):
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        
        driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
        
        try:
            search_url = f"{platform.url}/search?w={medicine.name}"
            driver.get(search_url)
            
            # Wait for price element to load
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[class*='price']"))
            )
            
            # Get the first product's price
            price_element = driver.find_element(By.CSS_SELECTOR, "[class*='price']")
            price_text = price_element.text.replace('₹', '').strip()
            price = float(price_text)
            
            # Update or create price entry
            PriceEntry.objects.update_or_create(
                medicine=medicine,
                platform=platform,
                defaults={'price': price}
            )
            
            self.stdout.write(self.style.SUCCESS(f'Successfully scraped price from 1mg: {price}'))
            
            # Check for medicine name
            medicine_element = driver.find_element(By.CSS_SELECTOR, 'h3[class*="ProductTitle"]')
            if medicine_element:
                medicine_name = medicine_element.text.strip()
                # Proceed with price scraping
            else:
                self.stdout.write(self.style.WARNING(f'Medicine name not found on 1mg for {medicine.name}'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error scraping 1mg: {str(e)}'))
        finally:
            driver.quit()

    def scrape_netmeds(self, medicine, platform):
        search_url = f"{platform.url}/search?q={medicine.name}"
        response = requests.get(search_url)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find price element (adjust selector based on actual website structure)
        price_element = soup.select_one("[class*='price']")
        if price_element:
            price_text = price_element.text.replace('₹', '').strip()
            price = float(price_text)
            
            # Update or create price entry
            PriceEntry.objects.update_or_create(
                medicine=medicine,
                platform=platform,
                defaults={'price': price}
            )
            
            self.stdout.write(self.style.SUCCESS(f'Successfully scraped price from Netmeds: {price}')) 

    def scrape_pharmeasy(self, medicine, platform):
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        
        driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
        
        try:
            search_url = f"{platform.url}/search?q={medicine.name}"
            driver.get(search_url)
            
            # Wait for price element to load
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[class*='price']"))
            )
            
            # Get the first product's price
            price_element = driver.find_element(By.CSS_SELECTOR, "[class*='price']")
            price_text = price_element.text.replace('₹', '').strip()
            price = float(price_text)
            
            # Update or create price entry
            PriceEntry.objects.update_or_create(
                medicine=medicine,
                platform=platform,
                defaults={'price': price}
            )
            
            self.stdout.write(self.style.SUCCESS(f'Successfully scraped price from PharmEasy: {price}'))
            
            # Check for medicine name
            medicine_element = driver.find_element(By.CSS_SELECTOR, 'h1[class*="ProductTitle"]')
            if medicine_element:
                medicine_name = medicine_element.text.strip()
                # Proceed with price scraping
            else:
                self.stdout.write(self.style.WARNING(f'Medicine name not found on PharmEasy for {medicine.name}'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error scraping PharmEasy: {str(e)}'))
        finally:
            driver.quit()

    def scrape_apollo(self, medicine, platform):
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        
        driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
        
        try:
            search_url = f"{platform.url}/search?q={medicine.name}"
            driver.get(search_url)
            
            # Wait for price element to load
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[class*='price']"))
            )
            
            # Get the first product's price
            price_element = driver.find_element(By.CSS_SELECTOR, "[class*='price']")
            price_text = price_element.text.replace('₹', '').strip()
            price = float(price_text)
            
            # Update or create price entry
            PriceEntry.objects.update_or_create(
                medicine=medicine,
                platform=platform,
                defaults={'price': price}
            )
            
            self.stdout.write(self.style.SUCCESS(f'Successfully scraped price from Apollo Pharmacy: {price}'))
            
            # Check for medicine name
            medicine_element = driver.find_element(By.CSS_SELECTOR, 'h1[class*="ProductTitle"]')
            if medicine_element:
                medicine_name = medicine_element.text.strip()
                # Proceed with price scraping
            else:
                self.stdout.write(self.style.WARNING(f'Medicine name not found on Apollo Pharmacy for {medicine.name}'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error scraping Apollo Pharmacy: {str(e)}'))
        finally:
            driver.quit() 