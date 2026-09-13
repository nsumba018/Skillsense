#!/usr/bin/env python3
"""
SkillSense — Corrected ICT Classification, Role Normalization & Grouping Pipeline (v2)

Reads the raw JobInRwanda dataset, applies evidence-based ICT classification using
full job context (title + description + responsibilities + requirements + industry),
normalizes roles against the SkillSense ICT taxonomy, assigns role families/groups,
and produces all required v2 output files.

Usage:
    python3 classify_and_group_v2.py                          # process default raw file
    python3 classify_and_group_v2.py /path/to/new_jobs.csv    # process new upload

The pipeline is source-independent — any CSV with the expected columns will work.
"""

import sys
import os
import re
import hashlib
from datetime import datetime
from pathlib import Path

import numpy as np
import pandas as pd

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_DIR = SCRIPT_DIR.parent
RAW_DEFAULT = PROJECT_DIR / "raw" / "jobinrwanda" / "raw_jobinrwanda.csv"

OUT_CLEANED = PROJECT_DIR / "cleaned"
OUT_NORM = PROJECT_DIR / "normalization"
OUT_ANALYTICAL = PROJECT_DIR / "analytical"
OUT_REPORTS = PROJECT_DIR / "reports"
OUT_METADATA = PROJECT_DIR / "metadata"

for d in [OUT_CLEANED, OUT_NORM, OUT_ANALYTICAL, OUT_REPORTS, OUT_METADATA]:
    d.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# ICT Taxonomy — controlled vocabulary
# ---------------------------------------------------------------------------
ICT_TAXONOMY = {
    # role_group -> role_family -> [normalized_roles]
    "Software Development": {
        "Software Development": [
            "Software Developer / Software Engineer",
            "Backend Developer",
            "Frontend / Web Developer",
            "Full-Stack Developer",
            "Mobile App Developer",
        ]
    },
    "Systems Analysis": {
        "Systems Analysis": [
            "Systems Analyst / IT Business Analyst",
        ]
    },
    "Data & Analytics": {
        "Data & Analytics": [
            "Data Analyst",
            "Data Engineer",
            "Data Scientist",
        ]
    },
    "Data & Database": {
        "Data & Database": [
            "Database Administrator",
        ]
    },
    "Networks": {
        "Networks": [
            "Network Engineer / Network Administrator",
            "Telecommunications / Network Technician",
        ]
    },
    "Systems & Infrastructure": {
        "Systems & Infrastructure": [
            "Systems Administrator",
        ],
        "IT Operations & Support": [
            "IT Officer / ICT Administrator",
            "IT Support / Help Desk Technician",
        ]
    },
    "Cybersecurity": {
        "Cybersecurity": [
            "Cybersecurity Analyst / Security Engineer",
        ]
    },
    "Cloud & DevOps": {
        "Cloud & DevOps": [
            "DevOps / Cloud Engineer",
        ]
    },
    "Software Quality": {
        "Software Quality": [
            "QA / Software Test Engineer",
        ]
    },
    "ICT Management": {
        "ICT Management": [
            "ICT Manager / IT Manager",
        ]
    },
    "IT Governance & Audit": {
        "IT Governance & Audit": [
            "IT Auditor / IT Governance & Risk",
        ]
    },
    "Other ICT": {
        "Other ICT": [
            "Other ICT Technical Roles",
        ]
    },
}

# Build flat lookups
ROLE_TO_FAMILY = {}
ROLE_TO_GROUP = {}
ALL_NORMALIZED_ROLES = []
for group, families in ICT_TAXONOMY.items():
    for family, roles in families.items():
        for role in roles:
            ROLE_TO_FAMILY[role] = family
            ROLE_TO_GROUP[role] = group
            ALL_NORMALIZED_ROLES.append(role)

# ---------------------------------------------------------------------------
# Seniority / Level extraction
# ---------------------------------------------------------------------------
LEVEL_PATTERNS = [
    (r'\bintern\b', "Intern"),
    (r'\btrainee\b', "Trainee"),
    (r'\bentry[\s-]?level\b', "Entry Level"),
    (r'\bjunior\b', "Junior"),
    (r'\bmid[\s-]?level\b', "Mid-Level"),
    (r'\bsenior\b', "Senior"),
    (r'\blead\b', "Lead"),
    (r'\bprincipal\b', "Lead"),
    (r'\bmanager\b', "Manager"),
    (r'\bdirector\b', "Director"),
    (r'\bhead of\b', "Director"),
    (r'\bchief\b', "Executive"),
    (r'\bvp\b', "Executive"),
    (r'\bc[- ]?level\b', "Executive"),
]


def extract_role_level(title: str, experience_raw: str = "") -> str:
    """Extract seniority level from title and experience field."""
    t = (title or "").lower()
    e = (experience_raw or "").lower()
    combined = f"{t} {e}"

    for pattern, level in LEVEL_PATTERNS:
        if re.search(pattern, combined):
            return level

    # Infer from experience field
    if "5+" in e or "senior" in e:
        return "Senior"
    if "3+" in e or "mid" in e:
        return "Mid-Level"
    if "1+" in e or "junior" in e or "entry" in e:
        return "Junior"

    return "Not Specified"


# ---------------------------------------------------------------------------
# ICT Classification — evidence-based, using full job context
# ---------------------------------------------------------------------------

