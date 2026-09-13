#!/usr/bin/env python3
"""
SkillSense — ETL Pipeline
===========================
Transforms raw job-posting data into analytical datasets.

This pipeline is REUSABLE. It can process:
1. The initial baseline scrape
2. Future manually-uploaded CSV files (new_jobs_YYYY_MM.csv)

Pipeline stages:
  RAW → CLEAN → DEDUPLICATE → CLASSIFY ICT → NORMALIZE ROLES →
  GROUP ROLES → EXTRACT SKILLS → NORMALIZE LOCATIONS →
  NORMALIZE INDUSTRIES → TEMPORAL AGGREGATION → ANALYTICAL DATASETS →
  MODEL-READY DATASETS

Usage:
  python3 etl_pipeline.py                    # Process initial baseline
  python3 etl_pipeline.py new_jobs.csv       # Process new upload
"""

import pandas as pd
import numpy as np
import re
import hashlib
import json
import os
import sys
from datetime import datetime, timedelta
from collections import Counter

# ── Paths ──────────────────────────────────────────────────────────

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DIR = os.path.join(BASE_DIR, "raw")
CLEANED_DIR = os.path.join(BASE_DIR, "cleaned")
NORM_DIR = os.path.join(BASE_DIR, "normalization")
ANALYTICAL_DIR = os.path.join(BASE_DIR, "analytical")
MODELING_DIR = os.path.join(BASE_DIR, "modeling")
REPORTS_DIR = os.path.join(BASE_DIR, "reports")
METADATA_DIR = os.path.join(BASE_DIR, "metadata")

for d in [CLEANED_DIR, NORM_DIR, ANALYTICAL_DIR, MODELING_DIR, REPORTS_DIR, METADATA_DIR]:
    os.makedirs(d, exist_ok=True)


# ======================================================================
# STAGE 1: LOAD RAW DATA
# ======================================================================

def load_raw_data(new_file=None):
    """Load raw data from scraper output or a new upload file."""
    frames = []

    if new_file:
        print(f"[LOAD] Loading new upload: {new_file}")
        df = pd.read_csv(new_file, dtype=str)
        df['_input_file'] = os.path.basename(new_file)
        frames.append(df)
    else:
        # Load from raw scraper outputs
        for source_dir in ['jobinrwanda', 'rwandajob']:
            csv_path = os.path.join(RAW_DIR, source_dir, f"raw_{source_dir}.csv")
            if os.path.exists(csv_path):
                print(f"[LOAD] Loading {csv_path}")
                df = pd.read_csv(csv_path, dtype=str)
                df['_input_file'] = f"raw_{source_dir}.csv"
                frames.append(df)
                print(f"  → {len(df)} records")

    if not frames:
        print("[LOAD] ERROR: No data files found!")
        sys.exit(1)

    raw = pd.concat(frames, ignore_index=True)
    print(f"[LOAD] Total raw records: {len(raw)}")
    return raw


# ======================================================================
# STAGE 2: CLEANING
# ======================================================================

def clean_data(df):
    """Clean and standardize raw data."""
    print("\n[CLEAN] Cleaning data...")
    original_count = len(df)

    # Strip whitespace from all string columns
    for col in df.columns:
        if df[col].dtype == 'object':
            df[col] = df[col].str.strip()
            df[col] = df[col].replace(['', 'None', 'none', 'N/A', 'n/a', 'null', 'NULL'], np.nan)

    # Remove records with no title
    df = df.dropna(subset=['title'])
    print(f"  Removed {original_count - len(df)} records with no title")

    # Standardize dates
    for date_col in ['posted_date', 'closing_date']:
        if date_col in df.columns:
            df[date_col] = pd.to_datetime(df[date_col], errors='coerce', format='mixed')

    if 'scraped_at' in df.columns:
        df['scraped_at'] = pd.to_datetime(df['scraped_at'], errors='coerce', format='mixed')

    # Create content hash for deduplication
    def make_hash(row):
        content = f"{row.get('title', '')}|{row.get('company', '')}|{row.get('location_raw', '')}|{row.get('posted_date', '')}"
        return hashlib.md5(content.encode('utf-8')).hexdigest()

    df['content_hash'] = df.apply(make_hash, axis=1)

    # Ensure country
    if 'country' not in df.columns:
        df['country'] = 'Rwanda'
    df['country'] = df['country'].fillna('Rwanda')

    # Create a unique record ID
    df['record_id'] = [f"JOB-{i:06d}" for i in range(len(df))]

    print(f"  Clean records: {len(df)}")
    return df


# ======================================================================
# STAGE 3: DEDUPLICATION
# ======================================================================

def deduplicate(df):
    """Identify and mark duplicate postings."""
    print("\n[DEDUP] Deduplicating...")

    df['is_duplicate'] = False
    df['duplicate_group_id'] = pd.Series(dtype='object', index=df.index)
    df['duplicate_confidence'] = 0.0
    df['canonical_job_id'] = df['record_id']

    # Normalize title for comparison
    df['_title_norm'] = df['title'].str.lower().str.strip()
    df['_title_norm'] = df['_title_norm'].str.replace(r'[^a-z0-9\s]', '', regex=True)
    df['_title_norm'] = df['_title_norm'].str.replace(r'\s+', ' ', regex=True)

    # Group by exact content hash
    hash_groups = df.groupby('content_hash').filter(lambda x: len(x) > 1)
    if len(hash_groups) > 0:
        group_id = 0
        for hash_val, group in df.groupby('content_hash'):
            if len(group) > 1:
                group_id += 1
                idx = group.index.tolist()
                canonical = idx[0]  # First record is canonical
                for i in idx[1:]:
                    df.loc[i, 'is_duplicate'] = True
                    df.loc[i, 'duplicate_group_id'] = group_id
                    df.loc[i, 'duplicate_confidence'] = 1.0
                    df.loc[i, 'canonical_job_id'] = df.loc[canonical, 'record_id']

    # Also check for near-duplicates: same normalized title + company + similar date
    company_col = 'company' if 'company' in df.columns else None
    if company_col:
        non_dup = df[~df['is_duplicate']].copy()
        group_id = df['duplicate_group_id'].max()
        if pd.isna(group_id):
            group_id = 0

        for (title, company), group in non_dup.groupby(['_title_norm', company_col]):
            if pd.isna(company) or len(group) <= 1:
                continue
            # Check if dates are within 7 days
            if 'posted_date' in group.columns:
                dates = group['posted_date'].dropna()
                if len(dates) > 1:
                    date_range = (dates.max() - dates.min()).days if hasattr(dates.max() - dates.min(), 'days') else 999
                    if date_range <= 7:
                        group_id += 1
                        idx = group.index.tolist()
                        canonical = idx[0]
                        for i in idx[1:]:
                            df.loc[i, 'is_duplicate'] = True
                            df.loc[i, 'duplicate_group_id'] = group_id
                            df.loc[i, 'duplicate_confidence'] = 0.85
                            df.loc[i, 'canonical_job_id'] = df.loc[canonical, 'record_id']

    df.drop(columns=['_title_norm'], inplace=True)

    dup_count = df['is_duplicate'].sum()
    print(f"  Duplicates found: {dup_count} ({dup_count/len(df)*100:.1f}%)")
    print(f"  Unique records: {len(df) - dup_count}")
    return df


# ======================================================================
# STAGE 4: ICT CLASSIFICATION
# ======================================================================

# ICT keywords for classification
ICT_TITLE_KEYWORDS = [
    r'\bsoftware\b', r'\bdevelop(?:er|ment)\b', r'\bengineer(?:ing)?\b',
    r'\bprogramm(?:er|ing)\b', r'\bcod(?:er|ing)\b',
    r'\bweb\s*develop', r'\bfrontend\b', r'\bfront[\-\s]?end\b',
    r'\bbackend\b', r'\bback[\-\s]?end\b', r'\bfull[\-\s]?stack\b',
    r'\bmobile\s*(?:app|develop)', r'\bios\s*develop', r'\bandroid\s*develop',
    r'\bdata\s*(?:engineer|scientist|analyst|analy)', r'\bdata\b.*\bscien',
    r'\bmachine\s*learn', r'\bartificial\s*intelligen', r'\b(?:ai|ml)\s*engineer',
    r'\bdeep\s*learn',
    r'\bdatabase\b', r'\bdba\b', r'\bdb\s*admin',
    r'\bnetwork\s*(?:engineer|admin|specialist|technician)',
    r'\btelecommunication', r'\btelecom\b',
    r'\bsystem(?:s)?\s*admin', r'\bsysadmin\b',
    r'\bit\s*(?:officer|manager|director|coordinator|specialist|admin|support|help)',
    r'\bict\s*(?:officer|manager|director|coordinator|specialist|admin)',
    r'\bhelp\s*desk\b', r'\btechnical\s*support\b',
    r'\bcyber\s*security\b', r'\binformation\s*security\b',
    r'\bsecurity\s*(?:engineer|analyst|specialist|architect)',
    r'\bdevops\b', r'\bdev[\-\s]?ops\b', r'\bcloud\s*engineer',
    r'\bsite\s*reliability\b', r'\bsre\b',
    r'\bqa\b', r'\bquality\s*assur', r'\btest(?:ing)?\s*engineer',
    r'\bautomation\s*(?:engineer|test)',
    r'\bit\s*audit', r'\bit\s*govern', r'\binformation\s*(?:system|technolog)',
    r'\bui[\s/]*ux\b', r'\bux\s*design', r'\bui\s*design',
    r'\bsolution\s*(?:architect|engineer)',
    r'\bcloud\s*(?:architect|specialist|admin)',
    r'\bembedded\s*(?:system|engineer|develop)',
    r'\bfirmware\b', r'\bhardware\s*engineer',
    r'\berp\b.*(?:develop|engineer|admin|special)',
    r'\btechnical\s*(?:architect|lead|manager)',
    r'\bscrum\s*master\b', r'\bproduct\s*owner\b.*(?:tech|software|digital)',
]

ICT_DESCRIPTION_KEYWORDS = [
    r'\bpython\b', r'\bjava(?:script)?\b', r'\btypescript\b',
    r'\breact\b', r'\bangular\b', r'\bvue\.?js\b', r'\bnode\.?js\b',
    r'\bdjango\b', r'\bflask\b', r'\bfastapi\b', r'\bspring\s*boot\b',
    r'\b\.net\b', r'\bc#\b', r'\bc\+\+\b', r'\bruby\b', r'\bphp\b',
    r'\bswift\b', r'\bkotlin\b', r'\bflutter\b', r'\breact\s*native\b',
    r'\bsql\b', r'\bpostgresql\b', r'\bmysql\b', r'\bmongodb\b',
    r'\boracle\b.*(?:db|database)',
    r'\bdocker\b', r'\bkubernetes\b', r'\bk8s\b',
    r'\baws\b', r'\bazure\b', r'\bgcp\b', r'\bgoogle\s*cloud\b',
    r'\bci[\s/]*cd\b', r'\bjenkins\b', r'\bgit(?:hub|lab)?\b',
    r'\blinux\b', r'\bunix\b', r'\bwindows\s*server\b',
    r'\bcisco\b', r'\brouting\b', r'\bswitching\b',
    r'\bfirewall\b', r'\bvpn\b', r'\btcp[\s/]*ip\b',
    r'\brest\s*api\b', r'\bmicroservice', r'\bapi\s*(?:develop|design|integrat)',
    r'\bagile\b', r'\bscrum\b', r'\bdevops\b',
    r'\bpower\s*bi\b', r'\btableau\b', r'\bdata\s*visual',
    r'\btensorflow\b', r'\bpytorch\b', r'\bscikit',
    r'\bpenetration\s*test', r'\bvapt\b', r'\bsiem\b',
]

