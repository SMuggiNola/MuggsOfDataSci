# 🧩 “Workslop” as the Reportype Prototype

The **Workslop activity** is not only the first completed lesson—it’s also the **reference model** (prototype) for all future *reportypes* in the Data Science course ecosystem.

---

## 🔧 What “Reportype” Means

A **reportype** (report + archetype) is a *modular, reproducible format* for an entire category of student activity.  
Each reportype defines:
- Its **data schema** (how student work is structured)
- Its **logic flow** (how the student interacts, submits, and gets feedback)
- Its **storage method** (how data is saved locally or to Cloudflare)
- Its **scoring logic** (how accuracy and completeness are computed)
- Its **reflection logic** (how students produce written synthesis)

In short: a **reportype = template + behavior pattern**.

---

## 🧱 The “Workslop” Reportype Structure

| Layer | Description |
|--------|-------------|
| **Front-End (index.html)** | Unified HTML interface. Contains Start button, randomized question logic, reflections, and scoring display. |
| **Activity Definition (activity.json)** | The content blueprint. Includes all questions, groups, answers, and reflection prompts. |
| **Local Save Logic (Node/Python)** | Receives submissions and saves as structured JSON to `C:\MuggsOfDataSci\submissions\...`. |
| **Future Cloud Save (Cloudflare Worker)** | Mirrors local save behavior for online access. |
| **Meta Data Model** | All submissions use a standardized key structure: `username`, `activity_id`, `timestamp`, `responses`, `reflections`, `score`. |
| **Reflection Requirement** | Every reportype enforces minimum written reflection (≥2 of 3). |
| **Multi-Attempt Flexibility** | Students can retry activities; each attempt is logged separately. |

---

## 🧠 Why “Workslop” Is the Template

The **Workslop** activity was chosen as the prototype because it naturally integrates:
- Critical reading of a real-world article  
- Ethical reflection on AI-assisted work  
- Structured multiple-choice comprehension  
- Open-ended synthesis writing  
- Measurable scoring + flexible repetition  

This makes it the **perfect foundational test case** for replicating the structure across other topics.

---

## 🪜 How Future Reportypes Will Build on This

Each new reportype will follow the same structure, but adapt its content and scoring behavior:

| Future Reportype | Focus | Data Collected | Example |
|-------------------|--------|----------------|----------|
| **Reading/Analysis** | Comprehension + reasoning | Selected answers + reflection | Another HBR or academic text |
| **Data Interpretation** | Spreadsheet → AI → Chart | Uploaded CSVs + answers | Excel-based lab check |
| **Survey & Attitude Study** | Likert responses + reflection | Form results | Behavioral data collection project |
| **Experiment Summary** | Procedure + results | Observation + model output | FPV water panel test reflection |
| **Capstone Progress Report** | Narrative + data updates | Text + numeric metrics | DSFP checkpoints |

Each reportype:
- Loads its own `activity.json`  
- Uses the same `index.html` logic and save pipeline  
- Produces the same kind of submission file for centralized analysis  

---

## 🗂️ Naming Convention for Reportypes

Each reportype folder follows:
C:\MuggsOfDataSci\pages\classwork_assessments\classwork<reportype_name>\


| Folder | Purpose |
|--------|----------|
| `workslop` | The original prototype reportype |
| `reading_analysis` | Text + comprehension + reflection |
| `data_lab` | Spreadsheet analysis + MCQs + short response |
| `survey_interpret` | Behavioral data interpretation |
| `capstone_report` | Project tracking + reflection summary |

All share the same `index.html`, differing only in the `activity.json` file.

---

## 🧩 Advantages of the Reportype Model

✅ **Standardized Data Schema**  
Every submission across all activities can be parsed and visualized the same way.  

✅ **Reproducible Scoring**  
Auto-grading logic is consistent across modules.  

✅ **Offline + Online Parity**  
Same logic works whether data saves to a folder or to Cloudflare KV.  

✅ **Scalable Development**  
New reportypes = new content files, not new codebases.  

✅ **Easy Teacher Control**  
Each folder is self-contained and versionable through GitHub.  

---

## 🧭 Next Steps to Expand Reportypes

| Step | Description |
|------|--------------|
| **1.** | Finalize Workslop local save and login logic (prototype complete). |
| **2.** | Clone Workslop folder to create a new reportype (e.g., “reading_analysis”). |
| **3.** | Swap in a new article + activity.json. |
| **4.** | Reuse same Node save server and submission schema. |
| **5.** | Add Cloudflare Worker endpoint for future internet saving. |

---

## 🧠 Long-Term Vision

The **Workslop reportype** becomes the **“parent class”** for all future activity types in your system.

Future modules—Data Labs, Project Reports, Reflective Journals, or Surveys—will all inherit from this base logic:
- Consistent authentication  
- Consistent saving  
- Consistent reflection structure  
- Modular question delivery  
- Uniform JSON schema  

This creates a unified, inspectable dataset of all student interactions with AI across your course and eventually the entire Data Science program.

---

> **In short:**  
> “Workslop” isn’t just a lesson.  
> It’s the *reportype blueprint* — the reference model for how AI-enhanced, offline-compatible student activities should behave and save data across your entire classroom ecosystem.