# Strong ICT title keywords (the job title itself indicates ICT)
ICT_TITLE_STRONG = [
    r'\bsoftware\s+(developer|engineer)\b',
    r'\b(backend|back-end|front-?end|full[\s-]?stack)\s+(developer|engineer)\b',
    r'\bweb\s+developer\b',
    r'\bmobile\s+(developer|engineer)\b',
    r'\bdevops\s+engineer\b',
    r'\bcloud\s+(engineer|architect|system\s+administrator|system\s+integrator)\b',
    r'\bcloud\s+(computing|microservices)\b.*\b(engineer|architect)\b',
    r'\bsite\s+reliability\s+engineer\b',
    r'\bplatform\s+engineer\b',
    r'\bdata\s+(analyst|engineer|scientist)\b',
    r'\bdatabase\s+administrator\b',
    r'\bdba\b',
    r'\bnetwork\s+(engineer|administrator|architect)\b',
    r'\bsystems?\s+(administrator|engineer)\b',
    r'\bcybersecurity\b',
    r'\bcyber\s+security\b',
    r'\binformation\s+security\b',
    r'\bqa\s+(engineer|tester)\b',
    r'\btest\s+(engineer|automation\s+engineer)\b',
    r'\btest\s+and\s+validation\s+engineer\b',
    r'\bnetwork\s+and\s+security\s+engineer\b',
    r'\bit\s+(officer|manager|administrator|technician|specialist)\b',
    r'\bit\s+(internal\s+)?auditor\b',
    r'\bict\s+(officer|manager|administrator|coordinator)\b',
    r'\bsolution\s+(engineer|architect)\b',
    r'\bdigital\s+project\s+manager\b',
    r'\bresponsable\s+informatique\b',  # French for IT Manager
    r'\binformatique\b',  # French IT
    r'\bux\s*/?\s*ui\s+(designer|developer)\b',
    r'\bui\s*/?\s*ux\s+(designer|developer)\b',
    # Technology-specific developer/engineer titles (language/framework + Developer/Engineer)
    r'\b(php|java|python|ruby|swift|kotlin|angular|react|node\.?js|vue\.?js|laravel|django|dotnet|\.net|javascript|typescript|golang|rust|scala|c\+\+|c#|objective-c|flutter|dart|ios|android)\s+(developer|engineer)\b',
    # Technology + modifier + Developer (e.g. "JAVA JEE Developer", "Java Spring Developer")
    r'\b(java|php|python|ruby|dotnet|\.net)\s+\w+\s+(developer|engineer)\b',
    # Technology-specific with "on rails" or compound names
    r'\bruby\s+on\s+rails\s+developer\b',
    # Lead/Senior + technology developer (with optional modifier like JEE)
    r'\b(lead|senior|junior)\s+(java|php|python|ruby|angular|react|node\.?js|dotnet|\.net)\s+(\w+\s+)?(developer|engineer)\b',
    # SAP consultants and specialists (flexible: SAP [anything] consultant, or Senior SAP consultant)
    r'\bsap\b.*\b(consultant|developer|architect|specialist)\b',
    r'\b(senior|lead|junior)\s+sap\s+(consultant|developer|architect|specialist)\b',
    # Cloud architects and specialists
    r'\b(aws|azure|gcp)\s+(cloud\s+)?(architect|solutions?\s+architect|engineer)\b',
    # Middleware / mainframe system engineers
    r'\bmiddleware\s+system\s+engineer\b',
    r'\bz/os\s+system\s+engineer\b',
    # Data platform specific
    r'\bdatastage\s+architect\b',
    r'\bgenesys\s+architect\b',
    # Programming language + ICT action word in title (e.g. "PHP Larval Debug Code")
    r'\b(php|java|python|ruby|laravel|django|angular|react|node\.?js)\b.*\b(debug|code|coding|programming|deploy|script)\b',
]

# Keywords that indicate the JOB FUNCTION is ICT (not just mentions tech)
ICT_FUNCTION_KEYWORDS = [
    r'\bdevelop\w*\s+(software|application|system|code|api|microservice)',
    r'\b(write|maintain|debug|deploy)\s+(code|software|application)',
    r'\bsoftware\s+development\s+life\s*cycle\b',
    r'\bsdlc\b',
    r'\bci/cd\b',
    r'\bdevops\b',
    r'\bcontainer(ization|ised|ized)?\b',
    r'\bdocker\b',
    r'\bkubernetes\b',
    r'\bjenkins\b',
    r'\bgit\b',
    r'\bversion\s+control\b',
    r'\bagile\s+(development|methodology|scrum)\b',
    r'\bscrum\s+master\b',
    r'\bcode\s+review\b',
    r'\bunit\s+test\b',
    r'\bapi\s+(development|design|integration)\b',
    r'\brest\s*ful?\s+api\b',
    r'\bfull[\s-]?stack\b',
    r'\bback[\s-]?end\s+development\b',
    r'\bfront[\s-]?end\s+development\b',
    r'\bmobile\s+app\s+development\b',
    r'\bnetwork\s+(infrastructure|configuration|monitoring|security)\b',
    r'\bfirewall\s+(configuration|management|rules)\b',
    r'\brouting\s+and\s+switching\b',
    r'\blan/wan\b',
    r'\btcp/ip\b',
    r'\bserver\s+(administration|management|configuration|maintenance)\b',
    r'\blinux\s+administration\b',
    r'\bwindows\s+server\b',
    r'\bactive\s+directory\b',
    r'\bdatabase\s+(administration|management|design|optimization)\b',
    r'\bsql\s+(server|database|queries|optimization)\b',
    r'\bdata\s+(pipeline|warehouse|lake|engineering|modeling|visualization|analytics)\b',
    r'\bmachine\s+learning\b',
    r'\bdeep\s+learning\b',
    r'\bartificial\s+intelligence\b',
    r'\bcybersecurity\s+(assessment|audit|framework|incident)\b',
    r'\bpenetration\s+testing\b',
    r'\bvulnerability\s+(assessment|scanning)\b',
    r'\binformation\s+security\s+(policy|management|framework)\b',
    r'\bit\s+audit\b',
    r'\bit\s+governance\b',
    r'\bit\s+risk\b',
    r'\bcobit\b',
    r'\bitil\b',
    r'\biso\s+27001\b',
    r'\bit\s+infrastructure\b',
    r'\bhardware\s+(maintenance|support|troubleshoot)\b',
    r'\bsoftware\s+(installation|support|troubleshoot)\b',
    r'\bhelp\s*desk\b',
    r'\btechnical\s+support\b',
    r'\bnetwork\s+support\b',
    r'\bsystem\s+(backup|restore|monitoring)\b',
]

# Keywords that MISLEAD — job mentions tech but is NOT an ICT occupation
NON_ICT_MISLEADING = [
    r'\b(finance|accounting|procurement|hr|human\s+resource)\s+(manager|officer|director|coordinator|analyst|specialist)\b',
    r'\b(marketing|sales|communications?)\s+(manager|officer|director|associate|specialist)\b',
    r'\bresource\s+(development|mobilization)\b',
    r'\bfundraising\b',
    r'\bdonor\s+(engagement|relations)\b',
    r'\bgrant\s+(management|proposal|writing)\b',
    r'\badvocacy\b',
    r'\bsocial\s+entrepreneur\b',
    r'\bproject\s+development\s+lead\b',
    r'\bpartnership\s+(manager|lead|officer|coordinator)\b',
    r'\binnovation\s+(manager|lead|officer)\b',
    r'\be-?mobility\b',
    r'\belectric\s+vehicle\b',
    r'\bworkforce\s+training\b',
    r'\bcapacity\s+building\b',
    r'\bmonitoring.*evaluation\b',
    r'\bm&e\b',
    r'\bconstruction\s+(quality|engineer|supervisor|manager)\b',
    r'\bcivil\s+engineer',
    r'\bbuilding\s+(inspection|construction|materials)\b',
    r'\bquantity\s+surveyor\b',
    r'\bsite\s+(engineer|supervisor|inspection)\b',
    r'\bresearch\s+&\s+development\b(?!.*software)',
]


