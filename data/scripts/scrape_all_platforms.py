#!/usr/bin/env python3
"""
SkillSense — Multi-Platform Job Scraper Orchestrator
=====================================================
Runs all platform scrapers, merges results, classifies sectors,
and produces a unified dataset ready for database import.

Usage:
    python data/scripts/scrape_all_platforms.py [--skip-scrape] [--platform NAME]

Options:
    --skip-scrape   Skip scraping, just merge + classify existing raw files
    --platform NAME Only run the named scraper (jobinrwanda, rwandajob,
                    brightermonday, greatrwandajobs)
"""

import os
import sys
import json
import argparse
import subprocess
from datetime import datetime

import pandas as pd

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.dirname(SCRIPT_DIR)
RAW_DIR = os.path.join(DATA_DIR, "raw")
OUTPUT_DIR = os.path.join(DATA_DIR, "classified")

# Import the sector classifier
sys.path.insert(0, SCRIPT_DIR)
from classify_sectors import classify_record, SECTOR_NAMES

SCRAPERS = {
    "jobinrwanda": {
        "script": os.path.join(SCRIPT_DIR, "scraper_jobinrwanda_all_sectors.py"),
        "output_csv": os.path.join(RAW_DIR, "jobinrwanda", "raw_jobinrwanda_all_sectors.csv"),
        "output_json": os.path.join(RAW_DIR, "jobinrwanda", "raw_jobinrwanda_all_sectors.json"),
    },
    "rwandajob": {
        "script": os.path.join(SCRIPT_DIR, "scraper_rwandajob.py"),
        "output_csv": os.path.join(RAW_DIR, "rwandajob", "raw_rwandajob.csv"),
        "output_json": os.path.join(RAW_DIR, "rwandajob", "raw_rwandajob.json"),
    },
    "brightermonday": {
        "script": os.path.join(SCRIPT_DIR, "scraper_brightermonday.py"),
        "output_csv": os.path.join(RAW_DIR, "brightermonday", "raw_brightermonday.csv"),
        "output_json": os.path.join(RAW_DIR, "brightermonday", "raw_brightermonday.json"),
    },
    "greatrwandajobs": {
        "script": os.path.join(SCRIPT_DIR, "scraper_greatrwandajobs.py"),
        "output_csv": os.path.join(RAW_DIR, "greatrwandajobs", "raw_greatrwandajobs.csv"),
        "output_json": os.path.join(RAW_DIR, "greatrwandajobs", "raw_greatrwandajobs.json"),
    },
}

COMMON_COLUMNS = [
    "source", "source_url", "source_job_id", "scraped_at", "country",
    "title", "company", "location_raw", "industry_raw", "education_raw",
    "experience_raw", "contract_type_raw", "closing_date", "posted_date",
    "raw_text", "job_status", "listing_type", "salary_raw",
]


def run_scraper(name, info):
    """Run a single scraper script."""
    print(f"\n{'─' * 50}")
    print(f"Running {name} scraper...")
    print(f"{'─' * 50}")

    venv_python = os.path.join(DATA_DIR, "..", ".venv", "bin", "python")
    if not os.path.exists(venv_python):
        venv_python = sys.executable

    try:
        result = subprocess.run(
            [venv_python, info["script"]],
            capture_output=False,
            timeout=1800,  # 30 min max per scraper
        )
        if result.returncode != 0:
            print(f"WARNING: {name} scraper exited with code {result.returncode}")
    except subprocess.TimeoutExpired:
        print(f"WARNING: {name} scraper timed out after 30 minutes")
    except Exception as e:
        print(f"ERROR running {name}: {e}")


