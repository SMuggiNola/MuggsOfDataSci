# 🧩 Activity Setup Guide — “Core Four” Update

Each new activity in **Muggs of Data Science** runs on the same four core files.  
When creating or updating an activity, here’s what to change and what to leave alone.

---

## ⚙️ The Core Four

| File | Purpose | Update Needed? |
|------|----------|----------------|
| **1️⃣ activity.json** | Holds all the questions, objectives, and reflection prompts for the activity. | ✅ **Yes — always** |
| **2️⃣ index.html** | The student-facing activity page with title, directions, resource links, and the “Start Activity” button. | ✅ **Yes — always** |
| **3️⃣ submit.js** | Handles question logic (2 per section, ordered), reflections, scoring, and submission to Cloudflare. | ✅ **Yes — replace with latest version** |
| **4️⃣ save_to_cloudflare.js** | Sends submission data to your Cloudflare Worker for storage. | ❌ **No — already perfect** |

---

## 🧠 What To Do for Each New Activity

1. **Duplicate** a previous activity folder (for example, `CW1_WORKSLOP`)  
   → Rename it for your new topic (e.g., `CW2_DATACENTERS`).

2. **Replace or edit:**
   - `activity.json` → add your new title, objective, and questions (Sections 1–6).  
   - `index.html` → update the page title, directions, and **resource links** (article, PDF, or video).  
   - `submit.js` → use the latest version that selects *2 questions per section* while keeping chronological order.

3. **Keep:**  
   - `save_to_cloudflare.js` exactly as it is. It already handles submissions correctly.

---

## 🌐 Don’t Forget the Landing Page

After creating a new activity folder, **update your main Classwork landing page**  
(e.g., `classwork/index.html`) to include a new link or button like:

```html
<a href="CW2_DATACENTERS/index.html" class="activity-link">
  CW2 — Exposing the Dark Side of America's AI Data Center Explosion
</a>
