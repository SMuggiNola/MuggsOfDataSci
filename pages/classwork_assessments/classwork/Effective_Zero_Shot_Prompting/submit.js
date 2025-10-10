// =============================================
// Muggs of Data Science — Effective Zero-Shot Prompting
// submit.js — FINAL BIDIRECTIONAL VERSION (2025-10-10)
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
    const res = await fetch("./auth.json");
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

    selectedQuestions = activityData.questions.filter((q) =>
      ["information", "markdown", "html", "multiple_choice", "short_answer", "reflection"].includes(q.type)
    );

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

// ---------- DISPLAY QUESTIONS ----------
async function showQuestion() {
  const container = document.getElementById("question-container");
  const q = selectedQuestions[currentIndex];
  if (!q) return showCompletionScreen(true, null, 0);

  // Compute visible numbering (for question tracking)
  const displayNumber = selectedQuestions
    .slice(0, currentIndex + 1)
    .filter((x) => ["multiple_choice", "short_answer", "reflection"].includes(x.type))
    .length;

  const totalQuestions = selectedQuestions.filter((x) =>
    ["multiple_choice", "short_answer", "reflection"].includes(x.type)
  ).length;

  // ---------- NAV BUTTON TEMPLATE ----------
  const navButtons = `
    <div style="margin-top:1rem; text-align:center;">
      ${currentIndex > 0 ? `<button id="prevBtn">← Previous</button>` : ""}
      ${currentIndex < selectedQuestions.length - 1
        ? `<button id="nextBtn">Continue →</button>`
        : `<button id="nextBtn">Finish & Submit</button>`}
    </div>
  `;

  // ---------- INFORMATION ----------
  if (q.type === "information") {
    container.innerHTML = `
      <div class="info">
        <h2>${q.group || "Information"}</h2>
        <p style="white-space: pre-wrap; line-height:1.6;">${q.question}</p>
        ${navButtons}
      </div>`;
  }

  // ---------- MARKDOWN ----------
  else if (q.type === "markdown" && q.file) {
    try {
      const md = await fetch(q.file).then((r) => r.text());
      container.innerHTML = `
        <div class="info" style="text-align:left;">
          <h2>${q.group || "Lesson Material"}</h2>
          <article style="white-space: pre-wrap; line-height:1.6;">${md}</article>
          ${navButtons}
        </div>`;
    } catch (err) {
      console.error("Markdown load error:", err);
      container.innerHTML = `<p style="color:#f88;">Error loading ${q.file}</p>${navButtons}`;
    }
  }

  // ---------- HTML FILE ----------
  else if (q.type === "html" && q.file) {
    try {
      const html = await fetch(q.file).then((r) => r.text());
      container.innerHTML = `
        <div class="info" style="text-align:left;">
          ${html}
          ${navButtons}
        </div>`;
    } catch (err) {
      console.error("HTML load error:", err);
      container.innerHTML = `<p style="color:#f88;">Error loading ${q.file}</p>${navButtons}`;
    }
  }

  // ---------- MULTIPLE CHOICE ----------
  else if (q.type === "multiple_choice") {
    let html = `
      <h3>Question ${displayNumber} of ${totalQuestions}</h3>
      <p>${q.question}</p>`;
    q.options.forEach((opt) => {
      const checked = responses[q.id] === opt ? "checked" : "";
      html += `
        <label style="display:block;margin:0.4rem 0;">
          <input type="radio" name="choice" value="${opt}" ${checked}> ${opt}
        </label>`;
    });
    html += `
      ${navButtons}
      <div style="margin-top:1.5rem; text-align:center;">
        <button id="saveDraftBtn">💾 Save Draft</button>
        <button id="submitFinalBtn">✅ Submit For Grading</button>
      </div>`;

    container.innerHTML = html;
  }

  // ---------- SHORT ANSWER / REFLECTION ----------
  else if (["short_answer", "reflection"].includes(q.type)) {
    const label = q.type === "short_answer" ? "Short Answer" : "Reflection";
    container.innerHTML = `
      <h3>${label} ${displayNumber} of ${totalQuestions}</h3>
      <p><strong>${q.question}</strong></p>
      <textarea id="answerBox" rows="5" style="width:90%;">${responses[q.id] || ""}</textarea>
      ${navButtons}
      <div style="margin-top:1.5rem; text-align:center;">
        <button id="saveDraftBtn">💾 Save Draft</button>
      </div>`;
  }

  // ---------- ATTACH NAVIGATION & SAVE HANDLERS ----------
  if (document.getElementById("prevBtn"))
    document.getElementById("prevBtn").onclick = () => {
      saveCurrentAnswer();
      prevQuestion();
    };

  if (document.getElementById("nextBtn"))
    document.getElementById("nextBtn").onclick = () => {
      saveCurrentAnswer();
      if (currentIndex < selectedQuestions.length - 1) nextQuestion();
      else submitResponses();
    };

  if (document.getElementById("saveDraftBtn"))
    document.getElementById("saveDraftBtn").onclick = saveDraft;

  if (document.getElementById("submitFinalBtn"))
    document.getElementById("submitFinalBtn").onclick = submitResponses;
}

// ---------- NAVIGATION ----------
function prevQuestion() {
  if (currentIndex > 0) currentIndex--;
  showQuestion();
}
function nextQuestion() {
  if (currentIndex < selectedQuestions.length - 1) currentIndex++;
  showQuestion();
}
function saveCurrentAnswer() {
  const q = selectedQuestions[currentIndex];
  if (!q) return;
  if (q.type === "multiple_choice") {
    const selected = document.querySelector('input[name="choice"]:checked');
    if (selected) responses[q.id] = selected.value;
  } else if (["short_answer", "reflection"].includes(q.type)) {
    const box = document.getElementById("answerBox");
    if (box) responses[q.id] = box.value.trim();
  }
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
    status: "draft",
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

  const mcQs = selectedQuestions.filter((q) => q.type === "multiple_choice");
  const total = mcQs.length;
  const correct = mcQs.filter((q) => responses[q.id] === q.answer).length;
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0;

  const submission = {
    username,
    activity_id: activityData.activity_id,
    timestamp: new Date().toISOString(),
    status: "final",
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
          ? `Submitted to Cloudflare.<br><small>Record Key: ${recordId}</small>`
          : `Saved locally; can be re-submitted later.`
      }</p>
      <button id="doneBtn">Finish</button>
    </div>`;
  document.getElementById("doneBtn").onclick = () => {
    container.innerHTML =
      "<h3>🎉 Thank you for completing this activity!</h3><p>Your work has been recorded.</p>";
  };
}
