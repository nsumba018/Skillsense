# Data Directory

This folder contains all datasets used by SkillSense, from raw scraped job postings to NISR Labour Force Survey microdata.

## Folder Structure

| Folder | Size | Description |
|---|---|---|
| `raw/` | 7.6 MB | Raw scraped job postings from 5 Rwandan job boards (1,015 listings) |
| `cleaned/` | 144 KB | Deduplicated and standardised postings with normalised fields |
| `classified/` | 6.6 MB | All postings classified into 9 economic sectors |
| `all_postings/` | 76 KB | Final merged dataset used by the platform (919 unique postings) |
| `normalization/` | 32 KB | Role normalisation mappings (raw titles → 22 standardised roles) |
| `role_taxonomy/` | 40 KB | Role group distributions and classification review |
| `analytical/` | 84 KB | Analysis-ready datasets: role × region, role × skill, monthly trends |
| `historical/` | 256 KB | ICT and sector employment history (2005–2025) for ML training |
| `Labour_Force_Survey__2017-2024___Microdata/` | 241 MB | Official NISR LFS microdata (2017–2024, quarterly rounds) |
| `scripts/` | 304 KB | Python ETL scripts for scraping, cleaning, classifying, and loading |
| `reports/` | 32 KB | Data quality and taxonomy validation reports |

## Data Sources

### 1. NISR Labour Force Surveys (2017–2024)

Official labour market microdata from the National Institute of Statistics of Rwanda. The survey measures employment, unemployment, labour force participation, and other work-related characteristics across Rwanda.

- **Source:** [NISR Microdata Portal](https://microdata.statistics.gov.rw/)
- **Coverage:** National, quarterly rounds (2019–2024), bi-annual (2017–2018)
- **Population:** Individuals aged 16+ in private households
- **Location:** `Labour_Force_Survey__2017-2024___Microdata/datasets/`

### 2. Job Board Postings (5 sources)

Job listings scraped from five Rwandan employment websites:

| Job Board | Postings | Location |
|---|---|---|
| BrighterMonday Rwanda | 467 | `raw/brightermonday/` |
| JobInRwanda | 241 | `raw/jobinrwanda/` |
| RwandaJob | 121 | `raw/rwandajob/` |
| JobWebRwanda | 45 | `raw/` (in combined CSV) |
| GreatRwandaJobs | 45 | `raw/greatrwandajobs/` |

All sources are combined into `raw/combined_raw_all_sources.csv` (1,015 rows before deduplication).

### 3. Historical Employment Data

Sector-level employment history (2005–2025) compiled from NISR annual reports, World Bank indicators, and ICT sector surveys. Used as training features for the ML forecasting model.

- **Location:** `historical/`

## Data Pipeline

```
raw/  →  cleaned/  →  classified/  →  all_postings/
 │                                         │
 │         normalization/                   ▼
 │         role_taxonomy/           analytical/
 │                                         │
 └──── historical/ ──────────────▶  ML model training
       LFS microdata/
```

1. **Scrape** — Collect listings from 5 job boards (`scripts/etl_pipeline.py`)
2. **Clean** — Deduplicate, standardise fields, remove noise (`cleaned/`)
3. **Classify** — Assign each posting to one of 9 sectors (`scripts/classify_sectors.py`)
4. **Normalise** — Map raw job titles to 22 standardised roles (`normalization/`)
5. **Analyse** — Generate cross-tabulations for dashboards (`analytical/`)
6. **Load** — Import into PostgreSQL for the Django API (`scripts/load_sector_employment.py`)

## Sector Distribution

| Sector | Postings | Share |
|---|---|---|
| Services & Commerce | 378 | 41% |
| ICT | 198 | 22% |
| Finance & Insurance | 117 | 13% |
| Engineering & Construction | 68 | 7% |
| Healthcare | 42 | 5% |
| Agriculture | 41 | 4% |
| Development & NGO | 33 | 4% |
| Education | 31 | 3% |
| Government & Public Admin | 11 | 1% |

## Key Files

| File | Description |
|---|---|
| `raw/combined_raw_all_sources.csv` | All raw postings merged (1,015 rows) |
| `cleaned/cleaned_job_postings_v2.csv` | Cleaned and standardised postings |
| `classified/classified_all_sectors.csv` | Postings with sector labels |
| `all_postings/cleaned_job_postings_v2.csv` | Final dataset loaded into the platform |
| `analytical/data_dictionary.csv` | Field definitions for all columns |
| `historical/sector_employment_history_2010_2025.csv` | Sector employment time series |
| `scripts/etl_pipeline.py` | Main ETL orchestration script |

## Notes

- The NISR LFS microdata (~241 MB) is included for reproducibility. If too large for your connection, the platform runs without it — the job posting data is sufficient for the dashboards.
- Raw JSON scraping archives are excluded via `.gitignore` (only CSVs are tracked).
- All data processing is reproducible via the scripts in `scripts/`.
