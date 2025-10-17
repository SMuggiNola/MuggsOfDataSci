// ======================================================
// ui_navigation.js — JSON-driven activity builder
// Auto-loads drafts + inline button handling
// ======================================================

import { verifyLogin } from "./auth_check.js";
import { saveDraft, submitFinal } from "./draft_submit.js";

export async function initActivity(activityJSONPath, authJSONPath) {
  document.addEventListener("DOMContentLoaded", () => start(activityJSONPath, authJSONPath));
}

async function start(activityJSONPath, authJSONPath) {
  const app = document.getElementById("app");
  if (!app) {
    console.error("❌ #app not found in document.");
    return;
  }

  // ---------- Load Activity JSON ----------
  let activity;
  try {
    const res = await fetch(activityJSONPath, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status} loading activity JSON`);
    activity = await res.json();
  } catch (err) {
    app.innerHTML = `<p style="color:red">Could not load activity JSON.<br>${err}</p>`;
    return;
  }

  let username = "", pin = "", screen = 0;
  const answers = {};

  // ---------- Load draft helper ----------
  async function loadDraft(username, activity_id) {
    const localKey = `draft_${username}_${activity_id}`;
    const local = localStorage.getItem(localKey);
    if (local) return JSON.parse(local);

    try {
      const res = await fetch(`https://muggsofdatasci.net/student/${username}`);
      if (res.ok) {
        const all = await res.json();
        const match = all.find(d => d.activity_id === activity_id && d.draft);
        return match || null;
      }
    } catch (err) {
      console.warn("⚠️ Could not fetch draft from Cloudflare:", err);
    }
    return null;
  }

  // ---------- Renderers ----------
  const stages = [
    renderLogin,
    ...activity.sections.map(sec => () => renderSection(sec)),
    renderAfterword
  ];

  function show(n) {
    screen = n;
    window.scrollTo({ top: 0, behavior: "smooth" });
    stages[n]();
  }

  // ---------- Login Screen ----------
  function renderLogin() {
    app.innerHTML = `
      <div style="text-align:center;">
        <h1>${activity.title}</h1>
        <p style="max-width:800px;margin:auto;">${activity.instructions.overview}</p>
        <p style="margin-top:1rem;"><em>${activity.instructions.mechanics}</em></p>
        <button type="button" id="loginBtn">🔐 Log In</button>
      </div>
    `;

    document.getElementById("loginBtn").onclick = async e => {
      e.preventDefault();
      username = prompt("Enter your username:")?.trim();
      pin = prompt("Enter your PIN:")?.trim();
      if (!username || !pin) {
        alert("Login cancelled.");
        return;
      }

      const ok = await verifyLogin(authJSONPath, username, pin);
      if (!ok) return;

      // try to auto-load previous draft
      const draft = await loadDraft(username, activity.activity_id);
      if (draft && draft.responses) {
        Object.assign(answers, draft.responses);
        alert("✅ Draft found and loaded automatically.");
      }

      show(1);
    };
  }

  // ---------- Activity Sections ----------
  function renderSection(sec) {
    const key = sec.id;
    app.innerHTML = `
      <h2>${sec.title}</h2>
      <p style="max-width:800px;margin:auto;">${sec.prompt}</p>
      <textarea id="textInput">${answers[key] || ""}</textarea>
      <div class="reminder">${activity.instructions.reminder}</div>
      <div>
        ${screen > 1 ? `<button type="button" id="backBtn">← Back</button>` : ""}
        <button type="button" id="saveBtn">💾 Save Draft</button>
        <button type="button" id="nextBtn">Next →</button>
      </div>
      <p style="margin-top:1rem;font-size:0.9rem;color:#b3a37d;">Logged in as <strong>${username}</strong></p>
    `;

    document.getElementById("textInput").oninput = e => (answers[key] = e.target.value);

    if (document.getElementById("backBtn"))
      document.getElementById("backBtn").onclick = e => {
        e.preventDefault();
        show(screen - 1);
      };

    document.getElementById("saveBtn").onclick = e => {
      e.preventDefault();
      saveDraft(username, pin, activity.activity_id, answers);
    };

    document.getElementById("nextBtn").onclick = e => {
      e.preventDefault();
      show(screen + 1);
    };
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
        <button type="button" id="submitBtn">✅ Submit Final</button>
        <button type="button" id="returnBtn">⬅️ Return to DSFP Portal</button>
      </div>
      <p style="margin-top:1rem;font-size:0.9rem;color:#b3a37d;">Logged in as <strong>${username}</strong></p>
    `;

    document.getElementById("submitBtn").onclick = e => {
      e.preventDefault();
      submitFinal(username, pin, activity.activity_id, answers);
    };

    document.getElementById("returnBtn").onclick = e => {
      e.preventDefault();
      window.location.href = "../dsfp.html";
    };
  }

  // ---------- Launch ----------
  show(0);
}
