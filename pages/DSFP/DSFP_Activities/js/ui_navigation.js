import { verifyLogin } from "./auth_check.js";
import { saveDraft, submitFinal } from "./draft_submit.js";

export function initActivity(activityJSONPath, authJSONPath) {
  let username = "", pin = "", screen = 0;
  let answers = { s2: "", s3: "", s4: "" };
  const app = document.getElementById("app");

  const stages = [
    renderLanding,
    () => renderText("The Apparent Story", "Begin by describing what you can see about the house.", "s2"),
    () => renderText("The Less Apparent Story", "Imagine who lived there last and why they might have left.", "s3"),
    () => renderText("The Even Less Apparent Story", "Ask about the world around the house.", "s4"),
    renderAfterword
  ];

  function show(n) { screen = n; stages[n](); }

  function renderLanding() {
    app.innerHTML = `
      <h1>FP 1.2 — Questions, Questions, Questions…</h1>
      <p>Questions perpetuate investigation and discovery. Answers imply completion. <br>
      “If the doors of perception were cleansed...” — <em>William Blake</em></p>
      <button id="beginBtn">Begin Inquiry</button>
    `;
    document.getElementById("beginBtn").onclick = async () => {
      username = prompt("Enter your username:")?.trim();
      pin = prompt("Enter your PIN:")?.trim();
      if (!username || !pin) return alert("Login cancelled.");
      const ok = await verifyLogin(authJSONPath, username, pin);
      if (ok) show(1);
    };
  }

  function renderText(title, prompt, key) {
    app.innerHTML = `
      <h2>${title}</h2>
      <p>${prompt}</p>
      <textarea id="text">${answers[key] || ""}</textarea>
      <div class="reminder">If the door to discovery is a question, an answer is the lock. Leave the door unlocked.</div>
      <div>
        ${screen > 1 ? `<button id="backBtn">← Back</button>` : ""}
        <button id="saveBtn">💾 Save Draft and Return</button>
        <button id="nextBtn">Next →</button>
      </div>
    `;
    document.getElementById("text").oninput = e => answers[key] = e.target.value;
    if (document.getElementById("backBtn")) document.getElementById("backBtn").onclick = () => show(screen - 1);
    document.getElementById("saveBtn").onclick = () => saveDraft(username, pin, "FP1_2_QUESTIONS", answers);
    document.getElementById("nextBtn").onclick = () => show(screen + 1);
  }

  function renderAfterword() {
    app.innerHTML = `
      <h2>What Happens Next?</h2>
      <p>All student questions will be analyzed by AI to identify recurring patterns. 3–5 core DSFP research questions may emerge.</p>
      <p class="reminder">If the door to discovery is a question, an answer is the lock. Leave the door unlocked.</p>
      <button id="submitBtn">✅ Submit Final and Return</button>
    `;
    document.getElementById("submitBtn").onclick = () => submitFinal(username, pin, "FP1_2_QUESTIONS", answers);
  }

  show(0);
}
