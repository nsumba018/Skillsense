#!/usr/bin/env python3
"""
SkillSense — JobInRwanda All-Sector Scraper
============================================
Scrapes ALL job categories from jobinrwanda.com (jobs, tenders,
consultancy, internships, others) to build a multi-sector dataset.

Extends the original ICT-only scraper to cover all 9 SkillSense sectors.
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
OUTPUT_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "raw", "jobinrwanda",
)
SESSION = requests.Session()
SESSION.headers.update(HEADERS)

SECTIONS = [
    ("/jobs/all", "job"),
    ("/jobs/tender", "tender"),
    ("/jobs/consultancy", "consultancy"),
    ("/jobs/internships", "internship"),
    ("/jobs/others", "other"),
]


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


# ── Phase 1: Discover job URLs from ALL sections ─────────────────

def extract_job_urls(soup):
    urls = set()
    for a in soup.find_all('a', href=True):
        href = a['href']
        if '/job/' in href and href != '/job/' and '/jobs/' not in href:
            full_url = urljoin(BASE_URL, href)
            if '/job/' in urlparse(full_url).path:
                urls.add(full_url)
    return urls


def discover_all_urls():
    url_to_type = {}

    for section_path, listing_type in SECTIONS:
        print(f"[Discovery] Scanning {section_path} ({listing_type})...")
        resp = safe_get(f"{BASE_URL}{section_path}")
        if not resp:
            continue
        soup = BeautifulSoup(resp.text, 'lxml')
        found = extract_job_urls(soup)
        new = 0
        for url in found:
            if url not in url_to_type:
                url_to_type[url] = listing_type
                new += 1
        print(f"  Found {len(found)} URLs, {new} new (total: {len(url_to_type)})")

    # Also scan /jobs/featured as a catch-all to pick up anything missed
    print(f"[Discovery] Scanning /jobs/featured (catch-all)...")
    resp = safe_get(f"{BASE_URL}/jobs/featured")
    if resp:
        soup = BeautifulSoup(resp.text, 'lxml')
        found = extract_job_urls(soup)
        new = 0
        for url in found:
            if url not in url_to_type:
                url_to_type[url] = "unknown"
                new += 1
        print(f"  Found {len(found)} URLs, {new} new (total: {len(url_to_type)})")

    print(f"\n[Discovery] Total unique URLs: {len(url_to_type)}")
    type_counts = {}
    for t in url_to_type.values():
        type_counts[t] = type_counts.get(t, 0) + 1
    for t, c in sorted(type_counts.items()):
        print(f"  {t}: {c}")

    return url_to_type


# ── Phase 2: Scrape individual pages ─────────────────────────────

def scrape_job_page(url, listing_type):
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
        'listing_type': listing_type,
        'scraped_at': now,
        'raw_hash': raw_hash,
        'country': 'Rwanda',
    }

    # ── Title ──
    h3_title = soup.find('h3', class_='title')
    if h3_title:
        record['title'] = clean_text(h3_title.get_text())
    elif soup.title:
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
    for b_tag in soup.find_all('b'):
        label = re.sub(r'\s+', ' ', b_tag.get_text()).strip().rstrip(':').strip()
        if not label or len(label) > 50:
            continue

        parent = b_tag.parent
        if not parent:
            continue

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
    card_texts = soup.find_all('p', class_='card-text')
    for card in card_texts:
        card_text = card.get_text()
        if 'Published' not in card_text:
            continue

        if 'posted_date' not in record:
            pub_match = re.search(r'Published\s*(?:on\s*)?(\d{1,2}/\d{1,2}/\d{4})', card_text)
            if pub_match:
                record['posted_date'] = parse_date(pub_match.group(1))

        if 'closing_date' not in record:
            dl_match = re.search(r'Deadline\s*(\d{1,2}/\d{1,2}/\d{4})', card_text)
            if dl_match:
                record['closing_date'] = parse_date(dl_match.group(1))

        if 'location_raw' not in record:
            parts = card_text.split('|')
            if parts:
                loc = parts[0].strip()
                if loc and len(loc) > 1 and 'Published' not in loc:
                    record['location_raw'] = clean_text(loc)

        if 'experience_raw' not in record:
            exp_match = re.search(
                r'(Entry level|Junior|Mid career|Senior|Executive|Not specified)(?:\s*\([^)]+\))?',
                card_text, re.I,
            )
            if exp_match:
                record['experience_raw'] = clean_text(exp_match.group(0))

        break

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
            record[key] = ' | '.join(parts[:20])

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
    print("SkillSense — JobInRwanda All-Sector Scraper")
    print("=" * 60)
    print(f"Started: {datetime.now().isoformat()}")
    print(f"Output:  {OUTPUT_DIR}")

    # Phase 1: Discover
    print("\n" + "─" * 40)
    print("PHASE 1: Discovering ALL job URLs")
    print("─" * 40)
    url_to_type = discover_all_urls()

    url_file = os.path.join(OUTPUT_DIR, "discovered_urls_all_sectors.json")
    with open(url_file, 'w') as f:
        json.dump({
            'discovered_at': datetime.now().isoformat(),
            'count': len(url_to_type),
            'urls': [{'url': u, 'type': t} for u, t in url_to_type.items()],
        }, f, indent=2)
    print(f"Saved {len(url_to_type)} URLs to {url_file}")

    # Phase 2: Scrape each
    print("\n" + "─" * 40)
    print("PHASE 2: Scraping individual pages")
    print("─" * 40)

    records = []
    errors = []
    items = list(url_to_type.items())

    for i, (url, listing_type) in enumerate(items):
        slug = url.split('/job/')[-1][:50]
        print(f"  [{i+1}/{len(items)}] {slug}...", end=" ")
        try:
            record = scrape_job_page(url, listing_type)
            if record and record.get('title'):
                records.append(record)
                industry = record.get('industry_raw', '-')
                print(f"✓ [{listing_type}] {record['title'][:35]} | {industry}")
            else:
                errors.append({'url': url, 'error': 'No title found'})
                print("✗ No title")
        except Exception as e:
            errors.append({'url': url, 'error': str(e)})
            print(f"✗ {str(e)[:40]}")

        if (i + 1) % 50 == 0:
            print(f"\n  --- Checkpoint: {len(records)} records, {len(errors)} errors ---\n")

    # Phase 3: Save
    print("\n" + "─" * 40)
    print("PHASE 3: Saving results")
    print("─" * 40)

    if records:
        df = pd.DataFrame(records)
        csv_path = os.path.join(OUTPUT_DIR, "raw_jobinrwanda_all_sectors.csv")
        df.to_csv(csv_path, index=False, encoding='utf-8')
        print(f"Saved {len(df)} records to {csv_path}")

        json_path = os.path.join(OUTPUT_DIR, "raw_jobinrwanda_all_sectors.json")
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(records, f, indent=2, ensure_ascii=False, default=str)
        print(f"Saved JSON archive to {json_path}")

    if errors:
        err_path = os.path.join(OUTPUT_DIR, "scrape_errors_all_sectors.json")
        with open(err_path, 'w') as f:
            json.dump(errors, f, indent=2)
        print(f"Saved {len(errors)} errors to {err_path}")

    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"URLs discovered: {len(url_to_type)}")
    print(f"Records scraped: {len(records)}")
    print(f"Errors:          {len(errors)}")

    if records:
        # By listing type
        print("\nBy listing type:")
        type_counts = {}
        for r in records:
            t = r.get('listing_type', 'unknown')
            type_counts[t] = type_counts.get(t, 0) + 1
        for t, c in sorted(type_counts.items(), key=lambda x: -x[1]):
            print(f"  {t}: {c}")

        # By industry
        print("\nBy industry (raw):")
        industry_counts = {}
        for r in records:
            ind = r.get('industry_raw', 'Not specified')
            industry_counts[ind] = industry_counts.get(ind, 0) + 1
        for ind, c in sorted(industry_counts.items(), key=lambda x: -x[1]):
            print(f"  {ind}: {c}")

        # Date range
        dates = [r['posted_date'] for r in records if r.get('posted_date')]
        if dates:
            print(f"\nEarliest posted: {min(dates)}")
            print(f"Latest posted:   {max(dates)}")

        companies = set(r.get('company') for r in records if r.get('company'))
        print(f"Unique companies: {len(companies)}")
        print(f"Records with location:  {sum(1 for r in records if r.get('location_raw'))}")
        print(f"Records with industry:  {sum(1 for r in records if r.get('industry_raw'))}")

    print(f"\nFinished: {datetime.now().isoformat()}")


if __name__ == '__main__':
    main()
