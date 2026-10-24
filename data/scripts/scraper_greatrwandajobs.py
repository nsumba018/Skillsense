#!/usr/bin/env python3
"""
SkillSense — GreatRwandaJobs Scraper
======================================
Scrapes job listings from greatrwandajobs.com.
Lists 20 jobs per page with a "Show More" / pagination pattern.
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

BASE_URL = "https://www.greatrwandajobs.com"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}
REQUEST_DELAY = 2.5
OUTPUT_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "raw", "greatrwandajobs",
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


def scrape_listing_page(page_num):
    """Scrape one page of job search results."""
    url = f"{BASE_URL}/jobs?page={page_num}"
    resp = safe_get(url)
    if not resp:
        return []

    soup = BeautifulSoup(resp.text, 'lxml')
    jobs = []
    seen = set()

    for a in soup.find_all('a', href=True):
        href = a['href']
        if '/jobs/job-detail/' in href:
            full_url = urljoin(BASE_URL, href)
            if full_url not in seen:
                seen.add(full_url)
                title = clean_text(a.get_text())
                if title and 3 < len(title) < 300:
                    jobs.append({'url': full_url, 'title_from_list': title})

    return jobs


def scrape_job_detail(url):
    """Scrape a single job detail page."""
    resp = safe_get(url)
    if not resp:
        return None

    soup = BeautifulSoup(resp.text, 'lxml')
    now = datetime.now().isoformat()
    raw_hash = hashlib.sha256(resp.text.encode('utf-8')).hexdigest()

    record = {
        'source': 'greatrwandajobs',
        'source_url': url,
        'source_job_id': url.rstrip('/').split('/')[-1],
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
        record['title'] = clean_text(soup.title.get_text().split('|')[0].split('-')[0])

    if not record.get('title'):
        return None

    # Company name
    for sel in [
        ('a', {'href': re.compile(r'/companies/')}),
        ('span', {'class': re.compile(r'company', re.I)}),
        ('div', {'class': re.compile(r'company', re.I)}),
    ]:
        el = soup.find(*sel)
        if el:
            record['company'] = clean_text(el.get_text())
            break

    # Metadata from page elements
    for el in soup.find_all(['li', 'div', 'span', 'p', 'dd', 'td']):
        text = el.get_text()
        if len(text) > 300:
            continue
        text_lower = text.lower()

        if any(w in text_lower for w in ['location', 'kigali', 'province']):
            val = re.sub(r'(?i)(location|place|city)\s*:?\s*', '', text).strip()
            if val and 2 < len(val) < 80:
                record.setdefault('location_raw', clean_text(val))

        if any(w in text_lower for w in ['industry', 'sector', 'category', 'function']):
            val = re.sub(r'(?i)(industry|sector|category|function|job\s+function)\s*:?\s*', '', text).strip()
            if val and 2 < len(val) < 150:
                record.setdefault('industry_raw', clean_text(val))

        if any(w in text_lower for w in ['full time', 'full-time', 'part time', 'contract', 'internship']):
            record.setdefault('contract_type_raw', clean_text(text[:60]))

        if 'experience' in text_lower:
            val = re.sub(r'(?i)experience\s*:?\s*', '', text).strip()
            if val and len(val) < 100:
                record.setdefault('experience_raw', clean_text(val))

        if any(w in text_lower for w in ['education', 'qualification', 'degree']):
            val = re.sub(r'(?i)(education|qualification|degree)\s*:?\s*', '', text).strip()
            if val and len(val) < 200:
                record.setdefault('education_raw', clean_text(val))

        if 'deadline' in text_lower or 'closing' in text_lower:
            date_match = re.search(r'(\d{1,2}[./]\d{1,2}[./]\d{4})', text)
            if date_match:
                record.setdefault('closing_date', parse_relative_date(date_match.group(1)))
            else:
                date_match = re.search(r'(\w+ \d{1,2},? \d{4})', text)
                if date_match:
                    record.setdefault('closing_date', parse_relative_date(date_match.group(1)))

        if 'ago' in text_lower or 'posted' in text_lower:
            record.setdefault('posted_date', parse_relative_date(text))

    # Description
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
    print("SkillSense — GreatRwandaJobs Scraper")
    print("=" * 60)
    print(f"Started: {datetime.now().isoformat()}")

    # Phase 1: Discover job URLs
    print("\nPHASE 1: Discovering job URLs...")
    all_links = []
    seen_urls = set()
    empty_streak = 0

    for page in range(1, 30):
        print(f"  Page {page}...", end=" ")
        listings = scrape_listing_page(page)
        new = 0
        for item in listings:
            if item['url'] not in seen_urls:
                seen_urls.add(item['url'])
                all_links.append(item)
                new += 1
        if new == 0:
            empty_streak += 1
            print(f"0 new (streak: {empty_streak})")
            if empty_streak >= 3:
                break
        else:
            empty_streak = 0
            print(f"{new} new (total: {len(all_links)})")
        if len(all_links) >= 500:
            print("  Reached 500 job limit")
            break

    print(f"\nDiscovered {len(all_links)} unique job URLs")

    with open(os.path.join(OUTPUT_DIR, "discovered_urls.json"), 'w') as f:
        json.dump({'count': len(all_links), 'urls': all_links}, f, indent=2)

    # Phase 2: Scrape details (limit to first 300 to be respectful)
    to_scrape = all_links[:300]
    print(f"\nPHASE 2: Scraping {len(to_scrape)} detail pages...")
    records = []
    errors = []

    for i, item in enumerate(to_scrape):
        slug = item['url'].split('/')[-1][:40]
        print(f"  [{i+1}/{len(to_scrape)}] {slug}...", end=" ")
        try:
            record = scrape_job_detail(item['url'])
            if record and record.get('title'):
                records.append(record)
                print(f"✓ {record['title'][:40]}")
            else:
                errors.append({'url': item['url'], 'error': 'No data'})
                print("✗")
        except Exception as e:
            errors.append({'url': item['url'], 'error': str(e)})
            print(f"✗ {str(e)[:40]}")

        if (i + 1) % 50 == 0:
            print(f"\n  --- Checkpoint: {len(records)} records ---\n")

    # Phase 3: Save
    if records:
        df = pd.DataFrame(records)
        csv_path = os.path.join(OUTPUT_DIR, "raw_greatrwandajobs.csv")
        df.to_csv(csv_path, index=False, encoding='utf-8')
        print(f"\nSaved {len(records)} records to {csv_path}")

        json_path = os.path.join(OUTPUT_DIR, "raw_greatrwandajobs.json")
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(records, f, indent=2, ensure_ascii=False, default=str)

    print(f"\n{'=' * 60}")
    print(f"SUMMARY: {len(records)} records, {len(errors)} errors")
    print(f"Finished: {datetime.now().isoformat()}")


if __name__ == '__main__':
    main()