# Titles that are NOT ICT even if they mention tech
NON_ICT_PATTERNS = [
    r'^accountant', r'^auditor(?!\s*it)', r'^hr\s', r'^human\s*resource',
    r'^admin(?:istrative)?\s*(?:assistant|officer|secretary)',
    r'^(?:sales|marketing)\s*(?:officer|manager|executive|representative)',
    r'^driver\b', r'^cook\b', r'^cleaner\b', r'^guard\b',
    r'^receptionist\b', r'^cashier\b', r'^procurement\b',
    r'^lawyer\b', r'^legal\b', r'^nurse\b', r'^doctor\b',
    r'^teacher\b(?!.*(?:computer|ict|it))', r'^lecturer\b(?!.*(?:computer|ict|it))',
    r'^agronomist\b', r'^farmer\b', r'^veterinar',
    r'^journalist\b', r'^reporter\b',
    r'^architect\b(?!.*(?:solution|software|system|cloud|enterprise|data))',
]


def classify_ict(df):
    """Classify each posting as ICT or non-ICT."""
    print("\n[ICT] Classifying ICT jobs...")

    df['is_ict'] = False
    df['ict_role_confidence'] = 0.0
    df['classification_reason'] = ''
    df['sector'] = ''

    for idx, row in df.iterrows():
        title = str(row.get('title', '')).lower()
        desc = str(row.get('raw_text', '') or row.get('description', '') or '').lower()
        industry = str(row.get('industry_raw', '') or '').lower()
        category = str(row.get('category_raw', '') or '').lower()

        score = 0.0
        reasons = []

        # Check if explicitly non-ICT
        is_non_ict = False
        for pattern in NON_ICT_PATTERNS:
            if re.search(pattern, title, re.I):
                is_non_ict = True
                break

        if is_non_ict:
            df.loc[idx, 'sector'] = 'Non-ICT'
            df.loc[idx, 'classification_reason'] = 'Non-ICT title pattern'
            continue

        # Check title keywords
        title_matches = 0
        for pattern in ICT_TITLE_KEYWORDS:
            if re.search(pattern, title, re.I):
                title_matches += 1

        if title_matches > 0:
            score += min(0.6, 0.3 * title_matches)
            reasons.append(f'title_match({title_matches})')

        # Check category/industry
        ict_categories = ['computer', 'it', 'ict', 'technology', 'software',
                          'engineering', 'telecom', 'digital']
        for cat in ict_categories:
            if cat in industry or cat in category:
                score += 0.2
                reasons.append(f'category({cat})')
                break

        # Check description keywords (lower weight)
        if desc and len(desc) > 50:
            desc_matches = 0
            for pattern in ICT_DESCRIPTION_KEYWORDS:
                if re.search(pattern, desc, re.I):
                    desc_matches += 1

            if desc_matches >= 3:
                score += min(0.3, 0.05 * desc_matches)
                reasons.append(f'desc_match({desc_matches})')

        # Determine classification
        if score >= 0.3:
            df.loc[idx, 'is_ict'] = True
            df.loc[idx, 'ict_role_confidence'] = min(1.0, score)
            df.loc[idx, 'sector'] = 'ICT'
            df.loc[idx, 'classification_reason'] = '; '.join(reasons)
        else:
            df.loc[idx, 'sector'] = 'Non-ICT'
            df.loc[idx, 'classification_reason'] = 'insufficient_ict_evidence'

    ict_count = df['is_ict'].sum()
    print(f"  ICT jobs: {ict_count} ({ict_count/len(df)*100:.1f}%)")
    print(f"  Non-ICT jobs: {len(df) - ict_count}")
    return df


# ======================================================================
# STAGE 5: ROLE NORMALIZATION
# ======================================================================

# Role normalization rules: pattern → (normalized_role, role_family/group)
ROLE_RULES = [
    # Software Development
    (r'(?:backend|back[\-\s]?end)\s*(?:develop|engineer|programm)', 'Backend Developer', 'Software Development'),
    (r'(?:frontend|front[\-\s]?end)\s*(?:develop|engineer)', 'Frontend / Web Developer', 'Software Development'),
    (r'(?:web\s*develop)', 'Frontend / Web Developer', 'Software Development'),
    (r'(?:full[\-\s]?stack)\s*(?:develop|engineer)', 'Full-Stack Developer', 'Software Development'),
    (r'(?:mobile|ios|android|flutter|react\s*native)\s*(?:app\s*)?(?:develop|engineer)', 'Mobile App Developer', 'Software Development'),
    (r'(?:software)\s*(?:develop|engineer|programm)', 'Software Developer / Software Engineer', 'Software Development'),
    (r'(?:application)\s*(?:develop|engineer)', 'Software Developer / Software Engineer', 'Software Development'),
    (r'(?:java|python|\.net|c#|php|ruby)\s*(?:develop|engineer|programm)', 'Software Developer / Software Engineer', 'Software Development'),
    (r'(?:develop|programm)(?:er|ment)\b(?!.*(?:business|project|program|community|content|curriculum|training))', 'Software Developer / Software Engineer', 'Software Development'),

    # Systems Analysis
    (r'(?:system|business)\s*analyst', 'Systems Analyst / IT Business Analyst', 'Systems Analysis'),
    (r'(?:it|ict)\s*(?:business\s*)?analyst', 'Systems Analyst / IT Business Analyst', 'Systems Analysis'),
    (r'(?:functional|technical)\s*analyst', 'Systems Analyst / IT Business Analyst', 'Systems Analysis'),

    # Data & Analytics
    (r'data\s*analyst', 'Data Analyst', 'Data & Analytics'),
    (r'(?:bi|business\s*intelligen)\s*(?:analyst|develop|engineer|specialist)', 'Data Analyst', 'Data & Analytics'),
    (r'data\s*engineer', 'Data Engineer', 'Data & Analytics'),
    (r'data\s*scien', 'Data Scientist', 'Data & Analytics'),
    (r'(?:machine|deep)\s*learn(?:ing)?\s*engineer', 'Data Scientist', 'Data & Analytics'),
    (r'(?:ai|artificial\s*intelligen)\s*(?:engineer|specialist|develop)', 'Data Scientist', 'Data & Analytics'),

    # Database
    (r'(?:database|dba|db)\s*(?:admin|engineer|specialist|develop)', 'Database Administrator', 'Data & Database'),

    # Networks
    (r'network\s*(?:engineer|admin|specialist|architect)', 'Network Engineer / Network Administrator', 'Networks'),
    (r'(?:telecom|telecommunication)\s*(?:engineer|technician|specialist)', 'Telecommunications / Network Technician', 'Networks'),
    (r'network\s*(?:technician|support|operator)', 'Telecommunications / Network Technician', 'Networks'),

    # Systems & Infrastructure
    (r'(?:system|server|infrastructure)\s*(?:admin|engineer)', 'Systems Administrator', 'Systems & Infrastructure'),
    (r'sysadmin', 'Systems Administrator', 'Systems & Infrastructure'),

    # IT Operations & Support
    (r'(?:it|ict)\s*(?:officer|coordinator|administrator)(?!\s*(?:audit|secur|govern))', 'IT Officer / ICT Administrator', 'IT Operations & Support'),
    (r'(?:it|ict)\s*(?:manager|director)(?!\s*(?:audit|secur|govern))', 'ICT Manager / IT Manager', 'ICT Management'),
    (r'(?:it|ict|technical)\s*(?:support|help\s*desk|service\s*desk)', 'IT Support / Help Desk Technician', 'IT Operations & Support'),
    (r'help\s*desk', 'IT Support / Help Desk Technician', 'IT Operations & Support'),
    (r'desktop\s*(?:support|engineer|technician)', 'IT Support / Help Desk Technician', 'IT Operations & Support'),

    # Cybersecurity
    (r'(?:cyber|information)\s*security', 'Cybersecurity Analyst / Security Engineer', 'Cybersecurity'),
    (r'security\s*(?:engineer|analyst|specialist|architect|consultant)', 'Cybersecurity Analyst / Security Engineer', 'Cybersecurity'),
    (r'(?:penetration|pen)\s*test', 'Cybersecurity Analyst / Security Engineer', 'Cybersecurity'),
    (r'soc\s*analyst', 'Cybersecurity Analyst / Security Engineer', 'Cybersecurity'),

    # Cloud & DevOps
    (r'devops', 'DevOps / Cloud Engineer', 'Cloud & DevOps'),
    (r'(?:cloud|aws|azure|gcp)\s*(?:engineer|architect|admin|specialist)', 'DevOps / Cloud Engineer', 'Cloud & DevOps'),
    (r'site\s*reliability\s*engineer', 'DevOps / Cloud Engineer', 'Cloud & DevOps'),
    (r'(?:platform|infrastructure)\s*engineer', 'DevOps / Cloud Engineer', 'Cloud & DevOps'),

    # Software Quality
    (r'(?:qa|quality\s*assur)\s*(?:engineer|analyst|tester|lead|specialist)', 'QA / Software Test Engineer', 'Software Quality'),
    (r'(?:test|testing)\s*(?:engineer|analyst|automat|lead|specialist)', 'QA / Software Test Engineer', 'Software Quality'),
    (r'(?:automation)\s*(?:engineer|tester)', 'QA / Software Test Engineer', 'Software Quality'),

    # ICT Management
    (r'(?:cto|chief\s*technol)', 'ICT Manager / IT Manager', 'ICT Management'),
    (r'(?:it|ict|tech|technol)\s*(?:manager|director|head|lead|vp)', 'ICT Manager / IT Manager', 'ICT Management'),
    (r'(?:technical|engineering)\s*(?:manager|director|lead)', 'ICT Manager / IT Manager', 'ICT Management'),

    # IT Governance & Audit
    (r'(?:it|ict)\s*audit', 'IT Auditor / IT Governance & Risk', 'IT Governance & Audit'),
    (r'(?:it|ict)\s*(?:govern|risk|compliance)', 'IT Auditor / IT Governance & Risk', 'IT Governance & Audit'),

    # UI/UX Design (map to Software Development family)
    (r'(?:ui|ux|ui[\s/]*ux)\s*(?:design|develop)', 'Frontend / Web Developer', 'Software Development'),
    (r'(?:product|digital)\s*design', 'Frontend / Web Developer', 'Software Development'),

    # Solution/Enterprise Architect
    (r'(?:solution|enterprise|technical)\s*architect', 'Software Developer / Software Engineer', 'Software Development'),
    (r'solution\s*engineer', 'Software Developer / Software Engineer', 'Software Development'),

    # ERP
    (r'erp\s*(?:develop|engineer|specialist|admin|consult)', 'Software Developer / Software Engineer', 'Software Development'),
]


