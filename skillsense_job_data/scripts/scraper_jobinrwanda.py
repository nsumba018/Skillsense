#!/usr/bin/env python3
"""
SkillSense — JobInRwanda Scraper (One-Time Baseline Collection)
================================================================
Collects publicly accessible job postings from jobinrwanda.com.
This is a ONE-TIME scraper for initial data collection.
Future data will be manually uploaded.
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
from datetime import datetime
from urllib.parse import urljoin, urlparse

sys.stdout.reconfigure(line_buffering=True)

# ── Configuration ──────────────────────────────────────────────────

BASE_URL = "https://www.jobinrwanda.com"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Connection": "keep-alive",
}
REQUEST_DELAY = 2.0
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "raw", "jobinrwanda")
SESSION = requests.Session()
SESSION.headers.update(HEADERS)


# ── Helpers ────────────────────────────────────────────────────────

def safe_get(url, retries=3):
    for attempt in range(retries):
        try:
            time.sleep(REQUEST_DELAY)
            SESSION.cookies.clear()
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


def parse_date(date_str):
    if not date_str:
        return None
    date_str = date_str.strip()
    formats = [
        "%B %d, %Y", "%b %d, %Y", "%Y-%m-%d",
        "%d/%m/%Y", "%d-%m-%Y", "%d %B %Y", "%d %b %Y",
    ]
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return date_str


# ── Phase 1: Discover all job URLs ────────────────────────────────

def discover_job_urls():
    """Discover actual job posting URLs (excluding tenders, consultancy, public adverts)."""
    all_urls = set()

    # Only scrape ACTUAL JOB POSTINGS — not tenders, consultancy, or public adverts
    sections = [
        "/jobs/all",          # Jobs tab (87 postings)
        "/jobs/internships",  # Internships tab (2 postings)
    ]

    for section in sections:
        print(f"[Discovery] Scanning {section}...")
        resp = safe_get(f"{BASE_URL}{section}")
        if not resp:
            continue
        soup = BeautifulSoup(resp.text, 'lxml')
        before = len(all_urls)
        for a in soup.find_all('a', href=True):
            href = a['href']
            if '/job/' in href and href != '/job/' and '/jobs/' not in href:
                full_url = urljoin(BASE_URL, href)
                if '/job/' in urlparse(full_url).path:
                    all_urls.add(full_url)
        print(f"  Found {len(all_urls) - before} new URLs (total: {len(all_urls)})")

    print(f"\n[Discovery] Total unique job URLs: {len(all_urls)}")
    return list(all_urls)


# ── Phase 2: Scrape individual job pages ──────────────────────────

def scrape_job_page(url):
    """Extract all fields from a single job posting page."""
    resp = safe_get(url)
    if not resp:
        return None

    soup = BeautifulSoup(resp.text, 'lxml')
    now = datetime.now().isoformat()
    raw_hash = hashlib.sha256(resp.text.encode('utf-8')).hexdigest()

    record = {
        'source': 'jobinrwanda',
        'source_url': url,
        'source_job_id': url.split('/job/')[-1] if '/job/' in url else None,
        'scraped_at': now,
        'raw_hash': raw_hash,
        'country': 'Rwanda',
    }

    # ── Title ──
    # Primary: <h3 class="title">
    h3_title = soup.find('h3', class_='title')
    if h3_title:
        record['title'] = clean_text(h3_title.get_text())
    elif soup.title:
        # Fallback: <title>JobTitle | Job in Rwanda</title>
        title_text = soup.title.get_text()
        record['title'] = title_text.replace('| Job in Rwanda', '').strip()
    else:
        record['title'] = None

    if not record['title']:
        return None

    # ── Company / Employer ──
    employer_link = soup.find('a', href=lambda h: h and '/employer/' in h)
    if employer_link and employer_link.get_text().strip():
        record['company'] = clean_text(employer_link.get_text())

    # ── Primary metadata: Bold-labeled fields ──
    # These are always from the main job detail section
    for b_tag in soup.find_all('b'):
        label = re.sub(r'\s+', ' ', b_tag.get_text()).strip().rstrip(':').strip()
        if not label or len(label) > 50:
            continue

        parent = b_tag.parent
        if not parent:
            continue

        # Value = parent text minus label text (normalize whitespace first)
        b_text = b_tag.get_text()
        parent_text = re.sub(r'\s+', ' ', parent.get_text())
        b_text_norm = re.sub(r'\s+', ' ', b_text)
        value = parent_text.replace(b_text_norm, '', 1).strip().strip(':').strip()
        value = clean_text(value)
        if not value:
            continue

        label_lower = label.lower()

        if label_lower == 'location':
            record['location_raw'] = value.replace(', RW', '').strip()
        elif label_lower in ('sector', 'industry', 'category'):
            record['industry_raw'] = value
        elif 'education' in label_lower:
            record['education_raw'] = value
        elif 'experience' in label_lower:
            record['experience_raw'] = value
        elif 'contract' in label_lower:
            record['contract_type_raw'] = value
        elif label_lower == 'deadline':
            # Parse deadline like "Sunday, 06/09/2026 23:59"
            dl_match = re.search(r'(\d{1,2}/\d{1,2}/\d{4})', value)
            if dl_match:
                record['closing_date'] = parse_date(dl_match.group(1))
        elif 'salary' in label_lower or 'compensation' in label_lower:
            record['salary_raw'] = value
        elif 'language' in label_lower:
            record['languages_raw'] = value
        elif 'position' in label_lower:
            record['num_positions'] = value

    # ── Secondary: Card-text metadata for dates/experience ──
    # Only use card-text for fields not already found via bold labels
    card_texts = soup.find_all('p', class_='card-text')
    for card in card_texts:
        card_text = card.get_text()
        if 'Published' not in card_text:
            continue

        # Published date
        if 'posted_date' not in record:
            pub_match = re.search(r'Published\s*(?:on\s*)?(\d{1,2}/\d{1,2}/\d{4})', card_text)
            if pub_match:
                record['posted_date'] = parse_date(pub_match.group(1))

        # Deadline
        if 'closing_date' not in record:
            dl_match = re.search(r'Deadline\s*(\d{1,2}/\d{1,2}/\d{4})', card_text)
            if dl_match:
                record['closing_date'] = parse_date(dl_match.group(1))

        # Location from card (if not from bold labels)
        if 'location_raw' not in record:
            parts = card_text.split('|')
            if parts:
                loc = parts[0].strip()
                if loc and len(loc) > 1 and 'Published' not in loc:
                    record['location_raw'] = clean_text(loc)

        # Experience
        if 'experience_raw' not in record:
            exp_match = re.search(r'(Entry level|Junior|Mid career|Senior|Executive|Not specified)(?:\s*\([^)]+\))?', card_text, re.I)
            if exp_match:
                record['experience_raw'] = clean_text(exp_match.group(0))

        break  # Only use first matching card

    # ── Full text / description ──
    content_div = soup.find('div', class_='node__content')
    if content_div:
        record['raw_text'] = clean_text(content_div.get_text())
    else:
        article = soup.find('article')
        if article:
            record['raw_text'] = clean_text(article.get_text())

    # ── Parse sections from raw text ──
    raw_text = record.get('raw_text', '') or ''
    sections_data = {
        'description': [],
        'responsibilities': [],
        'requirements': [],
        'qualifications': [],
        'skills_raw': [],
    }

    current_section = 'description'
    for line in raw_text.split('|'):
        line = line.strip()
        if not line or len(line) < 5:
            continue
        ll = line.lower()
        if any(w in ll for w in ['responsibilit', 'duties', 'key tasks', 'role purpose', 'what you will do']):
            current_section = 'responsibilities'
            continue
        elif any(w in ll for w in ['requirement', 'what we need', 'must have', 'what you bring']):
            current_section = 'requirements'
            continue
        elif any(w in ll for w in ['qualification', 'education', 'academic background']):
            current_section = 'qualifications'
            continue
        elif any(w in ll for w in ['skill', 'competenc', 'technical knowledge']):
            current_section = 'skills_raw'
            continue

        if current_section in sections_data:
            sections_data[current_section].append(line)

    for key, parts in sections_data.items():
        if parts:
            record[key] = ' | '.join(parts[:20])  # Limit to prevent huge fields

    # ── Job status ──
    if record.get('closing_date'):
        try:
            deadline = datetime.strptime(record['closing_date'], "%Y-%m-%d")
            record['job_status'] = 'expired' if deadline < datetime.now() else 'active'
        except (ValueError, TypeError):
            record['job_status'] = 'unknown'
    else:
        record['job_status'] = 'unknown'

    return record


# ── Main ──────────────────────────────────────────────────────────

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print("=" * 60)
    print("SkillSense — JobInRwanda Scraper (One-Time)")
    print("=" * 60)
    print(f"Started: {datetime.now().isoformat()}")
    print(f"Output: {OUTPUT_DIR}")

    # Phase 1: Discover
    print("\n" + "─" * 40)
    print("PHASE 1: Discovering job URLs")
    print("─" * 40)
    urls = discover_job_urls()

    # Save URLs
    url_file = os.path.join(OUTPUT_DIR, "discovered_urls.json")
    with open(url_file, 'w') as f:
        json.dump({'discovered_at': datetime.now().isoformat(), 'count': len(urls), 'urls': urls}, f, indent=2)
    print(f"Saved {len(urls)} URLs to {url_file}")

    # Phase 2: Scrape each
    print("\n" + "─" * 40)
    print("PHASE 2: Scraping individual job pages")
    print("─" * 40)

    records = []
    errors = []

    for i, url in enumerate(urls):
        slug = url.split('/job/')[-1][:50]
        print(f"  [{i+1}/{len(urls)}] {slug}...", end=" ")
        try:
            record = scrape_job_page(url)
            if record and record.get('title'):
                records.append(record)
                print(f"✓ {record['title'][:40]}")
            else:
                errors.append({'url': url, 'error': 'No title found'})
                print("✗ No title")
        except Exception as e:
            errors.append({'url': url, 'error': str(e)})
            print(f"✗ {str(e)[:40]}")

        # Progress checkpoint every 50 records
        if (i + 1) % 50 == 0:
            print(f"\n  --- Checkpoint: {len(records)} records scraped, {len(errors)} errors ---\n")

    # Phase 3: Save
    print("\n" + "─" * 40)
    print("PHASE 3: Saving results")
    print("─" * 40)

    if records:
        df = pd.DataFrame(records)
        csv_path = os.path.join(OUTPUT_DIR, "raw_jobinrwanda.csv")
        df.to_csv(csv_path, index=False, encoding='utf-8')
        print(f"Saved {len(df)} records to {csv_path}")

        json_path = os.path.join(OUTPUT_DIR, "raw_jobinrwanda.json")
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(records, f, indent=2, ensure_ascii=False, default=str)
        print(f"Saved JSON archive to {json_path}")

    if errors:
        err_path = os.path.join(OUTPUT_DIR, "scrape_errors.json")
        with open(err_path, 'w') as f:
            json.dump(errors, f, indent=2)
        print(f"Saved {len(errors)} errors to {err_path}")

    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"URLs discovered: {len(urls)}")
    print(f"Records scraped: {len(records)}")
    print(f"Errors: {len(errors)}")
    if records:
        dates = [r['posted_date'] for r in records if r.get('posted_date')]
        if dates:
            print(f"Earliest posted: {min(dates)}")
            print(f"Latest posted: {max(dates)}")
        companies = set(r['company'] for r in records if r.get('company'))
        print(f"Unique companies: {len(companies)}")
        titles_with_location = sum(1 for r in records if r.get('location_raw'))
        print(f"Records with location: {titles_with_location}")
        titles_with_industry = sum(1 for r in records if r.get('industry_raw'))
        print(f"Records with industry: {titles_with_industry}")
    print(f"Finished: {datetime.now().isoformat()}")


if __name__ == '__main__':
    main()
