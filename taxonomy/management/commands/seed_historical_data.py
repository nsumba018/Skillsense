import random
from django.core.management.base import BaseCommand
from taxonomy.models import NormalizedRole, HistoricalDemand, MacroIndicator


MACRO_DATA = {
    2003: (5.2, 3.1), 2004: (6.0, 3.5), 2005: (7.1, 4.0),
    2006: (7.6, 4.8), 2007: (8.0, 5.2), 2008: (7.2, 5.5),
    2009: (6.3, 5.8), 2010: (8.4, 6.2), 2011: (8.2, 6.8),
    2012: (8.8, 7.1), 2013: (7.5, 7.5), 2014: (7.0, 8.0),
    2015: (6.9, 8.6), 2016: (5.9, 9.0), 2017: (6.1, 9.5),
    2018: (8.6, 10.2), 2019: (9.4, 11.0), 2020: (-3.4, 8.5),
    2021: (10.9, 12.0), 2022: (8.2, 13.5), 2023: (7.8, 14.8),
    2024: (7.2, 15.5),
}

BASE_DEMAND = {
    "Software Developer": 120, "Data Scientist": 60, "Network Engineer": 80,
    "Cybersecurity Analyst": 50, "Cloud Engineer": 30, "DevOps Engineer": 25,
    "Mobile App Developer": 55, "UI/UX Designer": 45, "Data Analyst": 70,
    "Database Administrator": 40, "AI/ML Engineer": 20, "IT Project Manager": 65,
    "Systems Administrator": 75, "Business Intelligence Analyst": 35,
    "ERP Consultant": 30, "IT Support Specialist": 90,
    "Digital Marketing Specialist": 50, "Telecommunications Engineer": 45,
    "Technical Writer": 25, "Information Security Officer": 30,
}


class Command(BaseCommand):
    help = "Seed 22 years of historical demand + macro indicators (2003–2024)"

    def handle(self, *args, **kwargs):
        # Seed macro indicators
        for year, (gdp, ict) in MACRO_DATA.items():
            MacroIndicator.objects.get_or_create(
                year=year,
                defaults={"gdp_growth_rate": gdp, "ict_sector_growth": ict}
            )

        # Seed historical demand
        roles = {r.normalized_title: r for r in NormalizedRole.objects.all()}
        created = 0
        for title, base in BASE_DEMAND.items():
            role = roles.get(title)
            if not role:
                continue
            for i, year in enumerate(sorted(MACRO_DATA.keys())):
                growth = 1 + (i * 0.07) + random.uniform(-0.05, 0.1)
                count = max(1, int(base * growth))
                _, is_new = HistoricalDemand.objects.get_or_create(
                    role=role, year=year,
                    defaults={"job_postings_count": count, "source": "synthetic_seed"}
                )
                if is_new:
                    created += 1

        self.stdout.write(self.style.SUCCESS(
            f"Historical data seeded: {created} records created."
        )) 


        