#!/usr/bin/env python3
"""
SkillSense — Merge All Job Postings
=====================================
Combines all scraped data sources into one deduplicated dataset,
then runs sector classification on the combined set.
"""

import pandas as pd
import os
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.dirname(SCRIPT_DIR)

# Import the classifier
sys.path.insert(0, SCRIPT_DIR)
from classify_sectors import classify_record, SECTOR_NAMES


def load_and_normalize(path, source_label=None, listing_type_default="job"):
    """Load a CSV and normalize columns to a common schema."""
    df = pd.read_csv(path)

    # Ensure common columns exist
    if 'listing_type' not in df.columns:
        df['listing_type'] = listing_type_default
    if 'source' not in df.columns and source_label:
        df['source'] = source_label

    return df


def main():
    print("=" * 60)
    print("SkillSense — Merge All Job Postings")
    print("=" * 60)

    # Source 1: New all-sector scrape (Oct 20, 2026)
    new_scrape = load_and_normalize(
        os.path.join(DATA_DIR, "raw", "jobinrwanda", "raw_jobinrwanda_all_sectors.csv")
    )
    print(f"Source 1 (new all-sector scrape):       {len(new_scrape)} records")

    # Source 2: Original ICT scrape (Oct 9, 2026)
    old_scrape = load_and_normalize(
        os.path.join(DATA_DIR, "raw", "jobinrwanda", "raw_jobinrwanda.csv"),
        listing_type_default="job",
    )
    print(f"Source 2 (original Oct 9 scrape):       {len(old_scrape)} records")

    # Source 3: Cleaned postings v2 (has rwandajob.com data too)
    cleaned_v2 = load_and_normalize(
        os.path.join(DATA_DIR, "all_postings", "cleaned_job_postings_v2.csv"),
        listing_type_default="job",
    )
    print(f"Source 3 (cleaned_job_postings_v2):      {len(cleaned_v2)} records")

    # Common columns across all sources
    common_cols = [
        'source', 'source_url', 'source_job_id', 'scraped_at', 'country',
        'title', 'company', 'location_raw', 'industry_raw', 'education_raw',
        'experience_raw', 'contract_type_raw', 'closing_date', 'posted_date',
        'raw_text', 'job_status', 'listing_type',
    ]

    def safe_select(df, cols):
        available = [c for c in cols if c in df.columns]
        result = df[available].copy()
        for c in cols:
            if c not in result.columns:
                result[c] = None
        return result[cols]

    all_dfs = [
        safe_select(new_scrape, common_cols),
        safe_select(old_scrape, common_cols),
        safe_select(cleaned_v2, common_cols),
    ]

    combined = pd.concat(all_dfs, ignore_index=True)
    print(f"\nCombined (before dedup): {len(combined)} records")

    # Deduplicate by source_job_id, keeping the most recent scrape
    combined['scraped_at'] = pd.to_datetime(combined['scraped_at'], errors='coerce')
    combined = combined.sort_values('scraped_at', ascending=False)
    combined = combined.drop_duplicates(subset=['source_job_id'], keep='first')
    combined = combined.sort_values('scraped_at').reset_index(drop=True)
    print(f"After dedup by source_job_id: {len(combined)} unique records")

    # Only keep actual job postings (not tenders/consultancy for ML training)
    jobs = combined[combined['listing_type'] == 'job'].copy()
    print(f"Job postings only: {len(jobs)} records")

    # Classify each record into a sector
    print("\nClassifying into sectors...")
    results = []
    for _, row in jobs.iterrows():
        sector_slug, confidence, method = classify_record(row)
        results.append({
            'sector_slug': sector_slug,
            'sector_name': SECTOR_NAMES[sector_slug],
            'classification_confidence': confidence,
            'classification_method': method,
        })

    result_df = pd.DataFrame(results)
    classified = pd.concat([jobs.reset_index(drop=True), result_df], axis=1)

    # Save
    out_dir = os.path.join(DATA_DIR, "classified")
    os.makedirs(out_dir, exist_ok=True)

    out_csv = os.path.join(out_dir, "classified_all_sectors.csv")
    classified.to_csv(out_csv, index=False, encoding='utf-8')
    print(f"\nSaved {len(classified)} records to {out_csv}")

    # Also save the full combined (including tenders) for reference
    all_results = []
    for _, row in combined.iterrows():
        sector_slug, confidence, method = classify_record(row)
        all_results.append({
            'sector_slug': sector_slug,
            'sector_name': SECTOR_NAMES[sector_slug],
            'classification_confidence': confidence,
            'classification_method': method,
        })
    all_result_df = pd.DataFrame(all_results)
    all_classified = pd.concat([combined.reset_index(drop=True), all_result_df], axis=1)
    all_csv = os.path.join(out_dir, "classified_all_listings.csv")
    all_classified.to_csv(all_csv, index=False, encoding='utf-8')
    print(f"Saved {len(all_classified)} total listings to {all_csv}")

    # Summary
    print("\n" + "=" * 60)
    print("JOBS BY SECTOR (combined from all sources)")
    print("=" * 60)
    print(f"\n{'Sector':<30} {'Jobs':>6}  {'Sources'}")
    print("-" * 70)
    for sector in sorted(SECTOR_NAMES.keys()):
        s = classified[classified['sector_slug'] == sector]
        sources = s['source'].value_counts().to_dict()
        src_str = ", ".join(f"{k}:{v}" for k, v in sources.items())
        print(f"  {SECTOR_NAMES[sector]:<28} {len(s):>6}  {src_str}")
    print("-" * 70)
    print(f"  {'TOTAL':<28} {len(classified):>6}")

    by_source = classified['source'].value_counts()
    print(f"\nBy source:")
    for src, cnt in by_source.items():
        print(f"  {src}: {cnt}")


if __name__ == "__main__":
    main()