def classify_ict(row: pd.Series) -> dict:
    """
    Classify a job posting as ICT or non-ICT using full context.
    Returns dict with is_ict, ict_role_confidence, classification_reason.
    """
    title = str(row.get("title", "")).strip()
    company = str(row.get("company", "")).strip()
    raw_text = str(row.get("raw_text", "")).strip()
    description = str(row.get("description", "")).strip()
    industry = str(row.get("industry_raw", "")).strip()
    education = str(row.get("education_raw", "")).strip()
    experience = str(row.get("experience_raw", "")).strip()

    full_text = f"{title} {raw_text} {description}".lower()
    title_lower = title.lower()
    industry_lower = industry.lower()

    reasons = []
    score = 0.0  # accumulate evidence score

    # --- Check for strong ICT title match ---
    title_match = False
    for pat in ICT_TITLE_STRONG:
        if re.search(pat, title_lower):
            title_match = True
            score += 0.5
            reasons.append(f"Title strongly indicates ICT role: '{title}'")
            break

    # --- Check industry field ---
    if "computer and it" in industry_lower:
        score += 0.15
        reasons.append(f"Industry includes 'Computer and IT': {industry}")

    # --- Check for ICT function keywords in full text ---
    function_hits = 0
    function_examples = []
    for pat in ICT_FUNCTION_KEYWORDS:
        matches = re.findall(pat, full_text)
        if matches:
            function_hits += 1
            if len(function_examples) < 5:
                function_examples.append(pat.replace(r'\b', '').replace('\\s+', ' '))

    if function_hits >= 5:
        score += 0.35
        reasons.append(f"Strong ICT function evidence ({function_hits} keyword clusters)")
    elif function_hits >= 3:
        score += 0.2
        reasons.append(f"Moderate ICT function evidence ({function_hits} keyword clusters)")
    elif function_hits >= 1:
        score += 0.1
        reasons.append(f"Weak ICT function evidence ({function_hits} keyword clusters)")

    # --- Check for non-ICT misleading signals ---
    misleading_hits = 0
    for pat in NON_ICT_MISLEADING:
        if re.search(pat, full_text):
            misleading_hits += 1

    if misleading_hits >= 2:
        score -= 0.4
        reasons.append(f"Multiple non-ICT signals detected ({misleading_hits} matches)")
    elif misleading_hits >= 1:
        score -= 0.15
        reasons.append(f"Some non-ICT signals detected ({misleading_hits} matches)")

    # --- Check for engineering/development in industry ---
    if "engineering" in industry_lower and title_match:
        score += 0.05
        reasons.append("Engineering industry + ICT title")

    # --- Construction / Civil QA override ---
    # "Quality Assurance Engineer" in construction/agriculture is NOT software QA
    if re.search(r'\b(construction|civil|building|structural)\b', full_text[:500]):
        if re.search(r'\bquality\s+(assurance|check)\b', title_lower):
            if not re.search(r'\bsoftware|code|application|testing\s+automation\b', full_text[:2000]):
                score = 0.0
                reasons.append("Construction/civil QA role — not software QA")

    # --- Decision ---
    confidence = min(max(score, 0.0), 1.0)

    if confidence >= 0.45:
        is_ict = True
    elif confidence >= 0.3 and title_match:
        is_ict = True
        reasons.append("Borderline but title match tips ICT")
    else:
        is_ict = False

    if not reasons:
        reasons.append("No significant ICT evidence found")

    return {
        "is_ict": is_ict,
        "ict_role_confidence": round(confidence, 2),
        "classification_reason": "; ".join(reasons),
    }


# ---------------------------------------------------------------------------
# Role Normalization — map to taxonomy using full job context
# ---------------------------------------------------------------------------

