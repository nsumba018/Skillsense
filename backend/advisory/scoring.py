"""
Skill matching and readiness scoring for the advisory app.

Mirrors the client-side logic in frontend_pages/src/data/auca-skills.ts so the API and the UI agree.
"""
import re
from functools import lru_cache

from .skills_data import INNOVATION_COURSES, ROLES, ROLE_BY_NAME


def is_skill_taught(skill, taught):
    """Whole-word match, so "C" never matches "Cloud". Names of two characters or fewer match exactly only."""
    lower = skill.lower()
    for t in taught:
        tl = t.lower()
        if tl == lower:
            return True
        if len(tl) <= 2 or len(lower) <= 2:
            continue
        if re.search(rf'\b{re.escape(tl)}\b', lower) or re.search(rf'\b{re.escape(lower)}\b', tl):
            return True
    return False


def has_skill(student_skills, required):
    return is_skill_taught(required, student_skills)


def score_role(student_skills, role_name):
    """Return (score 0-100, matched, missing) for one catalogue role."""
    role = ROLE_BY_NAME.get(role_name)
    if not role or not role['skills']:
        return 0.0, [], []
    matched = [s for s in role['skills'] if has_skill(student_skills, s)]
    missing = [s for s in role['skills'] if s not in matched]
    return round(len(matched) / len(role['skills']) * 100, 1), matched, missing


def best_course_for(skills):
    """The Innovation Center course covering the most of `skills`, or None."""
    best = None
    for course, c in INNOVATION_COURSES.items():
        covers = [s for s in skills if any(is_skill_taught(s, [cs]) for cs in c['skills'])]
        if covers and (best is None or len(covers) > len(best[1])):
            best = (course, covers)
    return best


def assess(student_skills, target_role):
    """Score a student against `target_role`; returns the fields stored on an Assessment."""
    score, matched, missing = score_role(student_skills, target_role)

    alternatives = sorted(
        (
            {'role': r['name'], 'score': score_role(student_skills, r['name'])[0]}
            for r in ROLES if r['name'] != target_role
        ),
        key=lambda a: -a['score'],
    )
    alternatives = [a for a in alternatives if a['score'] > 0][:3]

    recs = []
    if not missing:
        recs.append(f'Fully matched for {target_role}. Focus on projects, a portfolio and applications.')
    else:
        recs.append(
            f'{round(score)}% ready for {target_role}. '
            f'To get past 90%, focus on {" and ".join(missing[:2])}.'
        )
        course = best_course_for(missing)
        if course:
            name, covers = course
            more = ' and more' if len(covers) > 4 else ''
            recs.append(f"The Innovation Center's {name} course covers {', '.join(covers[:4])}{more}.")
        if matched:
            recs.append(f'Build on what you already have: {", ".join(matched[:3])}.')
    if alternatives and alternatives[0]['score'] > score:
        recs.append(f"{alternatives[0]['role']} is a closer match today ({alternatives[0]['score']}%). Worth a conversation.")

    return {
        'target_role': target_role,
        'readiness_score': score,
        'matched_skills': matched,
        'missing_skills': missing,
        'recommendations': recs,
        'alternative_roles': alternatives,
    }


@lru_cache(maxsize=1)
def _skill_patterns():
    """One compiled pattern per catalogue skill, for reading skills out of posting text."""
    patterns = {}
    for r in ROLES:
        for s in r['skills']:
            if s in patterns:
                continue
            variants = {s, *(v.strip() for v in re.split(r'[()/]', s))}
            variants = [v for v in variants if len(v) > 2]
            if variants:
                alt = '|'.join(re.escape(v.lower()) for v in variants)
                patterns[s] = re.compile(rf'(?<![a-z0-9])(?:{alt})(?![a-z0-9])')
    return patterns


def extract_skills(text):
    """Catalogue skills whose names appear in free text (a posting's title / description)."""
    hay = (text or '').lower()
    return [s for s, p in _skill_patterns().items() if p.search(hay)]


def role_for_title(title):
    """Best catalogue role whose name appears in a posting title (longest name wins)."""
    t = (title or '').lower()
    best = None
    for r in ROLES:
        n = r['name'].lower()
        if (n in t or n.replace('-', ' ') in t) and (best is None or len(n) > len(best['name'])):
            best = r
    return best