def normalize_roles(df):
    """Normalize job titles to SkillSense role taxonomy."""
    print("\n[ROLES] Normalizing roles...")

    df['original_job_title'] = df['title']
    df['normalized_role'] = np.nan
    df['role_family'] = np.nan
    df['role_group'] = np.nan
    df['role_level'] = np.nan
    df['role_normalization_confidence'] = 0.0
    # Pre-initialize string columns to avoid dtype conflicts
    for col in ['role_level', 'normalized_role', 'role_family', 'role_group']:
        df[col] = df[col].astype(object)

    # Only process ICT jobs for role normalization
    ict_mask = df['is_ict'] == True

    for idx in df[ict_mask].index:
        title = str(df.loc[idx, 'title']).lower().strip()
        desc = str(df.loc[idx, 'raw_text'] or df.loc[idx, 'description'] or '').lower()

        # Detect level
        level = 'Mid-Level'
        if re.search(r'\b(?:junior|jr|entry|trainee|intern|graduate)\b', title, re.I):
            level = 'Entry-Level'
        elif re.search(r'\b(?:senior|sr|lead|principal|staff|chief|head|director)\b', title, re.I):
            level = 'Senior'
        elif re.search(r'\b(?:manager|director|vp|cto|cio)\b', title, re.I):
            level = 'Management'

        df.loc[idx, 'role_level'] = level

        # Try matching title against rules
        matched = False
        for pattern, norm_role, role_family in ROLE_RULES:
            if re.search(pattern, title, re.I):
                df.loc[idx, 'normalized_role'] = norm_role
                df.loc[idx, 'role_family'] = role_family
                df.loc[idx, 'role_group'] = role_family
                df.loc[idx, 'role_normalization_confidence'] = 0.9
                matched = True
                break

        # If title didn't match, try description
        if not matched and desc:
            for pattern, norm_role, role_family in ROLE_RULES:
                if re.search(pattern, desc[:500], re.I):
                    df.loc[idx, 'normalized_role'] = norm_role
                    df.loc[idx, 'role_family'] = role_family
                    df.loc[idx, 'role_group'] = role_family
                    df.loc[idx, 'role_normalization_confidence'] = 0.6
                    matched = True
                    break

        # Fallback: Other ICT Technical Roles
        if not matched:
            df.loc[idx, 'normalized_role'] = 'Other ICT Technical Roles'
            df.loc[idx, 'role_family'] = 'Other ICT'
            df.loc[idx, 'role_group'] = 'Other ICT'
            df.loc[idx, 'role_normalization_confidence'] = 0.3

    # Summary
    ict_roles = df[ict_mask]['normalized_role'].value_counts()
    print(f"  ICT roles normalized: {ict_mask.sum()}")
    print(f"  Unique normalized roles: {len(ict_roles)}")
    print(f"\n  Top roles:")
    for role, count in ict_roles.head(15).items():
        print(f"    {role}: {count}")

    return df


# ======================================================================
# STAGE 6: SKILL EXTRACTION
# ======================================================================

# Comprehensive skill dictionary
SKILL_PATTERNS = {
    # Programming Languages
    'Python': (r'\bpython\b', 'Programming Languages'),
    'Java': (r'\bjava\b(?!script)', 'Programming Languages'),
    'JavaScript': (r'\bjavascript\b|\bjs\b', 'Programming Languages'),
    'TypeScript': (r'\btypescript\b|\bts\b', 'Programming Languages'),
    'C#': (r'\bc#\b|\.net\b', 'Programming Languages'),
    'C++': (r'\bc\+\+\b', 'Programming Languages'),
    'PHP': (r'\bphp\b', 'Programming Languages'),
    'Ruby': (r'\bruby\b', 'Programming Languages'),
    'Go': (r'\bgolang\b|\bgo\s+(?:lang|programm)', 'Programming Languages'),
    'Rust': (r'\brust\s+(?:lang|programm)', 'Programming Languages'),
    'Swift': (r'\bswift\b', 'Programming Languages'),
    'Kotlin': (r'\bkotlin\b', 'Programming Languages'),
    'R': (r'\br\s+(?:programm|lang|stat)|(?:^|\s)r(?:\s|,|$)', 'Programming Languages'),
    'Scala': (r'\bscala\b', 'Programming Languages'),
    'Dart': (r'\bdart\b', 'Programming Languages'),
    'SQL': (r'\bsql\b', 'Programming Languages'),
    'HTML/CSS': (r'\bhtml\b|\bcss\b', 'Programming Languages'),
    'Bash/Shell': (r'\bbash\b|\bshell\s*script', 'Programming Languages'),

    # Frameworks
    'React': (r'\breact(?:\.?js)?\b(?!\s*native)', 'Frameworks'),
    'Angular': (r'\bangular(?:\.?js)?\b', 'Frameworks'),
    'Vue.js': (r'\bvue(?:\.?js)?\b', 'Frameworks'),
    'Node.js': (r'\bnode(?:\.?js)?\b', 'Frameworks'),
    'Django': (r'\bdjango\b', 'Frameworks'),
    'Flask': (r'\bflask\b', 'Frameworks'),
    'FastAPI': (r'\bfastapi\b', 'Frameworks'),
    'Spring Boot': (r'\bspring\s*boot\b|\bspring\s*framework\b', 'Frameworks'),
    'Express.js': (r'\bexpress(?:\.?js)?\b', 'Frameworks'),
    'Next.js': (r'\bnext(?:\.?js)?\b', 'Frameworks'),
    'Laravel': (r'\blaravel\b', 'Frameworks'),
    'Rails': (r'\brails\b|\bruby\s*on\s*rails\b', 'Frameworks'),
    'ASP.NET': (r'\basp\.?net\b', 'Frameworks'),
    'React Native': (r'\breact\s*native\b', 'Frameworks'),
    'Flutter': (r'\bflutter\b', 'Frameworks'),
    'TailwindCSS': (r'\btailwind\b', 'Frameworks'),
    'Bootstrap': (r'\bbootstrap\b', 'Frameworks'),

    # Databases
    'PostgreSQL': (r'\bpostgres(?:ql)?\b', 'Databases'),
    'MySQL': (r'\bmysql\b', 'Databases'),
    'MongoDB': (r'\bmongodb?\b', 'Databases'),
    'Oracle DB': (r'\boracle\b.*(?:db|database)|oracle\s*(?:11|12|19)', 'Databases'),
    'SQL Server': (r'\bsql\s*server\b|\bmssql\b', 'Databases'),
    'Redis': (r'\bredis\b', 'Databases'),
    'Elasticsearch': (r'\belasticsearch\b|\belastic\b', 'Databases'),
    'SQLite': (r'\bsqlite\b', 'Databases'),
    'DynamoDB': (r'\bdynamodb\b', 'Databases'),
    'Cassandra': (r'\bcassandra\b', 'Databases'),

    # Cloud
    'AWS': (r'\baws\b|\bamazon\s*web\s*services\b', 'Cloud'),
    'Azure': (r'\bazure\b|\bmicrosoft\s*cloud\b', 'Cloud'),
    'GCP': (r'\bgcp\b|\bgoogle\s*cloud\b', 'Cloud'),
    'DigitalOcean': (r'\bdigitalocean\b', 'Cloud'),
    'Heroku': (r'\bheroku\b', 'Cloud'),

    # DevOps
    'Docker': (r'\bdocker\b', 'DevOps'),
    'Kubernetes': (r'\bkubernetes\b|\bk8s\b', 'DevOps'),
    'Jenkins': (r'\bjenkins\b', 'DevOps'),
    'GitLab CI': (r'\bgitlab\s*ci\b', 'DevOps'),
    'GitHub Actions': (r'\bgithub\s*actions\b', 'DevOps'),
    'Terraform': (r'\bterraform\b', 'DevOps'),
    'Ansible': (r'\bansible\b', 'DevOps'),
    'CI/CD': (r'\bci[\s/]*cd\b', 'DevOps'),
    'Prometheus': (r'\bprometheus\b', 'DevOps'),
    'Grafana': (r'\bgrafana\b', 'DevOps'),
    'Nginx': (r'\bnginx\b', 'DevOps'),
    'Apache': (r'\bapache\b(?!\s*(?:spark|kafka|airflow))', 'DevOps'),

    # Cybersecurity
    'Penetration Testing': (r'\bpenetration\s*test|\bpen\s*test|\bvapt\b', 'Cybersecurity'),
    'SIEM': (r'\bsiem\b', 'Cybersecurity'),
    'Firewall': (r'\bfirewall\b', 'Cybersecurity'),
    'Encryption': (r'\bencryption\b|\bcryptograph', 'Cybersecurity'),
    'ISO 27001': (r'\biso\s*27001\b', 'Cybersecurity'),
    'SOC': (r'\bsoc\b(?!\s*(?:media|ial))', 'Cybersecurity'),

    # Networking
    'Cisco': (r'\bcisco\b', 'Networking'),
    'Routing': (r'\brouting\b', 'Networking'),
    'Switching': (r'\bswitching\b', 'Networking'),
    'TCP/IP': (r'\btcp[\s/]*ip\b', 'Networking'),
    'VPN': (r'\bvpn\b', 'Networking'),
    'LAN/WAN': (r'\b(?:lan|wan)\b', 'Networking'),
    'DNS': (r'\bdns\b', 'Networking'),
    'DHCP': (r'\bdhcp\b', 'Networking'),

    # Operating Systems
    'Linux': (r'\blinux\b|\bubuntu\b|\bcentos\b|\brhel\b|\bdebian\b', 'Operating Systems'),
    'Windows Server': (r'\bwindows\s*server\b', 'Operating Systems'),
    'Unix': (r'\bunix\b', 'Operating Systems'),

    # Data & Analytics
    'Power BI': (r'\bpower\s*bi\b', 'Data & Analytics'),
    'Tableau': (r'\btableau\b', 'Data & Analytics'),
    'Excel': (r'\bexcel\b(?!\s*(?:lent|l))', 'Data & Analytics'),
    'SPSS': (r'\bspss\b', 'Data & Analytics'),
    'Pandas': (r'\bpandas\b', 'Data & Analytics'),
    'NumPy': (r'\bnumpy\b', 'Data & Analytics'),
    'Apache Spark': (r'\bspark\b|\bpyspark\b', 'Data & Analytics'),
    'Hadoop': (r'\bhadoop\b', 'Data & Analytics'),
    'ETL': (r'\betl\b', 'Data & Analytics'),
    'Data Warehousing': (r'\bdata\s*warehous', 'Data & Analytics'),

    # AI / Machine Learning
    'TensorFlow': (r'\btensorflow\b', 'AI / Machine Learning'),
    'PyTorch': (r'\bpytorch\b', 'AI / Machine Learning'),
    'Scikit-learn': (r'\bscikit[\s\-]*learn\b|\bsklearn\b', 'AI / Machine Learning'),
    'NLP': (r'\bnlp\b|\bnatural\s*language\s*process', 'AI / Machine Learning'),
    'Computer Vision': (r'\bcomputer\s*vision\b', 'AI / Machine Learning'),
    'Deep Learning': (r'\bdeep\s*learn', 'AI / Machine Learning'),

    # Tools
    'Git': (r'\bgit\b(?!(?:hub|lab))', 'Tools'),
    'GitHub': (r'\bgithub\b', 'Tools'),
    'GitLab': (r'\bgitlab\b', 'Tools'),
    'Jira': (r'\bjira\b', 'Tools'),
    'Confluence': (r'\bconfluence\b', 'Tools'),
    'VS Code': (r'\bvs\s*code\b|\bvisual\s*studio\s*code\b', 'Tools'),
    'Postman': (r'\bpostman\b', 'Tools'),
    'Figma': (r'\bfigma\b', 'Tools'),
    'Slack': (r'\bslack\b', 'Tools'),

    # Methodologies
    'Agile': (r'\bagile\b', 'Software Engineering'),
    'Scrum': (r'\bscrum\b', 'Software Engineering'),
    'REST APIs': (r'\brest(?:ful)?\s*api\b|\brest\s', 'Software Engineering'),
    'Microservices': (r'\bmicroservice', 'Software Engineering'),
    'GraphQL': (r'\bgraphql\b', 'Software Engineering'),
    'TDD': (r'\btdd\b|\btest[\s\-]*driven', 'Software Engineering'),
    'OOP': (r'\boop\b|\bobject[\s\-]*orient', 'Software Engineering'),

    # Certifications
    'CCNA': (r'\bccna\b', 'Certifications'),
    'CCNP': (r'\bccnp\b', 'Certifications'),
    'AWS Certified': (r'\baws\s*certif', 'Certifications'),
    'Azure Certified': (r'\bazure\s*certif', 'Certifications'),
    'PMP': (r'\bpmp\b', 'Certifications'),
    'ITIL': (r'\bitil\b', 'Certifications'),
    'CISSP': (r'\bcissp\b', 'Certifications'),
    'CEH': (r'\bceh\b|\bcertified\s*ethical\s*hack', 'Certifications'),
    'CompTIA': (r'\bcomptia\b', 'Certifications'),
    'PRINCE2': (r'\bprince\s*2\b', 'Certifications'),
    'Scrum Master Cert': (r'\bcsm\b|\bpsm\b|\bcertified\s*scrum\s*master', 'Certifications'),

    # Soft Skills
    'Communication': (r'\bcommunication\s*skill', 'Soft Skills'),
    'Teamwork': (r'\bteamwork\b|\bteam\s*(?:work|player)', 'Soft Skills'),
    'Problem Solving': (r'\bproblem[\s\-]*solv', 'Soft Skills'),
    'Leadership': (r'\bleadership\b', 'Soft Skills'),
    'Analytical Thinking': (r'\banalytical\s*(?:think|skill|abilit)', 'Soft Skills'),
    'Project Management': (r'\bproject\s*management\b', 'Business / Functional Skills'),
}