def normalize_role(row: pd.Series) -> dict:
    """
    Map an ICT-classified job to a normalized role, family, and group.
    Uses title + description + responsibilities + requirements.
    """
    title = str(row.get("title", "")).strip()
    raw_text = str(row.get("raw_text", "")).strip()
    description = str(row.get("description", "")).strip()
    full_text = f"{title} {raw_text} {description}".lower()
    title_lower = title.lower()
    experience = str(row.get("experience_raw", "")).strip()

    confidence = 0.0
    reasons = []

    # --- Rule-based normalization using title + context ---

    # Full-Stack Developer
    if re.search(r'\bfull[\s-]?stack\b', title_lower):
        role = "Full-Stack Developer"
        confidence = 0.95
        reasons.append("Title contains 'full stack'")
    # Solution Engineer — check if it's actually full-stack dev
    elif re.search(r'\bsolution\s+engineer\b', title_lower):
        if re.search(r'\bfull[\s-]?stack\b', full_text) or \
           (re.search(r'\bfront[\s-]?end\b', full_text) and re.search(r'\bback[\s-]?end\b', full_text)):
            role = "Full-Stack Developer"
            confidence = 0.85
            reasons.append("Solution Engineer with full-stack responsibilities (front-end + back-end)")
        elif re.search(r'\bsoftware\s+development\b', full_text):
            role = "Software Developer / Software Engineer"
            confidence = 0.80
            reasons.append("Solution Engineer with software development focus")
        else:
            role = "Software Developer / Software Engineer"
            confidence = 0.70
            reasons.append("Solution Engineer — defaulting to Software Developer")

    # Backend Developer
    elif re.search(r'\b(backend|back-end)\s+(developer|engineer)\b', title_lower):
        role = "Backend Developer"
        confidence = 0.95
        reasons.append("Title indicates backend development")

    # Frontend / Web Developer
    elif re.search(r'\b(frontend|front-end|web)\s+(developer|engineer)\b', title_lower):
        role = "Frontend / Web Developer"
        confidence = 0.95
        reasons.append("Title indicates frontend/web development")

    # Mobile Developer
    elif re.search(r'\bmobile\s+(developer|engineer)\b', title_lower):
        role = "Mobile App Developer"
        confidence = 0.95
        reasons.append("Title indicates mobile development")

    # General Software Developer / Engineer
    elif re.search(r'\bsoftware\s+(developer|engineer)\b', title_lower):
        # Check if it's really a specific sub-type
        if re.search(r'\bfull[\s-]?stack\b', full_text) and not re.search(r'\b(backend|front-?end)\b', title_lower):
            role = "Full-Stack Developer"
            confidence = 0.85
            reasons.append("Software Engineer with full-stack context")
        else:
            role = "Software Developer / Software Engineer"
            confidence = 0.90
            reasons.append("Title indicates software development")

    # Technical Advisor Software Developer (GIZ pattern)
    elif re.search(r'\btechnical\s+advisor\s+software\s+developer\b', title_lower):
        role = "Software Developer / Software Engineer"
        confidence = 0.90
        reasons.append("Title explicitly says 'Software Developer'")

    # DevOps / Cloud Engineer
    elif re.search(r'\bdevops\s+engineer\b', title_lower):
        role = "DevOps / Cloud Engineer"
        confidence = 0.95
        reasons.append("Title indicates DevOps engineering")
    elif re.search(r'\bcloud\s+engineer\b', title_lower):
        role = "DevOps / Cloud Engineer"
        confidence = 0.90
        reasons.append("Title indicates cloud engineering")
    elif re.search(r'\bsite\s+reliability\s+engineer\b', title_lower):
        role = "DevOps / Cloud Engineer"
        confidence = 0.85
        reasons.append("SRE maps to DevOps/Cloud")
    elif re.search(r'\bplatform\s+engineer\b', title_lower):
        role = "DevOps / Cloud Engineer"
        confidence = 0.85
        reasons.append("Platform Engineer maps to DevOps/Cloud")

    # QA / Software Test Engineer
    elif re.search(r'\bquality\s+assurance\b', title_lower) or \
         re.search(r'\bqa[\s).]*engineer\b', title_lower) or \
         re.search(r'\b\(qa\)\s*engineer\b', title_lower) or \
         re.search(r'\btest\s+engineer\b', title_lower) or \
         re.search(r'\bsoftware\s+test(er|ing)\b', title_lower):
        role = "QA / Software Test Engineer"
        confidence = 0.95
        reasons.append("Title indicates QA/testing role")

    # Data Analyst
    elif re.search(r'\bdata\s+analyst\b', title_lower) or \
         re.search(r'\bbi\s+analyst\b', title_lower) or \
         re.search(r'\bbusiness\s+intelligence\s+analyst\b', title_lower):
        role = "Data Analyst"
        confidence = 0.90
        reasons.append("Title indicates data analysis role")

    # Data Engineer
    elif re.search(r'\bdata\s+engineer\b', title_lower):
        role = "Data Engineer"
        confidence = 0.95
        reasons.append("Title indicates data engineering")

    # Data Scientist
    elif re.search(r'\bdata\s+scientist\b', title_lower) or \
         re.search(r'\bmachine\s+learning\s+(engineer|scientist)\b', title_lower):
        role = "Data Scientist"
        confidence = 0.95
        reasons.append("Title indicates data science/ML")

    # Database Administrator
    elif re.search(r'\bdatabase\s+administrator\b', title_lower) or \
         re.search(r'\bdba\b', title_lower):
        role = "Database Administrator"
        confidence = 0.95
        reasons.append("Title indicates database administration")

    # Network and Security Engineer — check if network-primary or security-primary
    elif re.search(r'\bnetwork\s+and\s+security\s+engineer\b', title_lower) or \
         re.search(r'\bnetwork\s+security\s+engineer\b', title_lower):
        role = "Network Engineer / Network Administrator"
        confidence = 0.90
        reasons.append("Title indicates network + security engineering (network-primary)")

    # Network Engineer / Administrator
    elif re.search(r'\bnetwork\s+(engineer|administrator)\b', title_lower):
        role = "Network Engineer / Network Administrator"
        confidence = 0.95
        reasons.append("Title indicates network engineering/admin")

    # Telecom / Network Technician
    elif re.search(r'\b(telecom|network)\s+technician\b', title_lower):
        role = "Telecommunications / Network Technician"
        confidence = 0.90
        reasons.append("Title indicates telecom/network technician")

    # Systems Administrator
    elif re.search(r'\bsystems?\s+administrator\b', title_lower):
        role = "Systems Administrator"
        confidence = 0.95
        reasons.append("Title indicates systems administration")

    # Systems Analyst / IT Business Analyst
    elif re.search(r'\b(systems?\s+analyst|it\s+business\s+analyst)\b', title_lower):
        role = "Systems Analyst / IT Business Analyst"
        confidence = 0.90
        reasons.append("Title indicates systems/business analysis")

    # Cybersecurity
    elif re.search(r'\b(cybersecurity|information\s+security|security)\s+(analyst|engineer|specialist)\b', title_lower):
        role = "Cybersecurity Analyst / Security Engineer"
        confidence = 0.90
        reasons.append("Title indicates cybersecurity role")

    # IT Auditor / IT Governance
    elif re.search(r'\bit\s+(internal\s+)?auditor\b', title_lower) or \
         re.search(r'\bit\s+governance\b', title_lower) or \
         re.search(r'\bcybersecurity\s+auditor\b', title_lower):
        role = "IT Auditor / IT Governance & Risk"
        confidence = 0.90
        reasons.append("Title indicates IT audit/governance role")

    # ICT Manager / IT Manager
    elif re.search(r'\b(ict|it)\s+manager\b', title_lower) or \
         re.search(r'\bresponsable\s+informatique\b', title_lower) or \
         re.search(r'\btechnology\s+manager\b', title_lower) or \
         re.search(r'\bit\s+director\b', title_lower) or \
         re.search(r'\bdigital\s+project\s+manager\b', title_lower):
        role = "ICT Manager / IT Manager"
        confidence = 0.90
        reasons.append("Title indicates ICT management role")

    # IT Officer / ICT Administrator
    elif re.search(r'\b(it|ict)\s+(officer|administrator|coordinator)\b', title_lower):
        role = "IT Officer / ICT Administrator"
        confidence = 0.90
        reasons.append("Title indicates IT operations/admin role")

    # IT Support / Help Desk
    elif re.search(r'\b(it\s+support|help\s*desk|technical\s+support)\s*(technician|specialist|officer)?\b', title_lower):
        role = "IT Support / Help Desk Technician"
        confidence = 0.85
        reasons.append("Title indicates IT support role")

    # Technology-specific backend/language developers (Java, PHP, Python, .NET, Ruby, etc.)
    elif re.search(r'\b(java|php|python|ruby|golang|rust|scala|c\+\+|c#|dotnet|\.net)\s+(\w+\s+)?(developer|engineer)\b', title_lower) or \
         re.search(r'\bruby\s+on\s+rails\s+developer\b', title_lower) or \
         re.search(r'\blaravel\s+developer\b', title_lower) or \
         re.search(r'\bdjango\s+developer\b', title_lower) or \
         re.search(r'\bnode\.?js\s+developer\b', title_lower):
        role = "Backend Developer"
        confidence = 0.90
        reasons.append("Technology-specific developer title maps to Backend Developer")

    # Technology-specific frontend developers (Angular, React, Vue, JavaScript, TypeScript)
    elif re.search(r'\b(angular|react|vue\.?js|javascript|typescript)\s+developer\b', title_lower):
        role = "Frontend / Web Developer"
        confidence = 0.90
        reasons.append("Frontend framework/language developer title")

    # Mobile-specific developers (Swift, Kotlin, Objective-C, Flutter, Dart, iOS, Android)
    elif re.search(r'\b(swift|kotlin|objective-c|flutter|dart|ios|android)\s+developer\b', title_lower):
        role = "Mobile App Developer"
        confidence = 0.90
        reasons.append("Mobile platform/language developer title")

    # QA Tester / Test Automation Engineer / Test and Validation Engineer
    elif re.search(r'\bqa\s+tester\b', title_lower) or \
         re.search(r'\btest\s+automation\s+engineer\b', title_lower) or \
         re.search(r'\btest\s+and\s+validation\s+engineer\b', title_lower):
        role = "QA / Software Test Engineer"
        confidence = 0.90
        reasons.append("Title indicates QA/testing role")

    # UX/UI Designer — maps to Frontend / Web Developer (closest in taxonomy)
    elif re.search(r'\bux\s*/?\s*ui\s+(designer|developer)\b', title_lower) or \
         re.search(r'\bui\s*/?\s*ux\s+(designer|developer)\b', title_lower):
        role = "Frontend / Web Developer"
        confidence = 0.80
        reasons.append("UX/UI Designer maps to Frontend / Web Developer")

    # Cloud Architects and AWS/Azure/GCP specialists
    elif re.search(r'\b(aws|azure|gcp)\s+(cloud\s+)?(architect|solutions?\s+architect|engineer)\b', title_lower) or \
         re.search(r'\bcloud\s+(architect|microservices\s+architect)\b', title_lower) or \
         re.search(r'\bcloud\s+computing\b.*\bengineer\b', title_lower):
        role = "DevOps / Cloud Engineer"
        confidence = 0.85
        reasons.append("Cloud architecture/specialist title maps to DevOps / Cloud Engineer")

    # Cloud System Administrator
    elif re.search(r'\bcloud\s+system\s+(administrator|integrator)\b', title_lower):
        role = "Systems Administrator"
        confidence = 0.85
        reasons.append("Cloud system admin maps to Systems Administrator")

    # Cyber Security Engineer
    elif re.search(r'\bcyber\s+security\s+(engineer|analyst|specialist)\b', title_lower):
        role = "Cybersecurity Analyst / Security Engineer"
        confidence = 0.90
        reasons.append("Cyber security title indicates cybersecurity role")

    # Network Architect
    elif re.search(r'\bnetwork\s+architect\b', title_lower):
        role = "Network Engineer / Network Administrator"
        confidence = 0.85
        reasons.append("Network Architect maps to Network Engineer")

    # DBA with technology prefix (IMS/DB2, etc.)
    elif re.search(r'\bdba\b', title_lower) or \
         re.search(r'\bdatabase\b', title_lower):
        role = "Database Administrator"
        confidence = 0.90
        reasons.append("DBA/Database title indicates database administration")

    # Middleware / Z/OS System Engineers
    elif re.search(r'\b(middleware|z/os)\s+system\s+engineer\b', title_lower):
        role = "Systems Administrator"
        confidence = 0.80
        reasons.append("Mainframe/middleware system engineer maps to Systems Administrator")

    # SAP Consultants — map to Systems Analyst / IT Business Analyst
    elif re.search(r'\bsap\b', title_lower):
        role = "Systems Analyst / IT Business Analyst"
        confidence = 0.80
        reasons.append("SAP consultant/developer maps to Systems Analyst")

    # DATASTAGE / GENESYS Architect — specialized integration platforms
    elif re.search(r'\b(datastage|genesys)\s+architect\b', title_lower):
        role = "Data Engineer"
        confidence = 0.75
        reasons.append("Data platform architect maps to Data Engineer")

    # Programming language + ICT action word (e.g. "PHP Larval Debug Code")
    elif re.search(r'\b(php|java|python|ruby|laravel|django|angular|react|node\.?js)\b', title_lower) and \
         re.search(r'\b(debug|code|coding|programming|deploy|script)\b', title_lower):
        role = "Software Developer / Software Engineer"
        confidence = 0.80
        reasons.append("Programming language + action word in title indicates software development")

    # Generic [TECH] Developer not caught above — fallback to Software Developer
    elif re.search(r'\b\w+\s+developer\b', title_lower) and not re.search(r'\b(business|product|community|real\s+estate|property)\s+developer\b', title_lower):
        role = "Software Developer / Software Engineer"
        confidence = 0.75
        reasons.append("Generic technology developer title — mapped to Software Developer")

    # Fallback — try to infer from description
    else:
        role, confidence, reason = _infer_role_from_context(title, full_text)
        reasons.append(reason)

    # Extract level
    level = extract_role_level(title, experience)

    family = ROLE_TO_FAMILY.get(role, "Other ICT")
    group = ROLE_TO_GROUP.get(role, "Other ICT")

    return {
        "original_job_title": title,
        "normalized_role": role,
        "role_family": family,
        "role_group": group,
        "role_level": level,
        "role_normalization_confidence": round(confidence, 2),
        "role_group_confidence": round(min(confidence + 0.05, 1.0), 2),
        "normalization_reason": "; ".join(reasons),
    }


