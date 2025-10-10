// =============================================
// Muggs of Data Science — Data Centers Activity
// submit.js — FINAL FIXED VERSION (2025-10-09)
// =============================================

let activityData;
let currentIndex = 0;
let responses = {};
let selectedQuestions = [];
let username = "";
let pin = "";
let isDraftLoaded = false;

// ---------- INITIAL LOAD ----------
document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startActivityBtn");
  if (startBtn) startBtn.addEventListener("click", loginAndLoad);
});

// ---------- LOGIN ----------
async function loginAndLoad() {
  username = prompt("Enter your username:")?.trim();
  pin = prompt("Enter your 6-digit PIN:")?.trim();
  if (!username || !pin) return alert("Login cancelled.");

  try {
    const res = await fetch("./auth.json"); // ✅ same folder
    const authList = await res.json();

    const key = Object.keys(authList).find(
      (k) => k.toLowerCase() === username.toLowerCase()
    );
    const match = key ? authList[key] : null;

    if (!match || String(match.pin) !== String(pin)) {
      alert("Invalid username or PIN.");
      location.reload();
      return;
    }

    localStorage.setItem("studentUsername", username);

    document.getElementById("info").style.display = "none";
    const container = document.getElementById("question-container");
    container.style.display = "block";
    container.innerHTML = "<h3>Loading activity...</h3>";

    await loadActivity();
  } catch (err) {
    console.error("Auth error:", err);
    alert("Auth error — tell your teacher.");
  }
}

// ---------- LOAD ACTIVITY ----------
async function loadActivity() {
  try {
    const res = await fetch("activity.json");
    activityData = await res.json();

    selectedQuestions = selectChronologicalQuestions(activityData.questions);

    const draftKey = `draft_${username}_${activityData.activity_id}`;
    const localDraft = localStorage.getItem(draftKey);
    if (localDraft) {
      responses = JSON.parse(localDraft);
      isDraftLoaded = true;
      alert("💾 Local draft loaded!");
    }

    showQuestion();
  } catch (err) {
    console.error("Activity load error:", err);
    alert("Could not load activity.json.");
  }
}

// ---------- SELECT QUESTIONS ----------
function selectChronologicalQuestions(questions) {
  const selected = [];
  for (let i = 1; i <= 6; i++) {
    const sectionQs = questions.filter(
      (q) => q.id.startsWith(`S${i}Q`) && q.type === "multiple_choice"
    );
    const count = Math.random() < 0.5 ? 2 : 3;
    const subset = sectionQs.sort(() => Math.random() - 0.5).slice(0, count);
    selected.push(...subset);
  }
  return selected.sort((a, b) => a.id.localeCompare(b.id));
}

// ---------- MULTIPLE CHOICE ----------
function showQuestion() {
  const container = document.getElementById("question-container");
  const q = selectedQuestions[currentIndex];
  if (!q) return showShortAnswers();

  let html = `
    <h3>Question ${currentIndex + 1} of ${selectedQuestions.length}</h3>
    <p>${q.question}</p>
  `;

  q.options.forEach((opt) => {
    const checked = responses[q.id] === opt ? "checked" : "";
    html += `
      <label style="display:block;margin:0.4rem 0;">
        <input type="radio" name="choice" value="${opt}" ${checked}> ${opt}
      </label>`;
  });

  html += `
    <div style="margin-top:1rem;">
      ${currentIndex > 0 ? `<button id="prevBtn">← Previous</button>` : ""}
      ${currentIndex < selectedQuestions.length - 1
        ? `<button id="nextBtn">Next →</button>`
        : `<button id="toShortAnswerBtn">Continue → Short Answer</button>`}
    </div>
    <div style="margin-top:1.5rem;">
      <button id="saveDraftBtn">💾 Save Without Submitting Final</button>
      <button id="submitFinalBtn">✅ Submit For Grading</button>
    </div>
  `;

  container.innerHTML = html;

  if (document.getElementById("prevBtn"))
    document.getElementById("prevBtn").onclick = prevQuestion;
  if (document.getElementById("nextBtn"))
    document.getElementById("nextBtn").onclick = nextQuestion;
  if (document.getElementById("toShortAnswerBtn"))
    document.getElementById("toShortAnswerBtn").onclick = showShortAnswers;
  document.getElementById("saveDraftBtn").onclick = saveDraft;
  document.getElementById("submitFinalBtn").onclick = submitResponses;
}

function prevQuestion() {
  saveCurrentAnswer();
  if (currentIndex > 0) currentIndex--;
  showQuestion();
}

function nextQuestion() {
  saveCurrentAnswer();
  if (currentIndex < selectedQuestions.length - 1) currentIndex++;
  showQuestion();
}

