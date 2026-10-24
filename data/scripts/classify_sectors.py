#!/usr/bin/env python3
"""
SkillSense — Multi-Sector Classification
==========================================
Maps raw JobInRwanda industry labels + job titles to the 9 SkillSense sectors.
Uses a two-pass approach:
  1. Primary: map the industry_raw labels to sectors
  2. Fallback: keyword analysis of title + raw_text for ambiguous records
"""

import pandas as pd
import re
import os
import json
from collections import Counter
from datetime import datetime

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.dirname(SCRIPT_DIR)
INPUT_PATH = os.path.join(DATA_DIR, "raw", "jobinrwanda", "raw_jobinrwanda_all_sectors.csv")
OUTPUT_DIR = os.path.join(DATA_DIR, "classified")

# ── Mapping: raw industry labels → SkillSense sector slugs ──────

LABEL_TO_SECTOR = {
    # ICT & Technology
    "Computer and IT": "ict-technology",
    "Telecommunication": "ict-technology",

    # Finance & Business
    "Accounting": "finance-business",
    "Finance and investment": "finance-business",
    "Auditing": "finance-business",
    "Banking": "finance-business",
    "Business": "finance-business",
    "Economics": "finance-business",

    # Engineering
    "Civil engineering": "engineering",
    "Electrical engineering": "engineering",
    "Mechanical engineering": "engineering",
    "Engineering": "engineering",
    "Water engineering": "engineering",

    # Healthcare
    "Health": "healthcare",
    "Medicine": "healthcare",
    "Public health": "healthcare",
    "Pharmacy": "healthcare",

    # Education & Research
    "Education": "education-research",
    "Research": "education-research",
    "Psychology": "education-research",
    "Statistics": "education-research",
    "Linguistics and literature": "education-research",

    # Agriculture & Environment
    "Agriculture": "agriculture-environment",
    "Agronomy": "agriculture-environment",
    "Food sciences": "agriculture-environment",
    "Mining": "agriculture-environment",
    "Geology": "agriculture-environment",
    "Environmental": "agriculture-environment",
    "Animal sciences": "agriculture-environment",
    "Land management": "agriculture-environment",

    # Government & Public Admin
    "Law": "government-public-admin",
    "Procurement": "government-public-admin",
    "Political science": "government-public-admin",

    # Services & Commerce
    "Hospitality": "services-commerce",
    "Marketing and sales": "services-commerce",
    "Communications": "services-commerce",
    "Logistics": "services-commerce",
    "Human resource": "services-commerce",
    "Hotel": "services-commerce",
    "Catering": "services-commerce",
    "Leisure": "services-commerce",
    "Property management": "services-commerce",
    "Journalism": "services-commerce",
    "Office management": "services-commerce",

    # Development & NGO
    "International relations": "development-ngo",
    "Social sciences": "development-ngo",
    "Project management": "development-ngo",
    "Demography and data analysis": "development-ngo",

    # Generic labels that need title-based classification
    "Administration": None,  # too generic
    "Management": None,      # too generic
    "Other": None,           # catch-all
}

# ── Keyword patterns for title/text-based classification ─────────