def extract_skills(df):
    """Extract skills from job postings."""
    print("\n[SKILLS] Extracting skills...")

    all_skills = []
    ict_df = df[df['is_ict'] == True]

    for idx, row in ict_df.iterrows():
        # Combine all text for skill extraction
        text_parts = [
            str(row.get('title', '') or ''),
            str(row.get('raw_text', '') or ''),
            str(row.get('description', '') or ''),
            str(row.get('requirements', '') or ''),
            str(row.get('qualifications', '') or ''),
            str(row.get('skills_raw', '') or ''),
            str(row.get('responsibilities', '') or ''),
        ]
        full_text = ' '.join(text_parts).lower()

        if len(full_text) < 20:
            continue

        for skill_name, (pattern, category) in SKILL_PATTERNS.items():
            if re.search(pattern, full_text, re.I):
                # Determine requirement type
                req_type = 'mentioned'
                if row.get('requirements') and re.search(pattern, str(row['requirements']).lower(), re.I):
                    req_type = 'required'
                elif row.get('qualifications') and re.search(pattern, str(row['qualifications']).lower(), re.I):
                    req_type = 'required'

                all_skills.append({
                    'record_id': row['record_id'],
                    'normalized_role': row.get('normalized_role'),
                    'role_group': row.get('role_group'),
                    'skill_name_normalized': skill_name,
                    'skill_category': category,
                    'skill_requirement_type': req_type,
                    'skill_confidence': 0.9,
                    'posted_date': row.get('posted_date'),
                    'company': row.get('company'),
                })

    skills_df = pd.DataFrame(all_skills)
    print(f"  Total skill extractions: {len(skills_df)}")
    if len(skills_df) > 0:
        print(f"  Unique skills: {skills_df['skill_name_normalized'].nunique()}")
        print(f"\n  Top skills:")
        for skill, count in skills_df['skill_name_normalized'].value_counts().head(15).items():
            print(f"    {skill}: {count}")

    return skills_df


# ======================================================================
# STAGE 7: LOCATION NORMALIZATION
# ======================================================================

RWANDA_LOCATIONS = {
    'kigali': {'city': 'Kigali', 'province': 'Kigali City', 'region': 'Central'},
    'gasabo': {'city': 'Kigali', 'district': 'Gasabo', 'province': 'Kigali City', 'region': 'Central'},
    'kicukiro': {'city': 'Kigali', 'district': 'Kicukiro', 'province': 'Kigali City', 'region': 'Central'},
    'nyarugenge': {'city': 'Kigali', 'district': 'Nyarugenge', 'province': 'Kigali City', 'region': 'Central'},
    'huye': {'city': 'Huye', 'province': 'Southern Province', 'region': 'Southern'},
    'butare': {'city': 'Huye', 'province': 'Southern Province', 'region': 'Southern'},
    'musanze': {'city': 'Musanze', 'province': 'Northern Province', 'region': 'Northern'},
    'rubavu': {'city': 'Rubavu', 'province': 'Western Province', 'region': 'Western'},
    'gisenyi': {'city': 'Rubavu', 'province': 'Western Province', 'region': 'Western'},
    'muhanga': {'city': 'Muhanga', 'province': 'Southern Province', 'region': 'Southern'},
    'rwamagana': {'city': 'Rwamagana', 'province': 'Eastern Province', 'region': 'Eastern'},
    'kayonza': {'city': 'Kayonza', 'province': 'Eastern Province', 'region': 'Eastern'},
    'nyagatare': {'city': 'Nyagatare', 'province': 'Eastern Province', 'region': 'Eastern'},
    'rusizi': {'city': 'Rusizi', 'province': 'Western Province', 'region': 'Western'},
    'karongi': {'city': 'Karongi', 'province': 'Western Province', 'region': 'Western'},
    'northern province': {'province': 'Northern Province', 'region': 'Northern'},
    'southern province': {'province': 'Southern Province', 'region': 'Southern'},
    'eastern province': {'province': 'Eastern Province', 'region': 'Eastern'},
    'western province': {'province': 'Western Province', 'region': 'Western'},
    'nationwide': {'region': 'Nationwide'},
    'remote': {'region': 'Remote'},
}


def normalize_locations(df):
    """Normalize location information."""
    print("\n[LOCATION] Normalizing locations...")

    for col in ['city', 'district', 'province', 'region', 'location_type']:
        df[col] = pd.Series(dtype='object', index=df.index)
    df['remote_flag'] = False

    for idx, row in df.iterrows():
        loc = str(row.get('location_raw', '') or '').lower().strip()
        if not loc or loc == 'nan':
            continue

        # Check for remote
        if re.search(r'\bremote\b', loc, re.I):
            df.loc[idx, 'remote_flag'] = True
            df.loc[idx, 'location_type'] = 'Remote'

        if re.search(r'\bhybrid\b', loc, re.I):
            df.loc[idx, 'location_type'] = 'Hybrid'

        # Match against known locations
        matched = False
        for key, info in RWANDA_LOCATIONS.items():
            if key in loc:
                for field in ['city', 'district', 'province', 'region']:
                    if field in info:
                        df.loc[idx, field] = info[field]
                if not df.loc[idx, 'location_type']:
                    df.loc[idx, 'location_type'] = 'On-site'
                matched = True
                break

        if not matched and not df.loc[idx, 'remote_flag']:
            # Check if it mentions Rwanda at all
            if 'rwanda' in loc:
                df.loc[idx, 'region'] = 'Rwanda (unspecified)'

    loc_counts = df['region'].value_counts()
    print(f"  Locations normalized:")
    for region, count in loc_counts.head(10).items():
        print(f"    {region}: {count}")

    return df


# ======================================================================
# STAGE 8: INDUSTRY NORMALIZATION
# ======================================================================

INDUSTRY_MAP = {
    r'bank|financ|microfinanc': 'Banking / Finance',
    r'insurance|insuranc': 'Insurance',
    r'telecom': 'Telecommunications',
    r'govern|public\s*sector|ministr|authorit': 'Government / Public Sector',
    r'ngo|non[\-\s]*govern|develop(?:ment)?\s*(?:organ|partner|agency)|international\s*organ|humanitarian|unicef|undp|unhcr|usaid': 'NGO / Development',
    r'educat|universit|school|college|academ|training\s*(?:instit|center)': 'Education',
    r'health|hospital|medical|pharma|clinic': 'Healthcare',
    r'tech(?:nology)?|software|digital|computer|ict': 'Technology / Software',
    r'consult': 'Consulting',
    r'manufactur|industrial': 'Manufacturing',
    r'retail|shop|store|supermarket|commerce': 'Retail',
    r'agricultur|farm|agri': 'Agriculture',
    r'energy|power|electric|solar|renewable': 'Energy',
    r'construct|building|real\s*estate|property': 'Construction',
    r'logistic|transport|supply\s*chain|warehouse': 'Logistics',
    r'media|broadcast|journal|news': 'Media',
    r'hospitality|hotel|tourism|travel|restaurant': 'Hospitality',
    r'legal|law\s*firm': 'Legal',
    r'mining|mineral|extracti': 'Mining',
}


def normalize_industries(df):
    """Normalize industry/sector information."""
    print("\n[INDUSTRY] Normalizing industries...")

    df['industry_normalized'] = pd.Series(dtype='object', index=df.index)

    for idx, row in df.iterrows():
        # Combine available industry signals
        industry_text = ' '.join(filter(None, [
            str(row.get('industry_raw', '') or ''),
            str(row.get('category_raw', '') or ''),
            str(row.get('company', '') or ''),
        ])).lower()

        if not industry_text.strip():
            continue

        for pattern, industry in INDUSTRY_MAP.items():
            if re.search(pattern, industry_text, re.I):
                df.loc[idx, 'industry_normalized'] = industry
                break

    ind_counts = df['industry_normalized'].value_counts()
    print(f"  Industries normalized:")
    for ind, count in ind_counts.head(10).items():
        print(f"    {ind}: {count}")

    return df


