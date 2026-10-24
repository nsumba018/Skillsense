#!/usr/bin/env python3
"""
SkillSense — BrighterMonday Rwanda Scraper
============================================
Scrapes job listings from brightermonday.co.rw (~560 jobs).

URL patterns:
  Search: /jobs?page=N (16 per page, ~35 pages)
  Detail: /listings/{slug}-{id}
"""

import requests
from bs4 import BeautifulSoup
import pandas as pd
import json
import time
import hashlib
import re
import os
import sys
from datetime import datetime, timedelta
from urllib.parse import urljoin

sys.stdout.reconfigure(line_buffering=True)

BASE_URL = "https://www.brightermonday.co.rw"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}
REQUEST_DELAY = 2.5
OUTPUT_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "raw", "brightermonday",
)
SESSION = requests.Session()
SESSION.headers.update(HEADERS)


def safe_get(url, retries=3):
    for attempt in range(retries):
        try:
            time.sleep(REQUEST_DELAY)
            resp = SESSION.get(url, timeout=30)
            if resp.status_code == 200:
                return resp
            elif resp.status_code == 429:
                wait = min(60, REQUEST_DELAY * (2 ** (attempt + 1)))
                print(f"  Rate limited. Waiting {wait}s...")
                time.sleep(wait)
            else:
                if attempt == retries - 1:
                    print(f"  HTTP {resp.status_code} for {url}")
                return None
        except requests.RequestException as e:
            if attempt == retries - 1:
                print(f"  Request error: {e}")
            time.sleep(3)
    return None


def clean_text(text):
    if not text:
        return None
    text = re.sub(r'\s+', ' ', text.strip())
    return text if text else None