KEYWORD_SECTORS = {
    "ict-technology": [
        r'\b(software|developer|devops|IT\b|ICT|data\s+(?:engineer|scientist|analyst)|'
        r'system\s*admin|network\s+(?:engineer|admin|architect|analyst)|cyber|cloud|database|full.?stack|front.?end|back.?end|'
        r'machine\s+learning|AI\b|UX|UI|web\s+develop|mobile\s+develop|GIS|'
        r'programmer|digital\s+transform|e-?commerce|blockchain|SaaS|ITSM|'
        r'syst[eè]m|tech\s+lead|CTO|information\s+technology|SAP\b|ERP\b|'
        r'java\b|python\b|php\b|\.net\b|dotnet|kotlin|react\b|angular|node\.?js|'
        r'android|ios\s+develop|swift\b|ruby|laravel|automation\s+engineer|'
        r'video\s+edit|graphic\s+design|social\s+media|content\s+creat|digital\s+market)',
    ],
    "finance-business": [
        r'\b(financ|accountant|accounting|accounts?\s+(?:payable|receivable|assistant|officer)|'
        r'auditor|audit|bank|teller|credit|bookkeep|'
        r'tax\b|treasury|CFO|controller|budget|investment|insurance|actuari|'
        r'economist|business\s+analyst|risk\s+(?:analyst|officer|compliance)|'
        r'chief\s+executive|CEO\b|managing\s+director|venture\s+build)',
    ],
    "engineering": [
        r'\b(engineer|civil\b|structural|electrical|mechanical|plumb|'
        r'construction|architect|surveyor|maintenance|HVAC|power\s+plant|'
        r'generator|technician|plant\s+(?:operator|supervisor|manager)|'
        r'water\s+engineer|automated\s+operations|truck\s+(?:driver|operator))',
    ],
    "healthcare": [
        r'\b(doctor|nurse|physician|pharmacist|health|medical|clinic|'
        r'hospital|surgeon|dentist|radiol|laborator|biobank|patholog|'
        r'infection|wellbeing|wellness|mental\s+health|nutrition|GP\b|'
        r'maternal|newborn|epidemiolog|midwi|physiotherap|optometri)',
    ],
    "education-research": [
        r'\b(teacher|professor|lecturer|academ|universit|school|'
        r'curriculum|education|trainer|tutor|research|bootcamp|training\s+institute|'
        r'inclusive\s+education|clerkship|fellowship|data\s+anal)',
    ],
    "agriculture-environment": [
        r'\b(agri|farm|agronomy|livestock|fish|crop|dairy|seed|harvest|'
        r'mine\b|mining|mineral|geolog|environment|forest|conservation|'
        r'tea\s+shop|food\s+process|veterinar|poultry|pig\b|machine\s+operator)',
    ],
    "government-public-admin": [
        r'\b(government|public\s+admin|procurement\s+(?:officer|specialist)|'
        r'legal\b|lawyer|attorney|judge|regulat|policy\s+analyst|'
        r'governance|compliance\s+officer|public\s+sector|fraud\s+investigat)',
    ],
    "services-commerce": [
        r'\b(hotel|hospitality|chef|cook\b|butler|waiter|receptionist|cleaner|'
        r'marketing|sales|PR\b|public\s+relations|logistics|driver|chauffeur|'
        r'transport|warehouse|HR\b|human\s+resource|recruit|real\s+estate|'
        r'customer\s+(?:care|service)|merchandise|store\s+assist|'
        r'team\s+leader|branch\s+(?:business|manager|coordinator)|operat|'
        r'admin\s+(?:assistant|officer)|office\s+(?:assistant|manager)|'
        r'creative\s+writ|communicat|partnership|head\s+of\s+(?:growth|strategic))',
    ],
    "development-ngo": [
        r'\b(NGO|donor|humanitarian|development\s+(?:officer|program)|'
        r'WASH|field\s+officer|program\s+(?:coordinator|manager)|'
        r'M&E|monitoring|fundrais|international\s+(?:development|relations)|'
        r'human\s+rights|social\s+(?:worker|scientist|specialist)|'
        r'community\s+(?:officer|engag)|protection\s+(?:associate|officer)|'
        r'resource\s+mobilis)',
    ],
}

SECTOR_NAMES = {
    "ict-technology": "ICT & Technology",
    "finance-business": "Finance & Business",
    "engineering": "Engineering",
    "healthcare": "Healthcare",
    "education-research": "Education & Research",
    "agriculture-environment": "Agriculture & Environment",
    "government-public-admin": "Government & Public Admin",
    "services-commerce": "Services & Commerce",
    "development-ngo": "Development & NGO",
}


def classify_by_labels(industry_raw):
    """Pass 1: Map industry_raw labels to sectors, return counter of sector votes."""
    if pd.isna(industry_raw):
        return Counter()
    labels = [l.strip() for l in industry_raw.split(",")]
    votes = Counter()
    for label in labels:
        sector = LABEL_TO_SECTOR.get(label)
        if sector:
            votes[sector] += 1
    return votes