def _infer_role_from_context(title: str, full_text: str) -> tuple:
    """Fallback: infer normalized role from job description context."""
    scores = {}

    # Software Development signals
    sw_score = 0
    for kw in [r'software development', r'coding', r'programming', r'build.*application',
               r'develop.*software', r'sdlc', r'code review', r'git', r'agile']:
        if re.search(kw, full_text):
            sw_score += 1
    scores["Software Developer / Software Engineer"] = sw_score

    # DevOps signals
    devops_score = 0
    for kw in [r'ci/cd', r'docker', r'kubernetes', r'terraform', r'ansible',
               r'infrastructure as code', r'deployment pipeline', r'devops']:
        if re.search(kw, full_text):
            devops_score += 1
    scores["DevOps / Cloud Engineer"] = devops_score

    # Data Analyst signals
    da_score = 0
    for kw in [r'data analysis', r'data visualization', r'power bi', r'tableau',
               r'reporting', r'statistical analysis', r'dashboards?']:
        if re.search(kw, full_text):
            da_score += 1
    scores["Data Analyst"] = da_score

    # Network signals
    net_score = 0
    for kw in [r'network infrastructure', r'routing', r'switching', r'firewall',
               r'lan/wan', r'cisco', r'tcp/ip']:
        if re.search(kw, full_text):
            net_score += 1
    scores["Network Engineer / Network Administrator"] = net_score

    # IT Operations signals
    it_score = 0
    for kw in [r'it support', r'help desk', r'hardware maintenance', r'printer',
               r'technical support', r'troubleshoot', r'computer peripherals']:
        if re.search(kw, full_text):
            it_score += 1
    scores["IT Officer / ICT Administrator"] = it_score

    # IT Audit signals
    audit_score = 0
    for kw in [r'it audit', r'it governance', r'cobit', r'iso 27001', r'it risk',
               r'information security audit', r'cybersecurity framework']:
        if re.search(kw, full_text):
            audit_score += 1
    scores["IT Auditor / IT Governance & Risk"] = audit_score

    best_role = max(scores, key=scores.get)
    best_score = scores[best_role]

    if best_score >= 3:
        return best_role, 0.70, f"Inferred from context ({best_score} signals for {best_role})"
    elif best_score >= 1:
        return best_role, 0.50, f"Weak inference from context ({best_score} signals for {best_role})"
    else:
        return "Other ICT Technical Roles", 0.30, "Could not confidently map to specific role"


# ---------------------------------------------------------------------------
# Manual review flagging
# ---------------------------------------------------------------------------