function saveCurrentAnswer() {
  const q = selectedQuestions[currentIndex];
  const selected = document.querySelector('input[name="choice"]:checked');
  if (selected) responses[q.id] = selected.value;
}

// ---------- SHORT ANSWERS ----------
function showShortAnswers() {
  const container = document.getElementById("question-container");
  const shortQs = activityData.questions.filter((q) => q.id.startsWith("S7"));
  if (!shortQs.length) return showReflections();

  let html = `<h2>Short Answer Questions</h2>`;
  shortQs.forEach((q) => {
    html += `
      <div style="margin-bottom:1rem;">
        <p><strong>${q.question}</strong></p>
        <textarea id="${q.id}" rows="4" style="width:90%;" 
          oninput="responses['${q.id}']=this.value;">${responses[q.id] || ""}</textarea>
      </div>`;
  });
  html += `
    <button id="saveDraftBtn">💾 Save Without Submitting Final</button>
    <button id="toReflectionBtn">Continue → Reflection</button>
  `;
  container.innerHTML = html;
  document.getElementById("saveDraftBtn").onclick = saveDraft;
  document.getElementById("toReflectionBtn").onclick = showReflections;
}

// ---------- REFLECTION ----------
function showReflections() {
  const container = document.getElementById("question-container");
  const reflQs = activityData.questions.filter((q) => q.id.startsWith("S8"));
  if (!reflQs.length) return showCompletionScreen(true, null, 0);

  let html = `<h2>Reflection</h2><p>${activityData.reflection_instructions}</p>`;
  reflQs.forEach((q) => {
    html += `
      <div style="margin-bottom:1rem;">
        <p><strong>${q.question}</strong></p>
        <textarea id="${q.id}" rows="4" style="width:90%;" 
          oninput="responses['${q.id}']=this.value;">${responses[q.id] || ""}</textarea>
      </div>`;
  });
  html += `
    <button id="saveDraftBtn">💾 Save Without Submitting Final</button>
    <button id="submitFinalBtn">✅ Submit For Grading</button>
  `;
  container.innerHTML = html;
  document.getElementById("saveDraftBtn").onclick = saveDraft;
  document.getElementById("submitFinalBtn").onclick = submitResponses;
}

// ---------- SAVE DRAFT ----------
async function saveDraft() {
  saveCurrentAnswer();
  const draftKey = `draft_${username}_${activityData.activity_id}`;
  localStorage.setItem(draftKey, JSON.stringify(responses));

  const payload = {
    username,
    activity_id: activityData.activity_id,
    timestamp: new Date().toISOString(),
    draft: true,
    responses,
  };

  try {
    await fetch("https://muggs-data-worker.sean-muggivan.workers.dev/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    alert("✅ Draft saved (local + Cloudflare).");
  } catch (err) {
    console.warn("Draft save failed:", err);
    alert("⚠️ Draft saved locally only.");
  }
}

// ---------- SUBMIT FINAL ----------
async function submitResponses() {
  document.querySelectorAll("textarea").forEach((t) => {
    responses[t.id] = t.value.trim();
  });

  let correct = 0;
  selectedQuestions.forEach((q) => {
    if (responses[q.id] === q.answer) correct++;
  });
  const total = selectedQuestions.length;
  const percent = Math.round((correct / total) * 100);

  const submission = {
    username,
    activity_id: activityData.activity_id,
    timestamp: new Date().toISOString(),
    draft: false,
    selected_questions: selectedQuestions.map((q) => q.id),
    responses,
    score: { correct, total, percent },
  };

  try {
    const res = await fetch(
      "https://muggs-data-worker.sean-muggivan.workers.dev/save",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submission),
      }
    );
    const data = await res.json();
    showCompletionScreen(true, data.key, percent);
  } catch (err) {
    console.error("Final submit failed:", err);
    localStorage.setItem(
      `submission_${username}_${activityData.activity_id}`,
      JSON.stringify(submission)
    );
    showCompletionScreen(false, null, percent);
  }
}

// ---------- COMPLETION ----------
function showCompletionScreen(success, recordId, percent) {
  const container = document.getElementById("question-container");
  container.innerHTML = `
    <div style="text-align:center;">
      <h2>${success ? "✅ Submission Complete!" : "⚠️ Saved Locally"}</h2>
      <p>You answered <strong>${percent}%</strong> correctly on the multiple-choice section.</p>
      <p>${
        success
          ? `Submitted to Cloudflare.<br><small>Record ID: ${recordId}</small>`
          : `Saved locally; can be re-submitted later.`
      }</p>
      <button id="doneBtn">Finish</button>
    </div>`;
  document.getElementById("doneBtn").onclick = () => {
    container.innerHTML =
      "<h3>🎉 Thank you for completing this activity!</h3><p>Your work has been recorded.</p>";
  };
}