def classify_by_keywords(title, raw_text):
    """Pass 2: Keyword matching on title and raw_text."""
    title = str(title) if title and not (isinstance(title, float)) else ''
    raw_text = str(raw_text) if raw_text and not (isinstance(raw_text, float)) else ''
    text = f"{title} {raw_text[:2000]}"
    votes = Counter()
    for sector_slug, patterns in KEYWORD_SECTORS.items():
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                votes[sector_slug] += len(matches)
    return votes


def classify_record(row):
    """Classify a single record into a sector. Returns (sector_slug, confidence, method)."""
    label_votes = classify_by_labels(row.get("industry_raw"))

    if label_votes:
        top_sector = label_votes.most_common(1)[0]
        total = sum(label_votes.values())
        confidence = top_sector[1] / total if total > 0 else 0
        if confidence >= 0.5:
            return top_sector[0], round(confidence, 2), "label_mapping"

    keyword_votes = classify_by_keywords(row.get("title"), row.get("raw_text"))

    combined = label_votes + keyword_votes
    if combined:
        top_sector = combined.most_common(1)[0]
        total = sum(combined.values())
        confidence = min(0.9, top_sector[1] / max(total, 1))
        return top_sector[0], round(confidence, 2), "label+keyword"

    if keyword_votes:
        top_sector = keyword_votes.most_common(1)[0]
        return top_sector[0], 0.4, "keyword_only"

    return "services-commerce", 0.1, "default_fallback"


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print("=" * 60)
    print("SkillSense — Multi-Sector Classification")
    print("=" * 60)

    df = pd.read_csv(INPUT_PATH)
    print(f"Loaded {len(df)} records from {INPUT_PATH}")

    results = []
    for _, row in df.iterrows():
        sector_slug, confidence, method = classify_record(row)
        results.append({
            "sector_slug": sector_slug,
            "sector_name": SECTOR_NAMES[sector_slug],
            "classification_confidence": confidence,
            "classification_method": method,
        })

    result_df = pd.DataFrame(results)
    classified = pd.concat([df, result_df], axis=1)

    # Save
    out_csv = os.path.join(OUTPUT_DIR, "classified_all_sectors.csv")
    classified.to_csv(out_csv, index=False, encoding="utf-8")
    print(f"\nSaved {len(classified)} records to {out_csv}")

    out_json = os.path.join(OUTPUT_DIR, "classified_all_sectors.json")
    classified.to_json(out_json, orient="records", indent=2, force_ascii=False)
    print(f"Saved JSON to {out_json}")

    # Summary
    print("\n" + "=" * 60)
    print("CLASSIFICATION SUMMARY")
    print("=" * 60)

    print("\nBy sector:")
    sector_counts = classified["sector_name"].value_counts()
    for sector, count in sector_counts.items():
        jobs = classified[(classified["sector_name"] == sector) & (classified["listing_type"] == "job")]
        print(f"  {sector}: {count} total ({len(jobs)} jobs)")

    print(f"\nBy classification method:")
    for method, count in classified["classification_method"].value_counts().items():
        print(f"  {method}: {count}")

    print(f"\nAverage confidence: {classified['classification_confidence'].mean():.2f}")
    low_conf = classified[classified["classification_confidence"] < 0.3]
    print(f"Low confidence (<0.3): {len(low_conf)} records")

    # Sector breakdown for jobs only
    jobs_only = classified[classified["listing_type"] == "job"]
    print(f"\n=== JOBS ONLY ({len(jobs_only)} records) ===")
    print("\nSector distribution:")
    for sector, count in jobs_only["sector_name"].value_counts().items():
        pct = count / len(jobs_only) * 100
        print(f"  {sector}: {count} ({pct:.1f}%)")

    print(f"\nFinished: {datetime.now().isoformat()}")


if __name__ == "__main__":
    main()
