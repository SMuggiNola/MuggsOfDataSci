// ======================================================
// ui_navigation.js — Dynamic JSON-driven activity builder
// with draft retrieval + auto-load
// ======================================================

import { verifyLogin } from "./auth_check.js";
import { saveDraft, submitFinal } from "./draft_submit.js";

export async function initActivity(activityJSONPath, authJSONPath) {
  // ---------- Load Activity JSON ----------
  let activity;
  try {
    const res = await fetch(activityJSONPath, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status} loading activity JSON`);
    activity = await res.json();
  } catch (err) {
    console.error("❌ Could not load activity JSON:", err);
    document.getElementById("app").innerHTML =
      `<p style="color:red">Could not load activity file.<br>${err}</p>`;
    return;
  }

  // ---------- State ----------
  let username = "", pin = "", screen = 0;
  const answers = {};
  const app = document.getElementById("app");

  // ---------- Helper: load draft ----------
  async function loadDraft(username, activity_id) {
    // check localStorage first
    const localKey = `draft_${username}_${activity_id}`;
    const local = localStorage.getItem(localKey);
    if (local) return JSON.parse(local);

    // fallback: Cloudflare KV
    try {
      const res = await fetch(`https://muggsofdatasci.net/student/${username}`);
      if (res.ok) {
        const all = await res.json();
        const match = all.find(
          d => d.activity_id === activity_id && d.draft
        );
        return match || null;
      }
    } catch (err) {
      console.warn("⚠️ Could not fetch draft from Cloudflare:", err);
    }
    return null;
  }

  // ---------- Screens ----------
  const stages = [
    renderLanding,
    ...activity.sections.map(sec => () => renderSection(sec)),
    renderAfterword
  ];

  function show(n) {
    screen = n;
    stages[n]();
  }

  // ---------- Screen 0 — Landing ----------
  function renderLanding() {
    app.innerHTML = `
      <h1>${activity.title}</h1>
      <p style="max-width:800px;margin:auto;">${activity.instructions.overview}</p>
      <p style="margin-top:1rem;"><em>${activity.instructions.mechanics}</em></p>
      <div style="margin-top:1.5rem;">
        <button id="beginBtn">Begin Inquiry</button>
        <button id="retrieveBtn">📂 Retrieve Draft</button>
      </div>
    `;

    async function handleLogin(loadExisting) {
      username = prompt("Enter your username:")?.trim();
      pin = prompt("Enter your PIN:")?.trim();
      if (!username || !pin) return alert("Login cancelled.");
      const ok = await verifyLogin(authJSONPath, username, pin);
      if (!ok) return;

      // Auto-load draft if exists or if explicitly requested
      const draft = await loadDraft(username, activity.activity_id);
      if (draft && draft.responses) {
        Object.assign(answers, draft.responses);
        alert("✅ Previous draft loaded.");
      } else if (loadExisting) {
        alert("⚠️ No saved draft found for this user.");
      }

      show(1);
    }

    document.getElementById("beginBtn").onclick = () => handleLogin(false);
    document.getElementById("retrieveBtn").onclick = () => handleLogin(true);
  }

  // ---------- Core Writing Screens ----------
  function renderSection(sec) {
    const key = sec.id;
    app.innerHTML = `
      <h2>${sec.title}</h2>
      <p style="max-width:800px;margin:auto;">${sec.prompt}</p>
      <textarea id="textInput">${answers[key] || ""}</textarea>
      <div class="reminder">${activity.instructions.reminder}</div>
      <div>
        ${screen > 1 ? `<button id="backBtn">← Back</button>` : ""}
        <button id="saveBtn">💾 Save Draft</button>
        <button id="nextBtn">Next →</button>
      </div>
    `;

    document.getElementById("textInput").oninput = e =>
      (answers[key] = e.target.value);

    if (document.getElementById("backBtn"))
      document.getElementById("backBtn").onclick = () => show(screen - 1);

    document.getElementById("saveBtn").onclick = () =>
      saveDraft(username, pin, activity.activity_id, answers);

    document.getElementById("nextBtn").onclick = () => show(screen + 1);
  }

  // ---------- Final Screen ----------
  function renderAfterword() {
    app.innerHTML = `
      <h2>What Happens Next?</h2>
      <p style="max-width:800px;margin:auto;">
        ${activity.reflection_instructions || ""}
      </p>
      <p class="reminder">${activity.instructions.reminder}</p>
      <div>
        <button id="submitBtn">✅ Submit Final</button>
        <button id="returnBtn">⬅️ Return to DSFP Portal</button>
      </div>
    `;

    document.getElementById("submitBtn").onclick = () =>
      submitFinal(username, pin, activity.activity_id, answers);

    document.getElementById("returnBtn").onclick = () =>
      (window.location.href = "../dsfp.html");
  }

  // ---------- Start ----------
  show(0);
}