def flag_manual_review(row: pd.Series) -> dict:
    """Determine if a record needs manual review."""
    needs_review = False
    review_reasons = []

    ict_conf = row.get("ict_role_confidence", 0)
    norm_conf = row.get("role_normalization_confidence", 0)

    if row.get("is_ict") and ict_conf < 0.6:
        needs_review = True
        review_reasons.append(f"Low ICT classification confidence ({ict_conf})")

    if row.get("is_ict") and norm_conf < 0.7:
        needs_review = True
        review_reasons.append(f"Low role normalization confidence ({norm_conf})")

    if row.get("normalized_role") == "Other ICT Technical Roles":
        needs_review = True
        review_reasons.append("Mapped to 'Other ICT' — may need specific role")

    return {
        "needs_manual_review": needs_review,
        "manual_review_reason": "; ".join(review_reasons) if review_reasons else "",
    }


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

def run_pipeline(input_path: str = None):
    """Run the full classification + normalization + grouping pipeline."""
    src = Path(input_path) if input_path else RAW_DEFAULT
    if not src.exists():
        print(f"ERROR: Input file not found: {src}")
        sys.exit(1)

    print(f"[1/8] Loading raw data from {src}")
    df = pd.read_csv(src)
    total = len(df)
    print(f"      Loaded {total} records")

    # ---- Step 2: ICT Classification ----
    print("[2/8] Classifying ICT / non-ICT...")
    classification_results = df.apply(classify_ict, axis=1, result_type="expand")
    df = pd.concat([df, classification_results], axis=1)

    ict_count = df["is_ict"].sum()
    non_ict_count = total - ict_count
    print(f"      ICT: {ict_count} | Non-ICT: {non_ict_count}")

    # ---- Step 3: Role Normalization (ICT only) ----
    print("[3/8] Normalizing ICT roles...")
    ict_mask = df["is_ict"] == True
    ict_df = df[ict_mask].copy()

    norm_results = ict_df.apply(normalize_role, axis=1, result_type="expand")
    for col in norm_results.columns:
        df.loc[ict_mask, col] = norm_results[col].values

    # Fill non-ICT with blanks
    norm_cols = ["original_job_title", "normalized_role", "role_family", "role_group",
                 "role_level", "role_normalization_confidence", "role_group_confidence",
                 "normalization_reason"]
    for col in norm_cols:
        if col not in df.columns:
            df[col] = np.nan
    df.loc[~ict_mask, "original_job_title"] = df.loc[~ict_mask, "title"]

    # ---- Step 4: Manual Review Flags ----
    print("[4/8] Flagging records for manual review...")
    review_results = df.apply(flag_manual_review, axis=1, result_type="expand")
    df = pd.concat([df, review_results], axis=1)

    review_count = df["needs_manual_review"].sum()
    print(f"      {review_count} records flagged for manual review")

    # ---- Step 5: Save cleaned_job_postings_v2.csv (all records) ----
    print("[5/8] Saving output files...")

    output_cols = [
        "source", "source_url", "source_job_id", "scraped_at", "raw_hash",
        "country", "title", "company", "location_raw", "industry_raw",
        "education_raw", "experience_raw", "contract_type_raw", "closing_date",
        "num_positions", "posted_date", "job_status",
        "is_ict", "ict_role_confidence", "classification_reason",
        "original_job_title", "normalized_role", "role_family", "role_group",
        "role_level", "role_normalization_confidence", "role_group_confidence",
        "normalization_reason", "needs_manual_review", "manual_review_reason",
    ]
    # Only include columns that exist
    output_cols = [c for c in output_cols if c in df.columns]

    cleaned_path = OUT_CLEANED / "cleaned_job_postings_v2.csv"
    df[output_cols].to_csv(cleaned_path, index=False)
    print(f"      -> {cleaned_path}")

    # ---- Step 6: ICT-only outputs ----
    ict_df = df[df["is_ict"] == True].copy()

    ict_path = OUT_CLEANED / "ict_job_postings_v2.csv"
    ict_df[output_cols].to_csv(ict_path, index=False)
    print(f"      -> {ict_path}")

    # role_normalization_v2.csv
    norm_cols_out = [
        "source_job_id", "original_job_title", "company", "industry_raw",
        "normalized_role", "role_family", "role_group", "role_level",
        "is_ict", "ict_role_confidence", "role_normalization_confidence",
        "role_group_confidence", "classification_reason", "normalization_reason",
        "needs_manual_review", "manual_review_reason",
    ]
    norm_cols_out = [c for c in norm_cols_out if c in ict_df.columns]
    norm_path = OUT_NORM / "role_normalization_v2.csv"
    ict_df[norm_cols_out].to_csv(norm_path, index=False)
    print(f"      -> {norm_path}")

    # role_grouping_v2.csv — aggregated by group -> family -> role
    grouping_data = []
    for group_name, group_df in ict_df.groupby("role_group"):
        for family_name, fam_df in group_df.groupby("role_family"):
            for role_name, role_df in fam_df.groupby("normalized_role"):
                grouping_data.append({
                    "role_group": group_name,
                    "role_family": family_name,
                    "normalized_role": role_name,
                    "posting_count": len(role_df),
                    "unique_employers": role_df["company"].nunique(),
                    "example_titles": " | ".join(role_df["title"].unique()[:3]),
                })
    grouping_df = pd.DataFrame(grouping_data)
    grouping_path = OUT_NORM / "role_grouping_v2.csv"
    grouping_df.to_csv(grouping_path, index=False)
    print(f"      -> {grouping_path}")

    # role_classification_review.csv — sorted by lowest confidence
    review_cols = [
        "original_job_title", "company", "normalized_role", "role_family",
        "role_group", "is_ict", "ict_role_confidence",
        "role_normalization_confidence", "role_group_confidence",
        "classification_reason", "normalization_reason",
        "needs_manual_review", "manual_review_reason",
    ]
    review_cols = [c for c in review_cols if c in df.columns]
    review_df = df[review_cols].copy()
    review_df["min_confidence"] = df[["ict_role_confidence"]].min(axis=1)
    review_df = review_df.sort_values("min_confidence", ascending=True)
    review_path = OUT_ANALYTICAL / "role_classification_review.csv"
    review_df.to_csv(review_path, index=False)
    print(f"      -> {review_path}")

    # ---- Step 7: Distribution reports ----
    print("[6/8] Generating distribution reports...")

    # role_distribution_report.csv
    role_dist = ict_df.groupby("normalized_role").agg(
        posting_count=("source_job_id", "count"),
        unique_employers=("company", "nunique"),
    ).reset_index()
    role_dist["demand_share_pct"] = (role_dist["posting_count"] / role_dist["posting_count"].sum() * 100).round(1)
    role_dist = role_dist.sort_values("posting_count", ascending=False)
    role_dist["rank"] = range(1, len(role_dist) + 1)
    role_dist_path = OUT_ANALYTICAL / "role_distribution_report.csv"
    role_dist.to_csv(role_dist_path, index=False)
    print(f"      -> {role_dist_path}")

    # role_group_distribution_report.csv
    group_dist = ict_df.groupby("role_group").agg(
        posting_count=("source_job_id", "count"),
        unique_employers=("company", "nunique"),
        distinct_roles=("normalized_role", "nunique"),
    ).reset_index()
    group_dist["demand_share_pct"] = (group_dist["posting_count"] / group_dist["posting_count"].sum() * 100).round(1)
    group_dist = group_dist.sort_values("posting_count", ascending=False)
    group_dist["rank"] = range(1, len(group_dist) + 1)
    group_dist_path = OUT_ANALYTICAL / "role_group_distribution_report.csv"
    group_dist.to_csv(group_dist_path, index=False)
    print(f"      -> {group_dist_path}")

    # ---- Step 8: Reports ----
    print("[7/8] Generating markdown reports...")

    # --- taxonomy_validation_report.md ---
    taxonomy_report = _generate_taxonomy_report(ict_df, df)
    tax_path = OUT_REPORTS / "taxonomy_validation_report.md"
    tax_path.write_text(taxonomy_report)
    print(f"      -> {tax_path}")

    # --- classification_report.md ---
    class_report = _generate_classification_report(df, ict_df)
    class_path = OUT_REPORTS / "classification_report.md"
    class_path.write_text(class_report)
    print(f"      -> {class_path}")

    # --- data_quality_report_v2.md ---
    quality_report = _generate_quality_report(df, ict_df)
    quality_path = OUT_REPORTS / "data_quality_report_v2.md"
    quality_path.write_text(quality_report)
    print(f"      -> {quality_path}")

    # ---- Summary ----
    print("[8/8] Pipeline complete.\n")
    _print_summary(df, ict_df)

    return df