def parse_relative_date(text):
    if not text:
        return None
    text = text.strip().lower()
    now = datetime.now()
    m = re.search(r'(\d+)\s+day', text)
    if m:
        return (now - timedelta(days=int(m.group(1)))).strftime("%Y-%m-%d")
    m = re.search(r'(\d+)\s+week', text)
    if m:
        return (now - timedelta(weeks=int(m.group(1)))).strftime("%Y-%m-%d")
    m = re.search(r'(\d+)\s+month', text)
    if m:
        return (now - timedelta(days=int(m.group(1)) * 30)).strftime("%Y-%m-%d")
    if 'today' in text:
        return now.strftime("%Y-%m-%d")
    for fmt in ('%Y-%m-%d', '%d/%m/%Y', '%B %d, %Y', '%d %B %Y'):
        try:
            return datetime.strptime(text, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return None


def discover_job_urls():
    """Discover job listing URLs from BrighterMonday search pages."""
    all_urls = {}
    empty_streak = 0

    for page in range(1, 50):
        url = f"{BASE_URL}/jobs?page={page}"
        resp = safe_get(url)
        if not resp:
            empty_streak += 1
            if empty_streak >= 3:
                break
            continue

        soup = BeautifulSoup(resp.text, 'lxml')
        new = 0

        # Job links are at /listings/{slug}-{id}
        for a in soup.find_all('a', href=True):
            href = a['href']
            if '/listings/' in href:
                full_url = urljoin(BASE_URL, href)
                if full_url not in all_urls:
                    title = clean_text(a.get_text())
                    if title and 3 < len(title) < 300:
                        all_urls[full_url] = title
                        new += 1

        if new == 0:
            empty_streak += 1
            print(f"  Page {page}: 0 new (streak: {empty_streak})")
            if empty_streak >= 3:
                break
        else:
            empty_streak = 0
            print(f"  Page {page}: {new} new (total: {len(all_urls)})")

    return all_urls


def scrape_job_detail(url):
    """Scrape a single BrighterMonday job detail page."""
    resp = safe_get(url)
    if not resp:
        return None

    soup = BeautifulSoup(resp.text, 'lxml')
    now = datetime.now().isoformat()
    raw_hash = hashlib.sha256(resp.text.encode('utf-8')).hexdigest()

    slug = url.rstrip('/').split('/')[-1]

    record = {
        'source': 'brightermonday',
        'source_url': url,
        'source_job_id': slug,
        'scraped_at': now,
        'raw_hash': raw_hash,
        'country': 'Rwanda',
        'listing_type': 'job',
    }

    # Title
    h1 = soup.find('h1')
    if h1:
        record['title'] = clean_text(h1.get_text())
    elif soup.title:
        t = soup.title.get_text()
        for suffix in ['| BrighterMonday', '- BrighterMonday', 'BrighterMonday']:
            t = t.replace(suffix, '')
        record['title'] = clean_text(t)

    if not record.get('title'):
        return None

    # Company
    for sel in [
        ('a', {'href': re.compile(r'/companies/')}),
        ('span', {'class': re.compile(r'company', re.I)}),
        ('a', {'class': re.compile(r'company', re.I)}),
    ]:
        el = soup.find(*sel)
        if el:
            text = clean_text(el.get_text())
            if text and len(text) > 1:
                record['company'] = text
                break

    # Parse metadata from all text elements
    for el in soup.find_all(['li', 'div', 'span', 'p', 'dd', 'td']):
        text = el.get_text()
        if len(text) > 400:
            continue
        text_lower = text.lower()

        # Location
        if any(w in text_lower for w in ['kigali', 'rwanda', 'province', 'remote']):
            if 'location' not in record:
                val = clean_text(text)
                if val and 2 < len(val) < 80:
                    record.setdefault('location_raw', val)

        # Category / Industry
        if any(w in text_lower for w in ['accounting', 'sales', 'marketing', 'engineering',
                'customer service', 'legal', 'health', 'it', 'education', 'supply chain',
                'human resources', 'communications', 'logistics']):
            if len(text) < 80:
                record.setdefault('industry_raw', clean_text(text))

        # Contract type
        if any(w in text_lower for w in ['full time', 'full-time', 'part time', 'contract',
                'temporary', 'freelance', 'internship']):
            if len(text) < 60:
                record.setdefault('contract_type_raw', clean_text(text))

        # Salary
        if 'frw' in text_lower or 'usd' in text_lower:
            if len(text) < 80:
                record.setdefault('salary_raw', clean_text(text))

        # Posted date
        if 'ago' in text_lower:
            record.setdefault('posted_date', parse_relative_date(text))

    # Description / full text
    content = soup.find('div', class_=re.compile(r'description|content|detail|body', re.I))
    if content:
        record['raw_text'] = clean_text(content.get_text())
    else:
        article = soup.find('article') or soup.find('main')
        if article:
            record['raw_text'] = clean_text(article.get_text())

    record['job_status'] = 'active'
    return record


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print("=" * 60)
    print("SkillSense — BrighterMonday Rwanda Scraper")
    print("=" * 60)
    print(f"Started: {datetime.now().isoformat()}")
    print(f"Output:  {OUTPUT_DIR}")

    # Phase 1: Discover
    print("\nPHASE 1: Discovering job URLs...")
    url_map = discover_job_urls()

    if not url_map:
        print("No job URLs found!")
        return

    with open(os.path.join(OUTPUT_DIR, "discovered_urls.json"), 'w') as f:
        json.dump({
            'discovered_at': datetime.now().isoformat(),
            'count': len(url_map),
            'urls': [{'url': u, 'title': t} for u, t in url_map.items()],
        }, f, indent=2)
    print(f"\nDiscovered {len(url_map)} unique listing URLs")

    # Phase 2: Scrape details
    print(f"\nPHASE 2: Scraping {len(url_map)} detail pages...")
    records = []
    errors = []
    items = list(url_map.items())

    for i, (url, _) in enumerate(items):
        slug = url.split('/')[-1][:40]
        print(f"  [{i+1}/{len(items)}] {slug}...", end=" ")
        try:
            record = scrape_job_detail(url)
            if record and record.get('title'):
                records.append(record)
                print(f"✓ {record['title'][:40]}")
            else:
                errors.append({'url': url, 'error': 'No data'})
                print("✗")
        except Exception as e:
            errors.append({'url': url, 'error': str(e)})
            print(f"✗ {str(e)[:40]}")

        if (i + 1) % 50 == 0:
            print(f"\n  --- Checkpoint: {len(records)} records ---\n")

    # Phase 3: Save
    if records:
        df = pd.DataFrame(records)
        csv_path = os.path.join(OUTPUT_DIR, "raw_brightermonday.csv")
        df.to_csv(csv_path, index=False, encoding='utf-8')
        print(f"\nSaved {len(records)} records to {csv_path}")

        json_path = os.path.join(OUTPUT_DIR, "raw_brightermonday.json")
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(records, f, indent=2, ensure_ascii=False, default=str)

    print(f"\n{'=' * 60}")
    print(f"SUMMARY: {len(records)} records, {len(errors)} errors")
    if records:
        companies = set(r.get('company') for r in records if r.get('company'))
        print(f"Unique companies: {len(companies)}")
    print(f"Finished: {datetime.now().isoformat()}")


if __name__ == '__main__':
    main()