# ======================================================================
# STAGE 9: EXPERIENCE & EDUCATION NORMALIZATION
# ======================================================================

def normalize_experience_education(df):
    """Extract and normalize experience and education requirements."""
    print("\n[EXP/EDU] Normalizing experience and education...")

    df['minimum_experience_years'] = np.nan
    df['maximum_experience_years'] = np.nan
    for col in ['experience_category', 'education_level', 'degree_field']:
        df[col] = pd.Series(dtype='object', index=df.index)

    for idx, row in df.iterrows():
        # Experience extraction
        exp_text = ' '.join(filter(None, [
            str(row.get('experience_raw', '') or ''),
            str(row.get('requirements', '') or ''),
            str(row.get('qualifications', '') or ''),
            str(row.get('raw_text', '') or '')[:1000],
        ])).lower()

        # Extract years of experience
        exp_match = re.search(r'(\d+)\s*[\-–to]+\s*(\d+)\s*years?\s*(?:of\s*)?(?:experience|work)', exp_text)
        if exp_match:
            df.loc[idx, 'minimum_experience_years'] = int(exp_match.group(1))
            df.loc[idx, 'maximum_experience_years'] = int(exp_match.group(2))
        else:
            exp_match = re.search(r'(?:at\s*least|minimum|min)\s*(\d+)\s*years?', exp_text)
            if exp_match:
                df.loc[idx, 'minimum_experience_years'] = int(exp_match.group(1))
            else:
                exp_match = re.search(r'(\d+)\+?\s*years?\s*(?:of\s*)?(?:experience|work|relevant|professional)', exp_text)
                if exp_match:
                    df.loc[idx, 'minimum_experience_years'] = int(exp_match.group(1))

        # Categorize experience
        min_exp = df.loc[idx, 'minimum_experience_years']
        if pd.notna(min_exp):
            min_exp = int(min_exp)
            if min_exp == 0:
                df.loc[idx, 'experience_category'] = 'Entry Level'
            elif min_exp <= 2:
                df.loc[idx, 'experience_category'] = 'Less than 2 years'
            elif min_exp <= 5:
                df.loc[idx, 'experience_category'] = '2-5 years'
            elif min_exp <= 10:
                df.loc[idx, 'experience_category'] = '5-10 years'
            else:
                df.loc[idx, 'experience_category'] = '10+ years'

        # Also check for entry-level indicators
        if pd.isna(df.loc[idx, 'experience_category']):
            if re.search(r'\b(?:entry[\s\-]*level|junior|graduate|trainee|intern|no\s*experience\s*required)\b', exp_text):
                df.loc[idx, 'experience_category'] = 'Entry Level'
                df.loc[idx, 'minimum_experience_years'] = 0

        # Education extraction
        edu_text = ' '.join(filter(None, [
            str(row.get('education_raw', '') or ''),
            str(row.get('qualifications', '') or ''),
            str(row.get('requirements', '') or ''),
            str(row.get('raw_text', '') or '')[:1000],
        ])).lower()

        if re.search(r'\bph\.?d\b|\bdoctor(?:al|ate)\b', edu_text):
            df.loc[idx, 'education_level'] = 'PhD'
        elif re.search(r'\bmaster(?:\'?s)?\b|\bmsc\b|\bma\b|\bmba\b', edu_text):
            df.loc[idx, 'education_level'] = 'Master'
        elif re.search(r'\bbachelor(?:\'?s)?\b|\bbsc\b|\bba\b|\bdegree\b|\bundergraduate\b', edu_text):
            df.loc[idx, 'education_level'] = 'Bachelor'
        elif re.search(r'\badvanced\s*diploma\b', edu_text):
            df.loc[idx, 'education_level'] = 'Advanced Diploma'
        elif re.search(r'\bdiploma\b', edu_text):
            df.loc[idx, 'education_level'] = 'Diploma'
        elif re.search(r'\btvet\b|\btechnical\s*(?:and\s*)?vocational\b', edu_text):
            df.loc[idx, 'education_level'] = 'TVET'
        elif re.search(r'\bcertificat(?:e|ion)\b', edu_text):
            df.loc[idx, 'education_level'] = 'Professional Certification'
        elif re.search(r'\bsecondary\b|\bhigh\s*school\b|\ba[\s\-]*level\b', edu_text):
            df.loc[idx, 'education_level'] = 'Secondary'

        # Degree field
        if re.search(r'computer\s*science|informatic', edu_text):
            df.loc[idx, 'degree_field'] = 'Computer Science'
        elif re.search(r'software\s*engineer', edu_text):
            df.loc[idx, 'degree_field'] = 'Software Engineering'
        elif re.search(r'information\s*technolog|it\b', edu_text):
            df.loc[idx, 'degree_field'] = 'Information Technology'
        elif re.search(r'(?:electrical|electronic)\s*engineer', edu_text):
            df.loc[idx, 'degree_field'] = 'Electrical/Electronic Engineering'
        elif re.search(r'telecommunication', edu_text):
            df.loc[idx, 'degree_field'] = 'Telecommunications'
        elif re.search(r'data\s*science|statistic', edu_text):
            df.loc[idx, 'degree_field'] = 'Data Science / Statistics'
        elif re.search(r'math', edu_text):
            df.loc[idx, 'degree_field'] = 'Mathematics'
        elif re.search(r'business|management|admin', edu_text):
            df.loc[idx, 'degree_field'] = 'Business / Management'
        elif re.search(r'engineer', edu_text):
            df.loc[idx, 'degree_field'] = 'Engineering (General)'

    # Summary
    exp_cats = df['experience_category'].value_counts()
    edu_cats = df['education_level'].value_counts()
    print(f"  Experience categories: {len(exp_cats)}")
    for cat, count in exp_cats.items():
        print(f"    {cat}: {count}")
    print(f"  Education levels: {len(edu_cats)}")
    for cat, count in edu_cats.items():
        print(f"    {cat}: {count}")

    return df


# ======================================================================
# STAGE 10: EMPLOYMENT CHARACTERISTICS
# ======================================================================

def normalize_employment(df):
    """Normalize employment type and contract information."""
    print("\n[EMPLOY] Normalizing employment characteristics...")

    df['employment_type_normalized'] = pd.Series(dtype='object', index=df.index)
    df['contract_type_normalized'] = pd.Series(dtype='object', index=df.index)
    df['full_time'] = False
    df['part_time'] = False
    df['internship'] = False
    df['permanent'] = False
    df['fixed_term'] = False
    df['freelance'] = False

    for idx, row in df.iterrows():
        emp_text = ' '.join(filter(None, [
            str(row.get('employment_type_raw', '') or ''),
            str(row.get('contract_type_raw', '') or ''),
            str(row.get('raw_text', '') or '')[:500],
        ])).lower()

        if re.search(r'\bfull[\s\-]*time\b', emp_text):
            df.loc[idx, 'full_time'] = True
            df.loc[idx, 'employment_type_normalized'] = 'Full-time'
        elif re.search(r'\bpart[\s\-]*time\b', emp_text):
            df.loc[idx, 'part_time'] = True
            df.loc[idx, 'employment_type_normalized'] = 'Part-time'
        elif re.search(r'\bintern(?:ship)?\b', emp_text):
            df.loc[idx, 'internship'] = True
            df.loc[idx, 'employment_type_normalized'] = 'Internship'
        elif re.search(r'\bfreelance\b|\bcontract(?:or)?\b|\bconsultant\b', emp_text):
            df.loc[idx, 'freelance'] = True
            df.loc[idx, 'employment_type_normalized'] = 'Freelance/Contract'

        if re.search(r'\bpermanent\b|\bopen[\s\-]*ended\b|\bindefinite\b', emp_text):
            df.loc[idx, 'permanent'] = True
            df.loc[idx, 'contract_type_normalized'] = 'Permanent'
        elif re.search(r'\bfixed[\s\-]*term\b|\btemporary\b|\bshort[\s\-]*term\b', emp_text):
            df.loc[idx, 'fixed_term'] = True
            df.loc[idx, 'contract_type_normalized'] = 'Fixed-term'

    return df


# ======================================================================
# STAGE 11: TEMPORAL FEATURES
# ======================================================================

def create_temporal_features(df):
    """Create temporal features for time-series analysis."""
    print("\n[TIME] Creating temporal features...")

    # Ensure posted_date is datetime
    if 'posted_date' in df.columns:
        df['posted_date'] = pd.to_datetime(df['posted_date'], errors='coerce')
    if 'closing_date' in df.columns:
        df['closing_date'] = pd.to_datetime(df['closing_date'], errors='coerce')

    # Extract temporal components
    df['year'] = df['posted_date'].dt.year
    df['quarter'] = df['posted_date'].dt.quarter
    df['month'] = df['posted_date'].dt.month
    df['week'] = df['posted_date'].dt.isocalendar().week.astype('Int64')
    df['year_month'] = df['posted_date'].dt.to_period('M').astype(str)

    # Month index (continuous for time-series)
    min_date = df['posted_date'].min()
    if pd.notna(min_date):
        df['month_index'] = ((df['posted_date'].dt.year - min_date.year) * 12 +
                             df['posted_date'].dt.month - min_date.month)

    # Days open
    if 'closing_date' in df.columns:
        df['days_open'] = (df['closing_date'] - df['posted_date']).dt.days

    # Date coverage
    valid_dates = df['posted_date'].dropna()
    if len(valid_dates) > 0:
        print(f"  Date range: {valid_dates.min().date()} to {valid_dates.max().date()}")
        print(f"  Records with dates: {len(valid_dates)} / {len(df)}")

        year_month_counts = df.groupby('year_month').size()
        print(f"  Monthly coverage: {len(year_month_counts)} months")
    else:
        print("  WARNING: No valid dates found!")

    return df


# ======================================================================
# STAGE 12: AGGREGATE ANALYTICAL DATASETS
# ======================================================================

def create_role_monthly(df):
    """Create role × month demand dataset."""
    print("\n[AGG] Creating role monthly demand...")

    ict = df[(df['is_ict'] == True) & (~df['is_duplicate']) & (df['year_month'].notna())].copy()

    if len(ict) == 0:
        print("  WARNING: No ICT records with dates!")
        return pd.DataFrame()

    # Role-level monthly
    role_monthly = ict.groupby(['year', 'month', 'year_month', 'normalized_role', 'role_group']).agg(
        job_posting_count=('record_id', 'count'),
        unique_employer_count=('company', 'nunique'),
    ).reset_index()

    # Calculate total ICT demand per month for share calculation
    monthly_total = ict.groupby('year_month')['record_id'].count().rename('monthly_ict_total')
    role_monthly = role_monthly.merge(monthly_total, on='year_month', how='left')
    role_monthly['role_share_within_ict'] = (role_monthly['job_posting_count'] /
                                              role_monthly['monthly_ict_total'] * 100).round(2)

    # Sort by time
    role_monthly = role_monthly.sort_values(['year', 'month', 'normalized_role'])

    # Rolling averages (per role)
    for window, col_name in [(3, 'rolling_3m_demand'), (6, 'rolling_6m_demand'), (12, 'rolling_12m_demand')]:
        role_monthly[col_name] = role_monthly.groupby('normalized_role')['job_posting_count'].transform(
            lambda x: x.rolling(window, min_periods=1).mean().round(2)
        )

    # Growth metrics
    role_monthly['mom_growth'] = role_monthly.groupby('normalized_role')['job_posting_count'].pct_change().round(4)

    print(f"  Role-monthly records: {len(role_monthly)}")
    return role_monthly


