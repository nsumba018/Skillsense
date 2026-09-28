"""
ICT skills lexicon used to read a curriculum: each skill lists the words that reveal it in a course
title/description and the ICT roles it supports (role names match the taxonomy).
"""
import re

BD = 'Backend Developer'
FE = 'Frontend / Web Developer'
FS = 'Full-Stack Developer'
MOB = 'Mobile App Developer'
SWE = 'Software Developer / Software Engineer'
QA = 'QA / Software Test Engineer'
DA = 'Data Analyst'
DE = 'Data Engineer'
DS = 'Data Scientist'
DBA = 'Database Administrator'
SYS = 'Systems Administrator'
NET = 'Network Engineer / Network Administrator'
SUP = 'IT Support / Help Desk Technician'
ITO = 'IT Officer / ICT Administrator'
DEVOPS = 'DevOps / Cloud Engineer'
SEC = 'Cybersecurity Analyst / Security Engineer'
AUD = 'IT Auditor / IT Governance & Risk'
MGR = 'ICT Manager / IT Manager'
SA = 'Systems Analyst / IT Business Analyst'
OTHER = 'Other ICT Technical Roles'

# (skill, [words that reveal it], [roles it supports])
LEXICON = [
    ('Programming fundamentals', ['programming', 'algorithms', 'data structures', 'object-oriented', 'object oriented', 'oop'], [SWE, BD, FS, MOB]),
    ('Python', ['python'], [BD, DS, DE, DA]),
    ('Java', ['java'], [BD, SWE, MOB]),
    ('JavaScript / TypeScript', ['javascript', 'typescript', 'node.js', 'nodejs'], [FE, FS, BD]),
    ('Web development', ['web development', 'web design', 'html', 'css', 'responsive design'], [FE, FS]),
    ('Front-end frameworks', ['react', 'angular', 'vue'], [FE, FS]),
    ('APIs & web services', ['rest api', 'restful', 'web services', 'microservices', 'api development'], [BD, FS]),
    ('Server-side frameworks', ['django', 'flask', 'spring boot', 'laravel', 'asp.net', '.net'], [BD, FS]),
    ('Mobile development', ['android', 'ios', 'flutter', 'react native', 'mobile app', 'mobile development'], [MOB]),
    ('Software engineering practice', ['software engineering', 'software design', 'design patterns', 'agile', 'scrum', 'version control', 'git', 'software development'], [SWE, BD, FS, QA]),
    ('Software testing', ['software testing', 'test automation', 'selenium', 'quality assurance', 'unit testing', 'testing'], [QA]),
    ('Databases & SQL', ['sql', 'database', 'databases', 'mysql', 'postgresql', 'dbms', 'nosql'], [DBA, BD, DA, DE]),
    ('Database administration', ['database administration', 'backup and recovery', 'database tuning', 'database management'], [DBA]),
    ('Data analysis', ['data analysis', 'data analytics', 'statistics', 'excel', 'spreadsheet'], [DA, DS]),
    ('Data visualization', ['data visualization', 'data visualisation', 'power bi', 'tableau', 'dashboard', 'business intelligence'], [DA]),
    ('Machine learning', ['machine learning', 'deep learning', 'neural network', 'artificial intelligence', 'data mining', 'data science'], [DS]),
    ('Big data & ETL', ['big data', 'hadoop', 'spark', 'etl', 'data pipeline', 'data warehouse', 'data engineering'], [DE]),
    ('Computer networking', ['computer networks', 'networking', 'tcp/ip', 'routing', 'switching', 'cisco', 'ccna', 'lan', 'wan'], [NET, SYS]),
    ('Telecommunications', ['telecommunication', 'telecommunications', 'wireless'], [NET]),
    ('Operating systems & administration', ['operating systems', 'operating system', 'linux', 'windows server', 'unix', 'system administration', 'active directory'], [SYS, ITO]),
    ('Cloud computing', ['cloud computing', 'cloud', 'aws', 'azure', 'google cloud', 'virtualization', 'virtualisation'], [DEVOPS, SYS]),
    ('DevOps & automation', ['devops', 'docker', 'kubernetes', 'ci/cd', 'continuous integration', 'infrastructure as code', 'terraform', 'ansible'], [DEVOPS]),
    ('Cybersecurity', ['cybersecurity', 'cyber security', 'information security', 'network security', 'cryptography', 'ethical hacking', 'penetration testing', 'security'], [SEC]),
    ('IT governance & risk', ['it governance', 'risk management', 'cobit', 'iso 27001', 'compliance', 'it audit', 'auditing'], [AUD, SEC, MGR]),
    ('IT support & hardware', ['technical support', 'help desk', 'troubleshooting', 'computer hardware', 'hardware', 'computer maintenance', 'end-user support'], [SUP, ITO]),
    ('ICT administration', ['ict administration', 'it operations', 'office automation', 'ict policy', 'it administration'], [ITO]),
    ('IT service management', ['itil', 'service management', 'service desk'], [ITO, MGR]),
    ('Project management', ['project management', 'pmp', 'prince2'], [MGR, SA]),
    ('ICT management & strategy', ['ict management', 'it management', 'it strategy', 'digital transformation', 'e-government'], [MGR]),
    ('Systems analysis & design', ['systems analysis', 'system analysis', 'systems design', 'requirements engineering', 'business analysis', 'uml', 'use case', 'information systems'], [SA]),
    ('Emerging & embedded tech', ['iot', 'internet of things', 'embedded systems', 'robotics', 'blockchain'], [OTHER]),
]

SKILL_ROLES = {skill: roles for skill, _, roles in LEXICON}
ROLE_SKILLS = {}
for _skill, _, _roles in LEXICON:
    for _role in _roles:
        ROLE_SKILLS.setdefault(_role, set()).add(_skill)

_PATTERNS = [
    (skill, re.compile(r'(?<![\w])(' + '|'.join(re.escape(a) for a in aliases) + r')(?![\w])', re.IGNORECASE))
    for skill, aliases, _ in LEXICON
]


def extract_skills(text):
    """ICT skills found in a course title/description."""
    return {skill for skill, pattern in _PATTERNS if pattern.search(text or '')}
