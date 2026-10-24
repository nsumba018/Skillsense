#!/usr/bin/env python3
"""
SkillSense — RwandaJob.com Scraper
====================================
Scrapes job listings from rwandajob.com — Rwanda's second largest
job board with ~1,100+ open positions.

URL patterns:
  Search: /job-vacancies-search-rwanda?page=N
  Detail: /job-vacancies-rwanda/{slug}-{id}
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

BASE_URL = "https://www.rwandajob.com"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}
REQUEST_DELAY = 2.5
OUTPUT_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "raw", "rwandajob",
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


def parse_date(text):
    if not text:
        return None
    text = text.strip()
    # Try DD.MM.YYYY format (rwandajob's primary format)
    for fmt in ('%d.%m.%Y', '%Y-%m-%d', '%d/%m/%Y', '%B %d, %Y', '%d %B %Y'):
        try:
            return datetime.strptime(text, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    # Try relative dates
    text_lower = text.lower()
    now = datetime.now()
    m = re.search(r'(\d+)\s+day', text_lower)
    if m:
        return (now - timedelta(days=int(m.group(1)))).strftime("%Y-%m-%d")
    m = re.search(r'(\d+)\s+week', text_lower)
    if m:
        return (now - timedelta(weeks=int(m.group(1)))).strftime("%Y-%m-%d")
    m = re.search(r'(\d+)\s+month', text_lower)
    if m:
        return (now - timedelta(days=int(m.group(1)) * 30)).strftime("%Y-%m-%d")
    return None


def discover_job_urls():
    """Discover job URLs from the search results page and homepage."""
    all_urls = {}

    # Scrape the homepage for "Last Jobs" section
    print("[Discovery] Scraping homepage...")
    resp = safe_get(BASE_URL)
    if resp:
        soup = BeautifulSoup(resp.text, 'lxml')
        for a in soup.find_all('a', href=True):
            href = a['href']
            if '/job-vacancies-rwanda/' in href:
                full_url = urljoin(BASE_URL, href)
                if full_url not in all_urls:
                    all_urls[full_url] = clean_text(a.get_text()) or ''
        print(f"  Homepage: found {len(all_urls)} job links")

    # Paginated search pages
    print("[Discovery] Scanning search pages...")
    empty_streak = 0

    for page in range(0, 200):
        url = f"{BASE_URL}/job-vacancies-search-rwanda?page={page}"
        resp = safe_get(url)
        if not resp:
            empty_streak += 1
            if empty_streak >= 3:
                break
            continue

        soup = BeautifulSoup(resp.text, 'lxml')
        new = 0
        for a in soup.find_all('a', href=True):
            href = a['href']
            if '/job-vacancies-rwanda/' in href:
                full_url = urljoin(BASE_URL, href)
                if full_url not in all_urls:
                    all_urls[full_url] = clean_text(a.get_text()) or ''
                    new += 1

        if new == 0:
            empty_streak += 1
            print(f"  Page {page}: 0 new (streak: {empty_streak})")
            if empty_streak >= 3:
                print("  Stopping — 3 empty pages in a row")
                break
        else:
            empty_streak = 0
            print(f"  Page {page}: {new} new (total: {len(all_urls)})")

    print(f"\n[Discovery] Total unique job URLs: {len(all_urls)}")
    return all_urls


def scrape_job_detail(url):
    """Scrape a single RwandaJob detail page."""
    resp = safe_get(url)
    if not resp:
        return None

    soup = BeautifulSoup(resp.text, 'lxml')
    now = datetime.now().isoformat()
    raw_hash = hashlib.sha256(resp.text.encode('utf-8')).hexdigest()

    # Extract numeric ID from URL
    slug = url.rstrip('/').split('/')[-1]
    job_id_match = re.search(r'-(\d+)$', slug)
    source_id = job_id_match.group(1) if job_id_match else slug

    record = {
        'source': 'rwandajob',
        'source_url': url,
        'source_job_id': source_id,
        'scraped_at': now,
        'raw_hash': raw_hash,
        'country': 'Rwanda',
        'listing_type': 'job',
    }

    # Title — look for h1 or main heading
    h1 = soup.find('h1')
    if h1:
        record['title'] = clean_text(h1.get_text())
    elif soup.title:
        t = soup.title.get_text()
        # Remove site name suffix
        for suffix in ['| RwandaJob', '- RwandaJob', '| Rwanda Job']:
            t = t.replace(suffix, '')
        record['title'] = clean_text(t)

    if not record.get('title'):
        return None

    # Company — link to /recruiter/
    for a in soup.find_all('a', href=True):
        if '/recruiter/' in a['href']:
            text = clean_text(a.get_text())
            if text and len(text) > 1 and len(text) < 200:
                record['company'] = text
                break

    # Look for structured metadata
    for el in soup.find_all(['div', 'span', 'p', 'li', 'td', 'dd']):
        text = el.get_text()
        if len(text) > 500:
            continue
        text_lower = text.lower()

        # Location — "Region of: Kigali Province"
        if 'region' in text_lower or 'location' in text_lower:
            val = re.sub(r'(?i)(region\s+of\s*:?\s*|location\s*:?\s*)', '', text).strip()
            if val and 2 < len(val) < 100:
                record.setdefault('location_raw', clean_text(val))

        # Sector/Industry
        if any(w in text_lower for w in ['sector', 'industry', 'metier', 'function']):
            val = re.sub(r'(?i)(sector|industry|metier|function)\s*:?\s*', '', text).strip()
            if val and 2 < len(val) < 200:
                record.setdefault('industry_raw', clean_text(val))

        # Contract type
        if any(w in text_lower for w in ['cdi', 'cdd', 'full time', 'full-time', 'part time', 'contract', 'internship', 'stage']):
            record.setdefault('contract_type_raw', clean_text(text[:80]))

        # Experience
        if 'experience' in text_lower or 'years' in text_lower:
            val = re.sub(r'(?i)experience\s*:?\s*', '', text).strip()
            if val and len(val) < 100:
                record.setdefault('experience_raw', clean_text(val))

        # Education
        if any(w in text_lower for w in ['education', 'diploma', 'degree', 'bachelor', 'master']):
            val = re.sub(r'(?i)(education|qualification)\s*:?\s*', '', text).strip()
            if val and len(val) < 200:
                record.setdefault('education_raw', clean_text(val))

        # Date posted (DD.MM.YYYY format)
        date_match = re.search(r'(\d{2}\.\d{2}\.\d{4})', text)
        if date_match and 'posted_date' not in record:
            record['posted_date'] = parse_date(date_match.group(1))

    # Description / raw text
    content = soup.find('div', class_=re.compile(r'description|content|field-item|body', re.I))
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
    print("SkillSense — RwandaJob.com Scraper")
    print("=" * 60)
    print(f"Started: {datetime.now().isoformat()}")
    print(f"Output:  {OUTPUT_DIR}")

    # Phase 1: Discover
    url_map = discover_job_urls()

    if not url_map:
        print("No job URLs found!")
        return

    # Save discovered URLs
    url_file = os.path.join(OUTPUT_DIR, "discovered_urls.json")
    with open(url_file, 'w') as f:
        json.dump({
            'discovered_at': datetime.now().isoformat(),
            'count': len(url_map),
            'urls': [{'url': u, 'title_hint': t} for u, t in url_map.items()],
        }, f, indent=2)
    print(f"Saved {len(url_map)} URLs to {url_file}")

    # Phase 2: Scrape details
    print(f"\nPHASE 2: Scraping {len(url_map)} detail pages...")
    records = []
    errors = []
    items = list(url_map.items())

    for i, (url, _) in enumerate(items):
        slug = url.split('/')[-1][:45]
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
            print(f"\n  --- Checkpoint: {len(records)} records, {len(errors)} errors ---\n")

    # Phase 3: Save
    print(f"\nPHASE 3: Saving results...")
    if records:
        df = pd.DataFrame(records)
        csv_path = os.path.join(OUTPUT_DIR, "raw_rwandajob.csv")
        df.to_csv(csv_path, index=False, encoding='utf-8')
        print(f"Saved {len(records)} records to {csv_path}")

        json_path = os.path.join(OUTPUT_DIR, "raw_rwandajob.json")
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(records, f, indent=2, ensure_ascii=False, default=str)
        print(f"Saved JSON to {json_path}")

    if errors:
        err_path = os.path.join(OUTPUT_DIR, "scrape_errors.json")
        with open(err_path, 'w') as f:
            json.dump(errors, f, indent=2)

    print(f"\n{'=' * 60}")
    print("SUMMARY")
    print(f"{'=' * 60}")
    print(f"URLs discovered: {len(url_map)}")
    print(f"Records scraped: {len(records)}")
    print(f"Errors:          {len(errors)}")
    if records:
        companies = set(r.get('company') for r in records if r.get('company'))
        locs = set(r.get('location_raw') for r in records if r.get('location_raw'))
        print(f"Unique companies: {len(companies)}")
        print(f"Unique locations: {len(locs)}")
    print(f"\nFinished: {datetime.now().isoformat()}")


if __name__ == '__main__':
    main()
