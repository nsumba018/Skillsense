"""Turn free-text job-posting locations into Rwanda province / district."""

PROVINCES = ['Kigali City', 'Northern', 'Southern', 'Eastern', 'Western']

DISTRICTS_BY_PROVINCE = {
    'Kigali City': ['Gasabo', 'Kicukiro', 'Nyarugenge'],
    'Northern': ['Burera', 'Gakenke', 'Gicumbi', 'Musanze', 'Rulindo'],
    'Southern': ['Gisagara', 'Huye', 'Kamonyi', 'Muhanga', 'Nyamagabe', 'Nyanza', 'Nyaruguru', 'Ruhango'],
    'Eastern': ['Bugesera', 'Gatsibo', 'Kayonza', 'Kirehe', 'Ngoma', 'Nyagatare', 'Rwamagana'],
    'Western': ['Karongi', 'Ngororero', 'Nyabihu', 'Nyamasheke', 'Rubavu', 'Rusizi', 'Rutsiro'],
}

_DISTRICT_TO_PROVINCE = {d.lower(): (p, d) for p, ds in DISTRICTS_BY_PROVINCE.items() for d in ds}

# Well-known localities that appear in postings but are not district names.
_LOCALITY_ALIASES = {
    'butaro': ('Northern', 'Burera'),
    'kigali': ('Kigali City', None),
    'kigali city': ('Kigali City', None),
    'remera': ('Kigali City', 'Gasabo'),
    'kacyiru': ('Kigali City', 'Gasabo'),
    'kimironko': ('Kigali City', 'Gasabo'),
    'kanombe': ('Kigali City', 'Kicukiro'),
    'nyabugogo': ('Kigali City', 'Nyarugenge'),
    'gisenyi': ('Western', 'Rubavu'),
    'cyangugu': ('Western', 'Rusizi'),
    'butare': ('Southern', 'Huye'),
    'ruhengeri': ('Northern', 'Musanze'),
    'byumba': ('Northern', 'Gicumbi'),
    'kibungo': ('Eastern', 'Ngoma'),
}

UNSPECIFIED_DISTRICT = 'District not specified'


def locate(location_raw):
    """Return (province, district or None) for a posting location, or None if it isn't a place in Rwanda
    (e.g. "Rwanda", "Full Remote", empty)."""
    if not location_raw:
        return None
    text = location_raw.lower().replace('/', ',').replace(';', ',')
    for part in (p.strip() for p in text.split(',')):
        if part in _DISTRICT_TO_PROVINCE:
            return _DISTRICT_TO_PROVINCE[part]
        if part in _LOCALITY_ALIASES:
            return _LOCALITY_ALIASES[part]
    return None