def create_role_group_monthly(df):
    """Create role_group × month demand dataset."""
    print("\n[AGG] Creating role group monthly demand...")

    ict = df[(df['is_ict'] == True) & (~df['is_duplicate']) & (df['year_month'].notna())].copy()

    if len(ict) == 0:
        return pd.DataFrame()

    group_monthly = ict.groupby(['year', 'month', 'year_month', 'role_group']).agg(
        job_posting_count=('record_id', 'count'),
        unique_employer_count=('company', 'nunique'),
        unique_roles=('normalized_role', 'nunique'),
    ).reset_index()

    monthly_total = ict.groupby('year_month')['record_id'].count().rename('monthly_ict_total')
    group_monthly = group_monthly.merge(monthly_total, on='year_month', how='left')
    group_monthly['group_share_within_ict'] = (group_monthly['job_posting_count'] /
                                                group_monthly['monthly_ict_total'] * 100).round(2)

    group_monthly = group_monthly.sort_values(['year', 'month', 'role_group'])

    for window, col_name in [(3, 'rolling_3m_demand'), (6, 'rolling_6m_demand')]:
        group_monthly[col_name] = group_monthly.groupby('role_group')['job_posting_count'].transform(
            lambda x: x.rolling(window, min_periods=1).mean().round(2)
        )

    group_monthly['mom_growth'] = group_monthly.groupby('role_group')['job_posting_count'].pct_change().round(4)

    print(f"  Role-group-monthly records: {len(group_monthly)}")
    return group_monthly


def create_skill_monthly(skills_df):
    """Create skill × month demand dataset."""
    print("\n[AGG] Creating skill monthly demand...")

    if len(skills_df) == 0:
        return pd.DataFrame()

    skills_df['posted_date'] = pd.to_datetime(skills_df['posted_date'], errors='coerce')
    skills_df['year'] = skills_df['posted_date'].dt.year
    skills_df['month'] = skills_df['posted_date'].dt.month
    skills_df['year_month'] = skills_df['posted_date'].dt.to_period('M').astype(str)

    skill_monthly = skills_df.groupby(['year', 'month', 'year_month', 'skill_name_normalized', 'skill_category']).agg(
        posting_count=('record_id', 'nunique'),
        employer_count=('company', 'nunique'),
    ).reset_index()

    skill_monthly = skill_monthly.sort_values(['year', 'month', 'skill_name_normalized'])

    print(f"  Skill-monthly records: {len(skill_monthly)}")
    return skill_monthly


def create_role_skill_demand(skills_df):
    """Create role-skill relationship dataset."""
    print("\n[AGG] Creating role-skill demand...")

    if len(skills_df) == 0:
        return pd.DataFrame()

    skills_df['posted_date'] = pd.to_datetime(skills_df['posted_date'], errors='coerce')
    skills_df['year'] = skills_df['posted_date'].dt.year
    skills_df['month'] = skills_df['posted_date'].dt.month
    skills_df['year_month'] = skills_df['posted_date'].dt.to_period('M').astype(str)

    role_skill = skills_df.groupby(['normalized_role', 'role_group', 'skill_name_normalized', 'skill_category',
                                     'year_month']).agg(
        posting_count=('record_id', 'nunique'),
        employer_count=('company', 'nunique'),
    ).reset_index()

    # Calculate skill share within role
    role_totals = skills_df.groupby(['normalized_role', 'year_month'])['record_id'].nunique().rename('role_total')
    role_skill = role_skill.merge(role_totals, on=['normalized_role', 'year_month'], how='left')
    role_skill['skill_share_within_role'] = (role_skill['posting_count'] /
                                              role_skill['role_total'] * 100).round(2)

    print(f"  Role-skill records: {len(role_skill)}")
    return role_skill


def create_role_region_monthly(df):
    """Create role × region × month demand."""
    print("\n[AGG] Creating role-region monthly demand...")

    ict = df[(df['is_ict'] == True) & (~df['is_duplicate']) &
             (df['year_month'].notna()) & (df['region'].notna())].copy()

    if len(ict) == 0:
        return pd.DataFrame()

    role_region = ict.groupby(['year', 'month', 'year_month', 'normalized_role', 'role_group', 'region']).agg(
        job_posting_count=('record_id', 'count'),
        unique_employer_count=('company', 'nunique'),
    ).reset_index()

    print(f"  Role-region-monthly records: {len(role_region)}")
    return role_region


def create_role_industry_monthly(df):
    """Create role × industry × month demand."""
    print("\n[AGG] Creating role-industry monthly demand...")

    ict = df[(df['is_ict'] == True) & (~df['is_duplicate']) &
             (df['year_month'].notna()) & (df['industry_normalized'].notna())].copy()

    if len(ict) == 0:
        return pd.DataFrame()

    role_ind = ict.groupby(['year', 'month', 'year_month', 'normalized_role', 'role_group', 'industry_normalized']).agg(
        job_posting_count=('record_id', 'count'),
        unique_employer_count=('company', 'nunique'),
    ).reset_index()

    print(f"  Role-industry-monthly records: {len(role_ind)}")
    return role_ind


# ======================================================================
# STAGE 13: FORECASTING DATASET
# ======================================================================

def create_forecasting_dataset(role_monthly, df):
    """Create model-ready forecasting dataset."""
    print("\n[MODEL] Creating forecasting dataset...")

    if len(role_monthly) == 0:
        print("  WARNING: No role-monthly data for forecasting!")
        return pd.DataFrame(), pd.DataFrame()

    ict = df[(df['is_ict'] == True) & (~df['is_duplicate'])].copy()

    # Enrich role_monthly with additional features
    forecast_df = role_monthly.copy()

    # Experience features per role×month
    if 'minimum_experience_years' in ict.columns:
        exp_features = ict.groupby(['year_month', 'normalized_role']).agg(
            average_experience_required=('minimum_experience_years', 'mean'),
            share_entry_level=('experience_category', lambda x: (x == 'Entry Level').mean() * 100 if len(x) > 0 else np.nan),
        ).reset_index()
        forecast_df = forecast_df.merge(exp_features, on=['year_month', 'normalized_role'], how='left')

    # Education features
    if 'education_level' in ict.columns:
        edu_features = ict.groupby(['year_month', 'normalized_role']).agg(
            share_bachelor_required=('education_level', lambda x: (x == 'Bachelor').mean() * 100 if len(x) > 0 else np.nan),
            share_master_required=('education_level', lambda x: (x == 'Master').mean() * 100 if len(x) > 0 else np.nan),
        ).reset_index()
        forecast_df = forecast_df.merge(edu_features, on=['year_month', 'normalized_role'], how='left')

    # Employment features
    if 'remote_flag' in ict.columns:
        emp_features = ict.groupby(['year_month', 'normalized_role']).agg(
            remote_share=('remote_flag', lambda x: x.mean() * 100),
            permanent_contract_share=('permanent', lambda x: x.mean() * 100),
            fixed_term_share=('fixed_term', lambda x: x.mean() * 100),
        ).reset_index()
        forecast_df = forecast_df.merge(emp_features, on=['year_month', 'normalized_role'], how='left')

    # Create future targets (by shifting)
    for horizon, col_name in [(1, 'target_demand_1_month'), (3, 'target_demand_3_month'),
                               (6, 'target_demand_6_month'), (12, 'target_demand_12_month')]:
        forecast_df[col_name] = forecast_df.groupby('normalized_role')['job_posting_count'].shift(-horizon)

    forecast_df['sector'] = 'ICT'

    # Similarly create group-level forecasting dataset
    group_forecast = pd.DataFrame()  # Will be built similarly if enough data

    print(f"  Forecasting dataset rows: {len(forecast_df)}")
    return forecast_df, group_forecast


# ======================================================================
# STAGE 14: EMERGING ROLE/SKILL DETECTION
# ======================================================================

def detect_emerging(role_monthly, skill_monthly):
    """Detect emerging roles and skills."""
    print("\n[EMERGING] Detecting emerging roles and skills...")

    # Emerging roles
    if len(role_monthly) > 0:
        role_stats = role_monthly.groupby('normalized_role').agg(
            first_seen=('year_month', 'min'),
            last_seen=('year_month', 'max'),
            total_postings=('job_posting_count', 'sum'),
            months_active=('year_month', 'nunique'),
            avg_monthly_demand=('job_posting_count', 'mean'),
        ).reset_index()

        # Recent growth (last 3 months vs previous 3 months)
        sorted_months = sorted(role_monthly['year_month'].unique())
        if len(sorted_months) >= 6:
            recent = sorted_months[-3:]
            earlier = sorted_months[-6:-3]

            recent_demand = role_monthly[role_monthly['year_month'].isin(recent)].groupby('normalized_role')['job_posting_count'].sum()
            earlier_demand = role_monthly[role_monthly['year_month'].isin(earlier)].groupby('normalized_role')['job_posting_count'].sum()

            growth = ((recent_demand - earlier_demand) / earlier_demand.replace(0, np.nan) * 100).round(2)
            role_stats = role_stats.merge(growth.rename('recent_growth_pct'), on='normalized_role', how='left')
        else:
            role_stats['recent_growth_pct'] = np.nan

        # Emerging score: new + growing + minimum evidence
        role_stats['emerging_role_score'] = 0.0
        for idx, row in role_stats.iterrows():
            score = 0.0
            if row['total_postings'] >= 3:  # Minimum evidence threshold
                if row['months_active'] <= 3 and pd.notna(row.get('recent_growth_pct')):
                    score += 0.4  # New
                if pd.notna(row.get('recent_growth_pct')) and row.get('recent_growth_pct', 0) > 20:
                    score += 0.3  # Growing
                if row['avg_monthly_demand'] > 2:
                    score += 0.2  # Sustained
                if row['total_postings'] >= 5:
                    score += 0.1  # Volume
            role_stats.loc[idx, 'emerging_role_score'] = min(1.0, score)

        print(f"  Role emergence scores calculated for {len(role_stats)} roles")
    else:
        role_stats = pd.DataFrame()

    # Emerging skills
    if len(skill_monthly) > 0:
        skill_stats = skill_monthly.groupby('skill_name_normalized').agg(
            first_seen=('year_month', 'min'),
            last_seen=('year_month', 'max'),
            total_mentions=('posting_count', 'sum'),
            months_active=('year_month', 'nunique'),
        ).reset_index()
        skill_stats['emerging_skill_score'] = 0.0
        print(f"  Skill emergence scores calculated for {len(skill_stats)} skills")
    else:
        skill_stats = pd.DataFrame()

    return role_stats, skill_stats


