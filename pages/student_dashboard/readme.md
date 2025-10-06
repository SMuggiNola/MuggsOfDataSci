# 🧩 My Submitted Work — Student Portal (Concept Overview)

## Overview
This subpage will serve as the **Student Work Portal**, where students can log in using their **username + PIN** and view **all work they’ve ever submitted** — whether it was completed:
- 🖥️ **In class** on the local network  
- ☁️ **At home** through the Cloudflare Worker  
- 💾 Or merged later from local and cloud sources into a unified GitHub dataset  

This system connects the **three major data layers** of the Muggs of Data Science ecosystem:  
**Node.js (local save server) → Cloudflare DB (online mirror) → GitHub (canonical archive)**

---

## System Design

### 1️⃣ Local Save Server (Classroom LAN)
- Built in **Node.js / Express**
- Runs on the teacher rig (e.g., `192.168.x.x:8080`)
- Handles `/save` and `/student/:username` routes
- Automatically writes `.json` files into a `/submissions` folder on the rig

Each file follows a **standardized JSON schema**, e.g.:
```json
{
  "username": "jaydenlee",
  "activity_id": "workslop_01",
  "activity_type": "classwork",
  "timestamp": "2025-10-06T15:42:10Z",
  "responses": {...},
  "reflections": {...},
  "score": {"percent": 85}
}

2️⃣ Cloudflare KV / D1 Database (Off-Campus Mirror)

The same data schema is used for at-home submissions

Students working off-campus save data via a Cloudflare Worker endpoint (/save)

Each submission is stored as a KV entry keyed by username_activityid_timestamp

Cloudflare can later export all entries to JSON for merging

3️⃣ GitHub Repo (Canonical Archive)

A private GitHub repo (e.g. SMuggiNola/MuggsOfDataSci-Submissions) serves as the canonical dataset

The teacher rig runs a Python merge + sync script that:

Reads local submissions and Cloudflare exports

Combines them into merged_submissions.json

Commits and pushes the result to the private repo

This ensures all work, from any location, exists in one synchronized and versioned dataset.

Automation Cycle
Time	Action	Description
Before class	merge_and_publish.py	Syncs Cloudflare → Local → GitHub
During class	Local Node saves	Submissions written to rig instantly
Between classes	Manual or dashboard “Sync” button	Refreshes student work view
End of day	Auto-merge and Git push	Nightly archival and GitHub update
After sync	Cloudflare Pages rebuild	Website updates automatically
The Student Portal Page

Page goal:
Allow students to log in with username and PIN and view their entire submission history in one place.

Core workflow:

Student visits /my_submitted_work

Enters credentials → verified via users.json

Website fetches data from:

Local server endpoint (/student/<username>) if on LAN

or

GitHub-hosted JSON dataset (via REST API or raw file link)

Displays all activities with:

Activity ID / Type / Timestamp

Score summary

Reflections (expandable)

Later upgrades may include:

Downloading all personal data as .json or .csv

Progress charts across quarters

Filtering by classwork, assessments, or DSFP stages

Optional language toggle (English/Spanish)

Key Principles
Principle	Purpose
Offline-first	Works even with no internet access
Same JSON schema everywhere	Guarantees merge compatibility
Automation	Merges & pushes occur without manual steps
Transparency	Students can see all their submissions, anywhere
Version control	GitHub provides an immutable record of progress
Next Steps

 Finalize standardized JSON schema across activities

 Set up Node.js save server on teacher rig

 Create /student/:username endpoint

 Deploy Cloudflare Worker for off-campus saves

 Automate Python merge + Git push

 Build and style student.html login + dashboard page

 Connect website subpage to GitHub dataset for real-time display

Long-Term Goal:

Every student can log into the Muggs of Data Science site — from any device, anywhere — and view a complete, timestamped, versioned history of their learning journey, powered by the same data pipeline that runs the classroom.