def load_raw_data():
    """Load all raw scraped data from CSV/JSON files."""
    frames = []

    for name, info in SCRAPERS.items():
        csv_path = info["output_csv"]
        json_path = info["output_json"]

        if os.path.exists(csv_path):
            try:
                df = pd.read_csv(csv_path, dtype=str)
                print(f"  {name}: {len(df)} records from CSV")
                frames.append(df)
                continue
            except Exception as e:
                print(f"  {name}: CSV error ({e}), trying JSON...")

        if os.path.exists(json_path):
            try:
                with open(json_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                df = pd.DataFrame(data)
                print(f"  {name}: {len(df)} records from JSON")
                frames.append(df)
            except Exception as e:
                print(f"  {name}: JSON error ({e})")
        else:
            print(f"  {name}: No data files found")

    # Also load any legacy combined raw data
    legacy_csv = os.path.join(RAW_DIR, "combined_raw_all_sources.csv")
    if os.path.exists(legacy_csv):
        try:
            df = pd.read_csv(legacy_csv, dtype=str)
            # Only include rows that have a source and title
            df = df.dropna(subset=["title"])
            df = df[df["source"].notna() & (df["source"] != "")]
            print(f"  legacy (combined_raw): {len(df)} records")
            frames.append(df)
        except Exception as e:
            print(f"  legacy: error ({e})")

    if not frames:
        print("No data found from any platform!")
        return pd.DataFrame()

    merged = pd.concat(frames, ignore_index=True, sort=False)

    # Normalize columns
    for col in COMMON_COLUMNS:
        if col not in merged.columns:
            merged[col] = None

    return merged


def deduplicate(df):
    """Remove duplicate postings across platforms."""
    before = len(df)

    # Normalize title + company for dedup
    df["_title_norm"] = df["title"].str.lower().str.strip()
    df["_company_norm"] = df["company"].fillna("").str.lower().str.strip()

    # Prefer records with more metadata
    df["_richness"] = (
        df["industry_raw"].notna().astype(int) +
        df["education_raw"].notna().astype(int) +
        df["experience_raw"].notna().astype(int) +
        df["raw_text"].notna().astype(int) +
        df["location_raw"].notna().astype(int) +
        df["closing_date"].notna().astype(int)
    )
    df = df.sort_values("_richness", ascending=False)
    df = df.drop_duplicates(subset=["_title_norm", "_company_norm"], keep="first")
    df = df.drop(columns=["_title_norm", "_company_norm", "_richness"])

    print(f"  Deduplication: {before} → {len(df)} records ({before - len(df)} duplicates removed)")
    return df


def classify_all(df):
    """Apply sector classification to all records."""
    results = []
    for _, row in df.iterrows():
        sector_slug, confidence, method = classify_record(row.to_dict())
        results.append({
            "sector_slug": sector_slug,
            "sector_name": SECTOR_NAMES[sector_slug],
            "classification_confidence": confidence,
            "classification_method": method,
        })

    result_df = pd.DataFrame(results)
    classified = pd.concat([df.reset_index(drop=True), result_df], axis=1)
    return classified


def main():
    parser = argparse.ArgumentParser(description="SkillSense multi-platform scraper")
    parser.add_argument("--skip-scrape", action="store_true", help="Skip scraping, just merge + classify")
    parser.add_argument("--platform", type=str, help="Only run this platform's scraper")
    args = parser.parse_args()

    print("=" * 60)
    print("SkillSense — Multi-Platform Job Data Pipeline")
    print("=" * 60)
    print(f"Started: {datetime.now().isoformat()}")

    # Step 1: Run scrapers
    if not args.skip_scrape:
        print("\n" + "=" * 60)
        print("STEP 1: Running scrapers")
        print("=" * 60)

        if args.platform:
            if args.platform in SCRAPERS:
                run_scraper(args.platform, SCRAPERS[args.platform])
            else:
                print(f"Unknown platform: {args.platform}")
                print(f"Available: {', '.join(SCRAPERS.keys())}")
                return
        else:
            for name, info in SCRAPERS.items():
                run_scraper(name, info)
    else:
        print("\nSkipping scrape step, using existing raw data...")

    # Step 2: Load and merge
    print("\n" + "=" * 60)
    print("STEP 2: Loading and merging raw data")
    print("=" * 60)

    df = load_raw_data()
    if df.empty:
        print("No data to process!")
        return

    print(f"\nTotal raw records: {len(df)}")
    print("\nBy source:")
    for src, count in df["source"].value_counts().items():
        print(f"  {src}: {count}")

    # Step 3: Deduplicate
    print("\n" + "=" * 60)
    print("STEP 3: Deduplication")
    print("=" * 60)

    df = deduplicate(df)

    # Step 4: Filter — keep only actual jobs (not tenders/other)
    if "listing_type" in df.columns:
        jobs_only = df[df["listing_type"].isin(["job", "internship", "unknown", None, ""])]
        tenders = df[~df["listing_type"].isin(["job", "internship", "unknown", None, ""])]
        print(f"\n  Filtered: {len(df)} → {len(jobs_only)} jobs ({len(tenders)} tenders/consultancy excluded)")
        df = jobs_only

    # Step 5: Classify sectors
    print("\n" + "=" * 60)
    print("STEP 4: Sector classification")
    print("=" * 60)

    classified = classify_all(df)

    # Step 6: Save
    print("\n" + "=" * 60)
    print("STEP 5: Saving classified data")
    print("=" * 60)

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    csv_path = os.path.join(OUTPUT_DIR, "classified_all_sectors.csv")
    classified.to_csv(csv_path, index=False, encoding="utf-8")
    print(f"Saved CSV: {csv_path} ({len(classified)} records)")

    json_path = os.path.join(OUTPUT_DIR, "classified_all_sectors.json")
    classified.to_json(json_path, orient="records", indent=2, force_ascii=False)
    print(f"Saved JSON: {json_path}")

    # Summary
    print("\n" + "=" * 60)
    print("FINAL SUMMARY")
    print("=" * 60)
    print(f"Total classified records: {len(classified)}")

    print("\nBy source:")
    for src, count in classified["source"].value_counts().items():
        print(f"  {src}: {count}")

    print("\nBy sector:")
    for sector, count in classified["sector_name"].value_counts().items():
        pct = count / len(classified) * 100
        print(f"  {sector}: {count} ({pct:.1f}%)")

    print(f"\nBy classification method:")
    for method, count in classified["classification_method"].value_counts().items():
        print(f"  {method}: {count}")

    companies = classified["company"].dropna().nunique()
    locations = classified["location_raw"].dropna().nunique()
    print(f"\nUnique companies: {companies}")
    print(f"Unique locations: {locations}")

    print(f"\nFinished: {datetime.now().isoformat()}")
    print(f"\nNext step: python manage.py load_scraped_jobs")


if __name__ == "__main__":
    main()