# ======================================================================
# STAGE 15: SAVE ALL OUTPUTS
# ======================================================================

def save_outputs(df, skills_df, role_monthly, group_monthly, skill_monthly,
                 role_skill, role_region, role_industry, forecast_df,
                 role_stats, skill_stats):
    """Save all analytical datasets."""
    print("\n[SAVE] Saving all datasets...")

    # 1. Raw job postings (already saved by scraper)

    # 2. Cleaned job postings
    cleaned_path = os.path.join(CLEANED_DIR, "cleaned_job_postings.csv")
    df.to_csv(cleaned_path, index=False)
    print(f"  ✓ {cleaned_path} ({len(df)} records)")

    # 3. ICT job postings
    ict_df = df[df['is_ict'] == True].copy()
    ict_path = os.path.join(CLEANED_DIR, "ict_job_postings.csv")
    ict_df.to_csv(ict_path, index=False)
    print(f"  ✓ {ict_path} ({len(ict_df)} records)")

    # 4. Role normalization
    if len(ict_df) > 0:
        role_norm = ict_df[['record_id', 'original_job_title', 'normalized_role', 'role_family',
                            'role_group', 'role_level', 'role_normalization_confidence',
                            'is_ict', 'ict_role_confidence', 'classification_reason']].copy()
        norm_path = os.path.join(NORM_DIR, "role_normalization.csv")
        role_norm.to_csv(norm_path, index=False)
        print(f"  ✓ {norm_path} ({len(role_norm)} records)")

    # 5. Role grouping
    if len(ict_df) > 0:
        role_groups = ict_df.groupby(['role_group', 'normalized_role']).agg(
            posting_count=('record_id', 'count'),
            unique_employer_count=('company', 'nunique'),
        ).reset_index().sort_values(['role_group', 'posting_count'], ascending=[True, False])
        group_path = os.path.join(NORM_DIR, "role_grouping.csv")
        role_groups.to_csv(group_path, index=False)
        print(f"  ✓ {group_path} ({len(role_groups)} records)")

    # 6-7. Role monthly + Role group monthly
    if len(role_monthly) > 0:
        rm_path = os.path.join(ANALYTICAL_DIR, "job_role_monthly.csv")
        role_monthly.to_csv(rm_path, index=False)
        print(f"  ✓ {rm_path} ({len(role_monthly)} records)")

    if len(group_monthly) > 0:
        gm_path = os.path.join(ANALYTICAL_DIR, "job_role_group_monthly.csv")
        group_monthly.to_csv(gm_path, index=False)
        print(f"  ✓ {gm_path} ({len(group_monthly)} records)")

    # 8. Skill demand monthly
    if len(skill_monthly) > 0:
        sm_path = os.path.join(ANALYTICAL_DIR, "skill_demand_monthly.csv")
        skill_monthly.to_csv(sm_path, index=False)
        print(f"  ✓ {sm_path} ({len(skill_monthly)} records)")

    # 9. Role-skill demand
    if len(role_skill) > 0:
        rs_path = os.path.join(ANALYTICAL_DIR, "role_skill_demand.csv")
        role_skill.to_csv(rs_path, index=False)
        print(f"  ✓ {rs_path} ({len(role_skill)} records)")

    # 10. Role-region monthly
    if len(role_region) > 0:
        rr_path = os.path.join(ANALYTICAL_DIR, "role_region_monthly.csv")
        role_region.to_csv(rr_path, index=False)
        print(f"  ✓ {rr_path} ({len(role_region)} records)")

    # 11. Role-industry monthly
    if len(role_industry) > 0:
        ri_path = os.path.join(ANALYTICAL_DIR, "role_industry_monthly.csv")
        role_industry.to_csv(ri_path, index=False)
        print(f"  ✓ {ri_path} ({len(role_industry)} records)")

    # 12. Forecasting dataset
    if len(forecast_df) > 0:
        fd_path = os.path.join(MODELING_DIR, "skillsense_role_forecasting_dataset.csv")
        forecast_df.to_csv(fd_path, index=False)
        print(f"  ✓ {fd_path} ({len(forecast_df)} records)")

    # 13. Source statistics
    source_stats = df.groupby('source').agg(
        total_records=('record_id', 'count'),
        unique_records=('is_duplicate', lambda x: (~x).sum()),
        ict_records=('is_ict', 'sum'),
        earliest_date=('posted_date', 'min'),
        latest_date=('posted_date', 'max'),
        unique_companies=('company', 'nunique'),
    ).reset_index()
    ss_path = os.path.join(METADATA_DIR, "source_statistics.csv")
    source_stats.to_csv(ss_path, index=False)
    print(f"  ✓ {ss_path}")

    # 14. Save emerging role/skill data
    if len(role_stats) > 0:
        role_stats.to_csv(os.path.join(ANALYTICAL_DIR, "emerging_roles.csv"), index=False)
    if len(skill_stats) > 0:
        skill_stats.to_csv(os.path.join(ANALYTICAL_DIR, "emerging_skills.csv"), index=False)

    # 15. Skills raw extraction
    if len(skills_df) > 0:
        skills_df.to_csv(os.path.join(CLEANED_DIR, "extracted_skills.csv"), index=False)
        print(f"  ✓ extracted_skills.csv ({len(skills_df)} records)")


# ======================================================================
# STAGE 16: DATA QUALITY REPORT
# ======================================================================

def generate_data_quality_report(df, skills_df, role_monthly):
    """Generate comprehensive data quality report."""
    print("\n[REPORT] Generating data quality report...")

    report = []
    report.append("# SkillSense — Data Quality Report\n")
    report.append(f"Generated: {datetime.now().isoformat()}\n")

    # Overview
    report.append("## 1. Overview\n")
    report.append(f"| Metric | Value |")
    report.append(f"|--------|-------|")
    report.append(f"| Total raw records | {len(df)} |")
    report.append(f"| Unique records (non-duplicate) | {(~df['is_duplicate']).sum()} |")
    report.append(f"| Duplicate records | {df['is_duplicate'].sum()} |")
    report.append(f"| Duplicate percentage | {df['is_duplicate'].mean()*100:.1f}% |")
    report.append(f"| ICT records | {df['is_ict'].sum()} |")
    report.append(f"| Non-ICT records | {(~df['is_ict']).sum()} |")
    report.append(f"| ICT percentage | {df['is_ict'].mean()*100:.1f}% |")

    # Missing values
    report.append("\n## 2. Missing Values\n")
    report.append(f"| Field | Missing | Percentage |")
    report.append(f"|-------|---------|------------|")
    for col in ['title', 'company', 'description', 'raw_text', 'posted_date',
                 'closing_date', 'location_raw', 'industry_raw', 'experience_raw',
                 'education_raw', 'skills_raw', 'salary_raw']:
        if col in df.columns:
            missing = df[col].isna().sum()
            pct = missing / len(df) * 100
            report.append(f"| {col} | {missing} | {pct:.1f}% |")

    # Date coverage
    report.append("\n## 3. Temporal Coverage\n")
    valid_dates = df['posted_date'].dropna()
    if len(valid_dates) > 0:
        report.append(f"- Earliest posting: {valid_dates.min()}")
        report.append(f"- Latest posting: {valid_dates.max()}")
        report.append(f"- Records with valid dates: {len(valid_dates)} / {len(df)}")

        # Monthly coverage
        monthly = df.groupby('year_month').size()
        report.append(f"- Months covered: {len(monthly)}")
        report.append(f"\n### Monthly distribution:\n")
        for ym, count in monthly.items():
            report.append(f"  - {ym}: {count} postings")

    # ICT Role distribution
    report.append("\n## 4. ICT Role Distribution\n")
    ict = df[df['is_ict'] == True]
    if len(ict) > 0:
        role_counts = ict['normalized_role'].value_counts()
        report.append(f"| Role | Count | Share |")
        report.append(f"|------|-------|-------|")
        for role, count in role_counts.items():
            share = count / len(ict) * 100
            report.append(f"| {role} | {count} | {share:.1f}% |")

    # Role group distribution
    report.append("\n## 5. Role Group Distribution\n")
    if len(ict) > 0:
        group_counts = ict['role_group'].value_counts()
        report.append(f"| Role Group | Count | Share |")
        report.append(f"|------------|-------|-------|")
        for group, count in group_counts.items():
            share = count / len(ict) * 100
            report.append(f"| {group} | {count} | {share:.1f}% |")

    # Skills summary
    report.append("\n## 6. Skills Summary\n")
    if len(skills_df) > 0:
        report.append(f"- Total skill extractions: {len(skills_df)}")
        report.append(f"- Unique skills: {skills_df['skill_name_normalized'].nunique()}")
        top_skills = skills_df['skill_name_normalized'].value_counts().head(20)
        report.append(f"\n### Top 20 Skills:\n")
        report.append(f"| Skill | Mentions |")
        report.append(f"|-------|----------|")
        for skill, count in top_skills.items():
            report.append(f"| {skill} | {count} |")

    # Location distribution
    report.append("\n## 7. Geographic Distribution\n")
    region_counts = df[df['is_ict'] == True]['region'].value_counts()
    if len(region_counts) > 0:
        report.append(f"| Region | ICT Postings |")
        report.append(f"|--------|-------------|")
        for region, count in region_counts.items():
            report.append(f"| {region} | {count} |")

    # Forecasting readiness
    report.append("\n## 8. Forecasting Readiness\n")
    if len(role_monthly) > 0:
        n_months = role_monthly['year_month'].nunique()
        report.append(f"- Monthly periods available: {n_months}")
        report.append(f"- 6-month forecasting: {'POSSIBLE' if n_months >= 12 else 'INSUFFICIENT DATA'}")
        report.append(f"- 12-month forecasting: {'POSSIBLE' if n_months >= 18 else 'INSUFFICIENT DATA'}")
        report.append(f"- 24-month forecasting: {'POSSIBLE' if n_months >= 30 else 'INSUFFICIENT DATA'}")

        report.append(f"\n### Roles by observation count:\n")
        role_obs = role_monthly.groupby('normalized_role')['year_month'].nunique().sort_values(ascending=False)
        report.append(f"| Role | Months with data | Sufficient for forecasting |")
        report.append(f"|------|------------------|---------------------------|")
        for role, months in role_obs.items():
            sufficient = "Yes" if months >= 6 else "No"
            report.append(f"| {role} | {months} | {sufficient} |")

    # Data quality issues
    report.append("\n## 9. Data Quality Issues\n")
    issues = []
    if df['title'].isna().sum() > 0:
        issues.append(f"- {df['title'].isna().sum()} records missing title (removed)")
    if df['company'].isna().sum() > len(df) * 0.3:
        issues.append(f"- High missing company rate: {df['company'].isna().mean()*100:.1f}%")
    if df['posted_date'].isna().sum() > len(df) * 0.3:
        issues.append(f"- High missing date rate: {df['posted_date'].isna().mean()*100:.1f}%")
    if df['is_duplicate'].sum() > len(df) * 0.2:
        issues.append(f"- High duplicate rate: {df['is_duplicate'].mean()*100:.1f}%")

    if issues:
        for issue in issues:
            report.append(issue)
    else:
        report.append("- No major data quality issues detected")

    report_text = '\n'.join(report)
    report_path = os.path.join(REPORTS_DIR, "data_quality_report.md")
    with open(report_path, 'w') as f:
        f.write(report_text)
    print(f"  ✓ {report_path}")

    return report_text