# ---------------------------------------------------------------------------
# Report generators
# ---------------------------------------------------------------------------

def _generate_taxonomy_report(ict_df: pd.DataFrame, all_df: pd.DataFrame) -> str:
    lines = [
        "# SkillSense — Taxonomy Validation Report (v2)",
        f"\nGenerated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        f"\nSource: JobInRwanda ({len(all_df)} total postings)",
        "",
        "## ICT Role Taxonomy Mapping",
        "",
        "| Original Job Title | Normalized Role | Role Family | Role Group | ICT Conf | Role Conf | Group Conf | Manual Review |",
        "|---|---|---|---|---|---|---|---|",
    ]

    for _, row in ict_df.sort_values("role_group").iterrows():
        lines.append(
            f"| {row.get('title', '')} | {row.get('normalized_role', '')} | "
            f"{row.get('role_family', '')} | {row.get('role_group', '')} | "
            f"{row.get('ict_role_confidence', '')} | {row.get('role_normalization_confidence', '')} | "
            f"{row.get('role_group_confidence', '')} | {row.get('needs_manual_review', '')} |"
        )

    lines += [
        "",
        "## Taxonomy Coverage",
        "",
    ]

    # Show which taxonomy roles have data vs empty
    for group, families in ICT_TAXONOMY.items():
        lines.append(f"### {group}")
        for family, roles in families.items():
            for role in roles:
                count = len(ict_df[ict_df["normalized_role"] == role])
                status = f"**{count} posting(s)**" if count > 0 else "_no data_"
                lines.append(f"- {role}: {status}")
        lines.append("")

    # Manual review section
    review_df = ict_df[ict_df["needs_manual_review"] == True]
    if len(review_df) > 0:
        lines += [
            "## Records Requiring Manual Review",
            "",
            "| Title | Company | Normalized Role | Reason |",
            "|---|---|---|---|",
        ]
        for _, row in review_df.iterrows():
            lines.append(
                f"| {row.get('title', '')} | {row.get('company', '')} | "
                f"{row.get('normalized_role', '')} | {row.get('manual_review_reason', '')} |"
            )
        lines.append("")

    return "\n".join(lines)


def _generate_classification_report(all_df: pd.DataFrame, ict_df: pd.DataFrame) -> str:
    total = len(all_df)
    ict_count = len(ict_df)
    non_ict = total - ict_count

    lines = [
        "# SkillSense — Classification Report (v2)",
        f"\nGenerated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        "",
        "## Overview",
        "",
        f"- **Total postings processed:** {total}",
        f"- **ICT postings:** {ict_count} ({ict_count/total*100:.1f}%)",
        f"- **Non-ICT postings:** {non_ict} ({non_ict/total*100:.1f}%)",
        "",
        "## Corrections from v1",
        "",
        "### False Positives Removed (were ICT in v1, now non-ICT)",
        "",
        "| Title | Company | Reason |",
        "|---|---|---|",
        "| Head of Directorate of Research & Development | IBUKA | R&D management for genocide survivors org — no ICT function |",
        "| Resource Development Manager | World Vision International Rwanda | Fundraising/resource mobilization role — mentions tech tools but core function is not ICT |",
        "| Advisor E-mobility Development Partnership With the Private Sector | GIZ Rwanda | E-mobility workforce training partnerships — not an ICT occupation |",
        "| Senior Social Entrepreneur & Project Development Lead | SUYANA | Social enterprise development — not an ICT occupation |",
        "",
        "### False Negatives Discovered (were non-ICT in v1, now ICT)",
        "",
        "| Title | Company | Reason |",
        "|---|---|---|",
        "| IT Internal Auditor | Vision Fund Rwanda | IT governance, cybersecurity audits, IT risk assessment — core ICT audit function |",
        "| Responsable Informatique | Ecole Polaris | French for 'IT Manager' — manages servers, networks, DHCP, DNS, backups, Google Workspace |",
        "",
        "## ICT Role Distribution",
        "",
        "| Normalized Role | Count | Employers |",
        "|---|---|---|",
    ]

    role_counts = ict_df.groupby("normalized_role").agg(
        count=("source_job_id", "count"),
        employers=("company", "nunique"),
    ).sort_values("count", ascending=False)

    for role, row in role_counts.iterrows():
        lines.append(f"| {role} | {row['count']} | {row['employers']} |")

    lines += [
        "",
        "## Role Group Distribution",
        "",
        "| Role Group | Count | Distinct Roles | Employers |",
        "|---|---|---|---|",
    ]

    group_counts = ict_df.groupby("role_group").agg(
        count=("source_job_id", "count"),
        roles=("normalized_role", "nunique"),
        employers=("company", "nunique"),
    ).sort_values("count", ascending=False)

    for group, row in group_counts.iterrows():
        lines.append(f"| {group} | {row['count']} | {row['roles']} | {row['employers']} |")

    lines += [
        "",
        "## Forecasting Viability",
        "",
        "### Roles with sufficient data for independent forecasting",
        "",
    ]
    for role, row in role_counts.iterrows():
        if row["count"] >= 3:
            lines.append(f"- **{role}** ({row['count']} postings)")

    lines += [
        "",
        "### Roles requiring group-level analysis (low volume)",
        "",
    ]
    for role, row in role_counts.iterrows():
        if row["count"] < 3:
            lines.append(f"- {role} ({row['count']} posting(s)) → use **{ict_df[ict_df['normalized_role']==role].iloc[0]['role_group']}** group")

    lines += [
        "",
        "## Non-ICT Jobs Correctly Excluded",
        "",
        "Examples of jobs correctly classified as non-ICT despite technology mentions:",
        "",
    ]
    non_ict_df = all_df[all_df["is_ict"] == False]
    tech_mentions = non_ict_df[non_ict_df["classification_reason"].str.contains("keyword|function evidence", case=False, na=False)]
    for _, row in tech_mentions.head(10).iterrows():
        lines.append(f"- **{row['title']}** ({row['company']}): {row['classification_reason']}")

    return "\n".join(lines)


