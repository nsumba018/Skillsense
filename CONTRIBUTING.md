# SkillSense — Team Development Guide

**How to get the project, work on features, and push your changes.**

This guide assumes you have **Git** installed and a **GitHub account** with access to the repository.

---

## 1. First-Time Setup (Do This Once)

### Step 1: Clone the repository

Open your terminal and run:

```bash
git clone https://github.com/nsumba018/Skillsense.git
```

This downloads the entire project to your computer. A folder called `Skillsense` will appear.

### Step 2: Enter the project folder

```bash
cd Skillsense
```

### Step 3: Switch to the develop branch

The `develop` branch is our **integration branch** — it has the latest combined code from everyone.

```bash
git checkout develop
```

### Step 4: Verify you are on develop

```bash
git branch
```

You should see:

```
* develop
  main
```

The `*` means you are on `develop`. You are now ready.

---

## 2. Before Starting Any New Work

**Every time** you sit down to work, pull the latest changes first. Other team members may have merged new features since you last worked.

```bash
git checkout develop
git pull origin develop
```

This ensures your local `develop` is up to date with GitHub.

---

## 3. Create a Feature Branch

**Never work directly on `develop` or `main`.** Always create a new branch for your feature.

### Naming convention

Use this format:

```
feature/<short-description>
```

Examples:

```
feature/ml-model
feature/django-backend
feature/career-advisor-dashboard
feature/csv-upload
feature/employability-scoring
```

### Create and switch to your branch

```bash
git checkout -b feature/your-feature-name
```

For example, if you are building the Django backend:

```bash
git checkout -b feature/django-backend
```

You are now on your own branch. Everything you do here is isolated — it will not affect `develop` or anyone else's work.

---

## 4. Do Your Work

Write your code, create files, make changes — whatever your task requires.

You can check what you have changed at any time:

```bash
git status
```

This shows:
- **Red files** = modified or new but not staged
- **Green files** = staged and ready to commit

---

## 5. Save Your Work (Stage + Commit)

### Stage your changes

To stage specific files:

```bash
git add path/to/file1 path/to/file2
```

To stage everything you changed:

```bash
git add .
```

### Commit with a clear message

```bash
git commit -m "Add Django project setup with accounts and taxonomy apps"
```

**Good commit messages** describe what you did:

```
Add user authentication with JWT tokens
Create role taxonomy database models
Fix CSV upload failing on empty rows
Update dashboard to show forecast charts
```

**Bad commit messages:**

```
fix stuff
update
changes
asdfgh
```

### You can commit multiple times

You do not need to finish everything in one commit. Commit as you go:

```bash
# After setting up the database models
git add .
git commit -m "Add database models for accounts and taxonomy"

# After adding the API endpoints
git add .
git commit -m "Add REST API endpoints for role taxonomy"

# After writing tests
git add .
git commit -m "Add unit tests for taxonomy API"
```

---

## 6. Push Your Branch to GitHub

When you are ready to share your work (or just want a backup on GitHub):

```bash
git push origin feature/your-feature-name
```

For example:

```bash
git push origin feature/django-backend
```

The first time you push a new branch, Git may ask you to set the upstream. If so, run:

```bash
git push -u origin feature/your-feature-name
```

After this, your branch is visible on GitHub.

---

## 7. Let the Team Lead Know

After pushing your branch, notify the team lead (Nsumba) that your feature branch is ready.

**The team lead will:**
1. Review your code on GitHub
2. Create a Pull Request from your branch into `develop`
3. Merge it into `develop`

**You do NOT merge into `develop` yourself.** Only the team lead merges.

---

## 8. After Your Branch Is Merged

Once the team lead has merged your branch into `develop`, update your local copy:

```bash
git checkout develop
git pull origin develop
```

Now your local `develop` has your changes plus everyone else's.

To start new work, go back to **Step 3** (create a new feature branch from `develop`).

---

## Quick Reference Card

| Task | Command |
|------|---------|
| Clone the repo (first time) | `git clone https://github.com/nsumba018/Skillsense.git` |
| Switch to develop | `git checkout develop` |
| Pull latest changes | `git pull origin develop` |
| Create a feature branch | `git checkout -b feature/your-feature-name` |
| Check what changed | `git status` |
| Stage all changes | `git add .` |
| Commit changes | `git commit -m "Your message"` |
| Push your branch | `git push origin feature/your-feature-name` |
| See all branches | `git branch -a` |
| See commit history | `git log --oneline` |

---


---

## Rules for the Team

1. **Never push directly to `develop` or `main`** — always use a feature branch
2. **Pull from `develop` before creating a new branch** — so you start from the latest code
3. **Write clear commit messages** — your teammates need to understand what you did
4. **One feature per branch** — do not mix unrelated work in the same branch
5. **Do not commit secrets** — no passwords, API keys, or `.env` files (they are in `.gitignore`)
6. **Do not commit `node_modules/`** — it is in `.gitignore`, just run `npm install` after cloning
7. **Ask if you are unsure** — it is better to ask than to break something

---

## Project Branches

| Branch | Purpose | Who merges here |
|--------|---------|-----------------|
| `main` | Production-ready releases | Team lead only |
| `develop` | Integration branch — latest combined code | Team lead only (via PRs) |
| `feature/*` | Individual feature work | Each team member creates and pushes their own |

---

After cloning, to set up the frontend:

```bash
cd frontend_pages
npm install
npm run dev
```

