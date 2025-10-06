# 🧩 Classwork Integration Layer  
**Path:** `C:\MuggsOfDataSci\pages\classwork_assessments\classwork\`

This folder defines the **shared logic and data pipeline** for all classwork activities (e.g., Workslop, Reading Checks, Data Labs).  
Each activity lives in its own subfolder but connects here for:
- authentication (username / PIN),
- submission storage (local or online),
- and progress tracking (via KV database).

This folder acts as the **central integration layer** that ties together:
1. The **front-end HTML activity pages**  
2. The **Cloudflare Workers KV backend**  
3. The **local file save pipeline** (for lab mode)

---

## 🧠 Purpose

The goal is to **standardize data flow** for every activity.

Each classwork activity:
- Loads its questions from a local `activity.json`
- Uses a common submission schema
- Sends data to **one universal worker endpoint**
- Saves a mirrored copy locally when in lab mode

This lets every student submission—regardless of activity—  
flow through the same logic and be aggregated by `activity_id`.

---

## 🗂️ Folder Structure

classwork/
│
├── workslop/
│ ├── index.html
│ ├── activity.json
│ ├── save_local.js
│ ├── save_cloudflare.js
│ └── submissions/ ← local copies of student attempts
│
├── scripts/
│ ├── ping_lab_status.js ← detects if user is on lab network
│ ├── submit_pipeline.js ← core submission handler
│ ├── auth.js ← username + pin validation
│ ├── kv_post_template.js ← reusable Cloudflare Worker post logic
│ ├── score_activity.js ← optional grading/scoring helper
│ └── utils.js ← shared helper functions
│
└── readme.md ← (this file)


---

## ⚙️ The Data Flow

### 🧭 Step 1: Student Launches Activity
Each activity (like `workslop/index.html`) asks the student to:
1. Enter their username (and later, PIN)
2. Load randomized questions from `activity.json`
3. Complete and submit

---

### 🧾 Step 2: Activity Generates a Submission Package

Every submission—regardless of activity type—  
creates a **standardized JSON object** like this:

```json
{
  "username": "sea.mug",
  "activity_id": "CW1_WORKSLOP",
  "timestamp": "2025-10-05T15:32:00Z",
  "mode": "lab", 
  "score": 8,
  "responses": {
    "1": "Workslop",
    "2": "41%",
    "3": "It transfers cognitive labor...",
    "11": "Students should..."
  }
}

Step 3: Pipeline Decides Where to Save

The ping script (ping_lab_status.js) checks whether the student is on a lab computer (by pinging the teacher rig).

Mode	Save Location	Description
Lab Mode	Local folder (JSON file)	Stored in workslop/submissions/ or global C:\MuggsOfDataSci\submissions\
Online Mode	Cloudflare KV	Sent to the Cloudflare Worker endpoint via fetch()

This allows the same activity to work seamlessly offline or online.

☁️ Step 4: Cloudflare KV Storage

Each submission is saved under a key formatted as:
activity:{activity_id}:user:{username}:{timestamp}

Example:activity:CW1_WORKSLOP:user:sea.mug:2025-10-05T15:32:00Z

This structure makes it simple to:

Pull all attempts for a student

Pull all data for a single activity

Aggregate class-level analytics

All Cloudflare storage happens via a shared KV Worker (submit_pipeline.js + kv_post_template.js).

💾 Step 5: Local Mirroring (for Reliability)

Even if the internet is available, the system can:

Save a local .json copy as a backup

Attempt to upload to Cloudflare when next online

This makes it network-resilient — no student loses work due to connectivity issues.

🧩 Why activity_id Is the Core Key

The activity_id in every activity.json acts as the anchor for:

Identifying which questions were used

Linking responses to the correct source

Enabling scoring and progress tracking

Matching submissions across multiple attempts

Without the activity_id, the backend can’t distinguish
which set of questions or reflection prompts were used.

Think of it as the primary key for your entire classwork dataset.

🧰 Shared Scripts Overview
Script	Purpose
ping_lab_status.js	Pings teacher-rig.local or similar to detect lab mode.
auth.js	Validates username/PIN pairs using local JSON or future KV lookup.
submit_pipeline.js	Orchestrates submission saving (local or Cloudflare).
kv_post_template.js	Template for POSTing data to Cloudflare Worker.
score_activity.js	Auto-scores multiple-choice questions if answers exist in activity.json.
save_local.js	Saves submission JSON files locally under /submissions/.
utils.js	Helper for timestamps, UUIDs, and error handling.
📡 Cloudflare Worker Overview

The Cloudflare Worker handles:

POST requests from student activities

Validation and sanitization of data

Saving key-value pairs to the KV namespace

Each Worker endpoint is universal and activity-agnostic:
POST https://classwork-submit.muggsdata.workers.dev

All logic (lab vs online) happens client-side,
so the Worker simply stores what it receives.

🧱 Example Folder Duplication for New Activities

To create a new classwork activity:

Duplicate an existing folder like workslop/

Change the activity.json with new content and unique activity_id

Keep the same index.html structure

Connect it to the shared submission logic in classwork/scripts/

This pattern ensures every activity uses the same pipeline but stays modular and portable.

🧭 Long-Term Goal

Once Cloudflare Workers and local saving are both active:

All classwork submissions will follow one universal schema

The Cloudflare KV store becomes the single source of truth

Local saves act as secure backups and offline fallbacks

Every activity in the course will be plug-and-play within this framework

This creates a consistent, inspectable, and exportable record
of every student's progress through the Data Science curriculum.

In summary:
This classwork directory is the backbone of your local + online submission architecture.
Each activity plugs into it through its activity_id, ensuring every piece of student work is captured, scored, and synchronized — whether in the lab or on the web.