# ======================================================================
# STAGE 17: DATA DICTIONARY
# ======================================================================

def generate_data_dictionary():
    """Generate data dictionary for all output files."""
    print("\n[DICT] Generating data dictionary...")

    fields = [
        # Identifiers
        ('record_id', 'Unique record identifier', 'string', 'Generated', 'All cleaned datasets'),
        ('source', 'Source website', 'string', 'Raw', 'All datasets'),
        ('source_url', 'Original URL of the job posting', 'string', 'Raw', 'Raw/cleaned datasets'),
        ('source_job_id', 'Job ID from source website', 'string', 'Raw', 'Raw/cleaned datasets'),
        ('raw_hash', 'SHA256 hash of raw HTML', 'string', 'Computed', 'Raw dataset'),
        ('content_hash', 'MD5 hash of title+company+location+date', 'string', 'Computed', 'Cleaned dataset'),

        # Job information
        ('title', 'Original job title as posted', 'string', 'Raw', 'All datasets'),
        ('original_job_title', 'Preserved original title (same as title)', 'string', 'Raw', 'ICT dataset'),
        ('company', 'Employer/organization name', 'string', 'Raw', 'All datasets'),
        ('description', 'Job description text', 'string', 'Raw', 'Cleaned dataset'),
        ('responsibilities', 'Key responsibilities', 'string', 'Extracted', 'Cleaned dataset'),
        ('requirements', 'Job requirements', 'string', 'Extracted', 'Cleaned dataset'),
        ('qualifications', 'Required qualifications', 'string', 'Extracted', 'Cleaned dataset'),
        ('raw_text', 'Full text of the posting', 'string', 'Raw', 'Cleaned dataset'),

        # Classification
        ('is_ict', 'Whether the job is classified as ICT', 'boolean', 'Classified', 'All datasets'),
        ('ict_role_confidence', 'Confidence of ICT classification (0-1)', 'float', 'Classified', 'All datasets'),
        ('classification_reason', 'Reason for ICT classification', 'string', 'Classified', 'All datasets'),
        ('sector', 'Sector classification (ICT or Non-ICT)', 'string', 'Classified', 'All datasets'),

        # Role normalization
        ('normalized_role', 'SkillSense normalized role name', 'string', 'Normalized', 'ICT datasets'),
        ('role_family', 'Role family/group name', 'string', 'Normalized', 'ICT datasets'),
        ('role_group', 'Related role group', 'string', 'Normalized', 'ICT datasets'),
        ('role_level', 'Seniority level (Entry/Mid/Senior/Management)', 'string', 'Normalized', 'ICT datasets'),
        ('role_normalization_confidence', 'Confidence of role normalization (0-1)', 'float', 'Normalized', 'ICT datasets'),

        # Deduplication
        ('is_duplicate', 'Whether this record is a duplicate', 'boolean', 'Computed', 'All datasets'),
        ('duplicate_group_id', 'Group ID for duplicate records', 'integer', 'Computed', 'All datasets'),
        ('duplicate_confidence', 'Confidence of duplicate detection (0-1)', 'float', 'Computed', 'All datasets'),
        ('canonical_job_id', 'Record ID of canonical (non-duplicate) version', 'string', 'Computed', 'All datasets'),

        # Location
        ('location_raw', 'Original location text', 'string', 'Raw', 'All datasets'),
        ('city', 'Normalized city name', 'string', 'Normalized', 'All datasets'),
        ('district', 'Rwanda district', 'string', 'Normalized', 'All datasets'),
        ('province', 'Rwanda province', 'string', 'Normalized', 'All datasets'),
        ('region', 'Broad geographic region', 'string', 'Normalized', 'All datasets'),
        ('country', 'Country (default: Rwanda)', 'string', 'Normalized', 'All datasets'),
        ('remote_flag', 'Whether remote work is indicated', 'boolean', 'Extracted', 'All datasets'),
        ('location_type', 'On-site / Remote / Hybrid', 'string', 'Extracted', 'All datasets'),

        # Industry
        ('industry_raw', 'Original industry/category text', 'string', 'Raw', 'All datasets'),
        ('industry_normalized', 'Normalized industry category', 'string', 'Normalized', 'All datasets'),

        # Experience & Education
        ('minimum_experience_years', 'Minimum years of experience required', 'integer', 'Extracted', 'All datasets'),
        ('maximum_experience_years', 'Maximum years of experience', 'integer', 'Extracted', 'All datasets'),
        ('experience_category', 'Experience level category', 'string', 'Normalized', 'All datasets'),
        ('education_level', 'Required education level', 'string', 'Normalized', 'All datasets'),
        ('degree_field', 'Required field of study', 'string', 'Extracted', 'All datasets'),

        # Employment
        ('employment_type_normalized', 'Normalized employment type', 'string', 'Normalized', 'All datasets'),
        ('contract_type_normalized', 'Normalized contract type', 'string', 'Normalized', 'All datasets'),
        ('full_time', 'Full-time indicator', 'boolean', 'Extracted', 'All datasets'),
        ('permanent', 'Permanent contract indicator', 'boolean', 'Extracted', 'All datasets'),

        # Dates
        ('posted_date', 'Job posting publication date', 'date', 'Raw/Parsed', 'All datasets'),
        ('closing_date', 'Application deadline', 'date', 'Raw/Parsed', 'All datasets'),
        ('scraped_at', 'When the posting was collected', 'datetime', 'Generated', 'All datasets'),

        # Temporal
        ('year', 'Year from posted_date', 'integer', 'Derived', 'Analytical datasets'),
        ('month', 'Month from posted_date', 'integer', 'Derived', 'Analytical datasets'),
        ('quarter', 'Quarter from posted_date', 'integer', 'Derived', 'Analytical datasets'),
        ('year_month', 'Year-month period (YYYY-MM)', 'string', 'Derived', 'Analytical datasets'),

        # Demand metrics
        ('job_posting_count', 'Number of job postings', 'integer', 'Aggregated', 'Analytical/Modeling'),
        ('unique_employer_count', 'Number of unique employers', 'integer', 'Aggregated', 'Analytical/Modeling'),
        ('role_share_within_ict', 'Role share of total ICT demand (%)', 'float', 'Computed', 'Analytical/Modeling'),
        ('rolling_3m_demand', '3-month rolling average demand', 'float', 'Computed', 'Modeling'),
        ('rolling_6m_demand', '6-month rolling average demand', 'float', 'Computed', 'Modeling'),
        ('rolling_12m_demand', '12-month rolling average demand', 'float', 'Computed', 'Modeling'),
        ('mom_growth', 'Month-over-month growth rate', 'float', 'Computed', 'Modeling'),

        # Forecast targets
        ('target_demand_1_month', 'Demand 1 month ahead', 'integer', 'Shifted', 'Modeling'),
        ('target_demand_6_month', 'Demand 6 months ahead', 'integer', 'Shifted', 'Modeling'),
        ('target_demand_12_month', 'Demand 12 months ahead', 'integer', 'Shifted', 'Modeling'),

        # Skills
        ('skill_name_normalized', 'Normalized skill name', 'string', 'Extracted', 'Skill datasets'),
        ('skill_category', 'Skill category', 'string', 'Classified', 'Skill datasets'),
        ('skill_requirement_type', 'Required / Preferred / Mentioned', 'string', 'Extracted', 'Skill datasets'),
        ('skill_share_within_role', 'Skill frequency within role (%)', 'float', 'Computed', 'Role-skill dataset'),
    ]

    dict_df = pd.DataFrame(fields, columns=['field', 'description', 'type', 'source', 'datasets'])
    dict_path = os.path.join(METADATA_DIR, "data_dictionary.csv")
    dict_df.to_csv(dict_path, index=False)
    print(f"  ✓ {dict_path} ({len(dict_df)} fields)")


# ======================================================================
# MAIN PIPELINE
# ======================================================================

def run_pipeline(new_file=None):
    """Run the complete ETL pipeline."""
    start_time = datetime.now()

    print("=" * 70)
    print("SkillSense — ETL Pipeline")
    print("=" * 70)
    print(f"Started: {start_time.isoformat()}")
    print(f"Mode: {'New upload' if new_file else 'Initial baseline'}")

    # Stage 1: Load
    df = load_raw_data(new_file)

    # Stage 2: Clean
    df = clean_data(df)

    # Stage 3: Deduplicate
    df = deduplicate(df)

    # Stage 4: ICT Classification
    df = classify_ict(df)

    # Stage 5: Role Normalization
    df = normalize_roles(df)

    # Stage 6: Skills (run on ICT jobs)
    skills_df = extract_skills(df)

    # Stage 7: Location
    df = normalize_locations(df)

    # Stage 8: Industry
    df = normalize_industries(df)

    # Stage 9: Experience & Education
    df = normalize_experience_education(df)

    # Stage 10: Employment
    df = normalize_employment(df)

    # Stage 11: Temporal
    df = create_temporal_features(df)

    # Stage 12: Aggregations
    role_monthly = create_role_monthly(df)
    group_monthly = create_role_group_monthly(df)
    skill_monthly = create_skill_monthly(skills_df)
    role_skill = create_role_skill_demand(skills_df)
    role_region = create_role_region_monthly(df)
    role_industry = create_role_industry_monthly(df)

    # Stage 13: Forecasting dataset
    forecast_df, group_forecast = create_forecasting_dataset(role_monthly, df)

    # Stage 14: Emerging detection
    role_stats, skill_stats = detect_emerging(role_monthly, skill_monthly)

    # Stage 15: Save all
    save_outputs(df, skills_df, role_monthly, group_monthly, skill_monthly,
                 role_skill, role_region, role_industry, forecast_df,
                 role_stats, skill_stats)

    # Stage 16: Quality report
    generate_data_quality_report(df, skills_df, role_monthly)

    # Stage 17: Data dictionary
    generate_data_dictionary()

    # Final summary
    elapsed = (datetime.now() - start_time).total_seconds()
    print("\n" + "=" * 70)
    print("PIPELINE COMPLETE")
    print("=" * 70)
    print(f"Duration: {elapsed:.1f} seconds")
    print(f"Total records processed: {len(df)}")
    print(f"ICT records: {df['is_ict'].sum()}")
    print(f"Unique ICT roles: {df[df['is_ict']==True]['normalized_role'].nunique()}")
    print(f"Unique skills extracted: {skills_df['skill_name_normalized'].nunique() if len(skills_df) > 0 else 0}")

    return df, skills_df


if __name__ == '__main__':
    new_file = sys.argv[1] if len(sys.argv) > 1 else None
    run_pipeline(new_file)