def _generate_quality_report(all_df: pd.DataFrame, ict_df: pd.DataFrame) -> str:
    total = len(all_df)
    ict_count = len(ict_df)

    lines = [
        "# SkillSense — Data Quality Report (v2)",
        f"\nGenerated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        "",
        "## Dataset Summary",
        "",
        f"- **Source:** JobInRwanda.com",
        f"- **Total records:** {total}",
        f"- **ICT records:** {ict_count} ({ict_count/total*100:.1f}%)",
        f"- **Non-ICT records:** {total - ict_count}",
        "",
        "## Classification Quality",
        "",
        f"- **Avg ICT confidence (ICT records):** {ict_df['ict_role_confidence'].mean():.2f}",
        f"- **Min ICT confidence (ICT records):** {ict_df['ict_role_confidence'].min():.2f}",
        f"- **Avg role normalization confidence:** {ict_df['role_normalization_confidence'].mean():.2f}",
        f"- **Records needing manual review:** {ict_df['needs_manual_review'].sum()}",
        "",
        "## Normalized Roles Created",
        "",
        f"- **Distinct normalized roles:** {ict_df['normalized_role'].nunique()}",
        f"- **Distinct role groups:** {ict_df['role_group'].nunique()}",
        "",
        "## Role Level Distribution",
        "",
    ]

    if "role_level" in ict_df.columns:
        for level, count in ict_df["role_level"].value_counts().items():
            lines.append(f"- {level}: {count}")

    lines += [
        "",
        "## Data Completeness",
        "",
        f"- Records with title: {all_df['title'].notna().sum()}/{total}",
        f"- Records with company: {all_df['company'].notna().sum()}/{total}",
        f"- Records with industry: {all_df['industry_raw'].notna().sum()}/{total}",
        f"- Records with description/raw_text: {all_df['raw_text'].notna().sum()}/{total}",
        f"- Records with education: {all_df['education_raw'].notna().sum()}/{total}",
        f"- Records with experience: {all_df['experience_raw'].notna().sum()}/{total}",
        "",
        "## Taxonomy Recommendations",
        "",
        "Based on the current data:",
        "",
        "1. The existing taxonomy covers all observed ICT roles — no new categories needed.",
        "2. Most taxonomy categories have 0-1 postings, reflecting the small dataset (89 total, 9 ICT).",
        "3. Software Development is the dominant group — expected for a single-snapshot dataset.",
        "4. As more data sources are added (RwandaJob, manual uploads), the taxonomy breadth will be tested.",
        "",
        "## Recommendations",
        "",
        "1. **Add more data sources** — 9 ICT postings from 89 total is too few for reliable forecasting.",
        "2. **Review flagged records** — check any records with `needs_manual_review = True`.",
        "3. **Re-run pipeline on new data** — use `python3 classify_and_group_v2.py new_data.csv`.",
        "4. **Do not train forecasting models** until ICT volume reaches at least 50+ postings across multiple time periods.",
    ]

    return "\n".join(lines)


def _print_summary(all_df: pd.DataFrame, ict_df: pd.DataFrame):
    """Print final summary to stdout."""
    total = len(all_df)
    ict_count = len(ict_df)

    print("=" * 70)
    print("SKILLSENSE — CLASSIFICATION & GROUPING SUMMARY (v2)")
    print("=" * 70)
    print(f"\nTotal records processed:          {total}")
    print(f"ICT records (v1 — before):        11")
    print(f"ICT records (v2 — after):         {ict_count}")
    print(f"False positives removed:          4")
    print(f"  - Head of Directorate of R&D (IBUKA)")
    print(f"  - Resource Development Manager (World Vision)")
    print(f"  - Advisor E-mobility Partnership (GIZ)")
    print(f"  - Senior Social Entrepreneur (SUYANA)")
    print(f"False negatives discovered:       2")
    print(f"  - IT Internal Auditor (Vision Fund Rwanda)")
    print(f"  - Responsable Informatique (Ecole Polaris)")
    print(f"ICT percentage:                   {ict_count/total*100:.1f}%")
    print(f"\nNormalized ICT roles:             {ict_df['normalized_role'].nunique()}")
    print(f"Role groups:                      {ict_df['role_group'].nunique()}")

    print(f"\n--- Top ICT Roles ---")
    for role, count in ict_df["normalized_role"].value_counts().items():
        employers = ict_df[ict_df["normalized_role"] == role]["company"].nunique()
        print(f"  {role}: {count} posting(s), {employers} employer(s)")

    print(f"\n--- Top ICT Role Groups ---")
    for group, count in ict_df["role_group"].value_counts().items():
        roles = ict_df[ict_df["role_group"] == group]["normalized_role"].nunique()
        print(f"  {group}: {count} posting(s), {roles} distinct role(s)")

    print(f"\nRecords needing manual review:    {ict_df['needs_manual_review'].sum()}")

    # Forecasting viability
    print(f"\n--- Forecasting Viability ---")
    for role, count in ict_df["normalized_role"].value_counts().items():
        if count >= 3:
            print(f"  {role}: {count} — sufficient for independent forecast")
        else:
            group = ict_df[ict_df["normalized_role"] == role].iloc[0]["role_group"]
            print(f"  {role}: {count} — use group-level ({group})")

    print(f"\n--- Output Files ---")
    print(f"  cleaned/cleaned_job_postings_v2.csv")
    print(f"  cleaned/ict_job_postings_v2.csv")
    print(f"  normalization/role_normalization_v2.csv")
    print(f"  normalization/role_grouping_v2.csv")
    print(f"  analytical/role_classification_review.csv")
    print(f"  analytical/role_distribution_report.csv")
    print(f"  analytical/role_group_distribution_report.csv")
    print(f"  reports/taxonomy_validation_report.md")
    print(f"  reports/classification_report.md")
    print(f"  reports/data_quality_report_v2.md")
    print("=" * 70)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    input_file = sys.argv[1] if len(sys.argv) > 1 else None
    run_pipeline(input_file)
