let activityData;
let currentIndex = 0;
let responses = {};
let isDraftLoaded = false;

// Wait for Start button
document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startActivityBtn");
  if (startBtn) startBtn.addEventListener("click", loginAndLoad);
});

// 🔐 Login sequence
async function loginAndLoad() {
  const username = prompt("Enter your username:")?.trim();
  const pin = prompt("Enter your 6-digit PIN:")?.trim();

  if (!username || !pin) return alert("Login cancelled.");

  try {
    const auth = await fetch("./auth.json").then(r => r.json());
    if (!auth[username] || auth[username].pin != pin) {
      alert("Invalid username or PIN.");
      location.reload();
      return;
    }

    localStorage.setItem("studentUsername", username);
    document.getElementById("info").style.display = "none";
    const container = document.getElementById("question-container");
    container.style.display = "block";
    container.innerHTML = `<h3>Loading activity...</h3>`;

    await loadActivity();
  } catch (err) {
    console.error(err);
    alert("Auth error — tell your teacher.");
  }
}

// 🧩 Load activity + any saved drafts
async function loadActivity() {
  try {
    const res = await fetch("activity.json");
    activityData = await res.json();
    const username = localStorage.getItem("studentUsername");

    // Try Cloudflare draft first
    const cfDraft = await loadCloudflareDraft(username, activityData.activity_id);
    if (cfDraft) {
      responses = cfDraft;
      isDraftLoaded = true;
      alert("☁️ Draft loaded from Cloudflare.");
    } else {
      // Fallback to local draft
      const localDraft = localStorage.getItem(`draft_${username}_${activityData.activity_id}`);
      if (localDraft) {
        responses = JSON.parse(localDraft);
        isDraftLoaded = true;
        alert("💾 Local draft loaded.");
      }
    }

    showQuestion();
  } catch (err) {
    console.error("Activity load error:", err);
    alert("Could not load activity.json.");
  }
}

// 🧠 Cloudflare draft loader
async function loadCloudflareDraft(username, activity_id) {
  try {
    const res = await fetch(
      `https://muggs-data-worker.sean-muggivan.workers.dev/load?username=${encodeURIComponent(username)}&activity_id=${activity_id}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.responses || null;
  } catch (err) {
    console.warn("No Cloudflare draft found.");
    return null;
  }
}

// 🧭 Render question UI
function showQuestion() {
  const container = document.getElementById("question-container");
  container.style.display = "block";
  const q = activityData.questions[currentIndex];

  if (!q) {
    container.innerHTML = `<h3>All done!</h3><p>Review or submit when ready.</p>`;
    return;
  }

  let html = `
    <h3>Question ${currentIndex + 1} of ${activityData.questions.length}</h3>
    <p>${q.question}</p>
  `;

  if (q.type === "multiple_choice") {
    html += q.options.map(opt => `
      <label>
        <input type="radio" name="q${q.id}" value="${opt}" ${responses[q.id] === opt ? "checked" : ""}>
        ${opt}
      </label><br/>
    `).join("");
  } else {
    html += `<textarea id="short-${q.id}" rows="4" placeholder="Write your answer...">${responses[q.id] || ""}</textarea>`;
  }

  html += `
    <div style="margin-top:1rem;">
      ${currentIndex > 0 ? `<button id="prevBtn">← Previous</button>` : ""}
      ${currentIndex < activityData.questions.length - 1
        ? `<button id="nextBtn">Next →</button>`
        : ""}
    </div>
    <div style="margin-top:1.5rem;">
      <button id="saveDraftBtn">💾 Save Without Submitting Final</button>
      <button id="submitFinalBtn">✅ Submit For Grading</button>
    </div>
  `;

  container.innerHTML = html;

  if (document.getElementById("prevBtn")) document.getElementById("prevBtn").onclick = prevQuestion;
  if (document.getElementById("nextBtn")) document.getElementById("nextBtn").onclick = nextQuestion;
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
  if (currentIndex < activityData.questions.length - 1) currentIndex++;
  showQuestion();
}

function saveCurrentAnswer() {
  const q = activityData.questions[currentIndex];
  if (q.type === "multiple_choice") {
    const selected = document.querySelector(`input[name="q${q.id}"]:checked`);
    if (selected) responses[q.id] = selected.value;
  } else {
    const val = document.getElementById(`short-${q.id}`).value.trim();
    responses[q.id] = val;
  }
}

// 💾 Save Draft (local + Cloudflare)
async function saveDraft() {
  saveCurrentAnswer();
  const username = localStorage.getItem("studentUsername");
  const draftKey = `draft_${username}_${activityData.activity_id}`;
  localStorage.setItem(draftKey, JSON.stringify(responses));

  // Send to Cloudflare
  const draftPayload = {
    username,
    activity_id: activityData.activity_id,
    timestamp: new Date().toISOString(),
    draft: true,
    responses
  };

  try {
    await fetch("https://muggs-data-worker.sean-muggivan.workers.dev/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draftPayload)
    });
    alert("✅ Draft saved (Cloudflare + local). You can resume anywhere!");
  } catch (err) {
    console.error("Draft save failed:", err);
    alert("⚠️ Draft saved locally, but Cloudflare sync failed.");
  }
}

// ✅ Submit for Grading
async function submitResponses() {
  saveCurrentAnswer();
  const username = localStorage.getItem("studentUsername");

  let correct = 0;
  const totalMC = activityData.questions.filter(q => q.type === "multiple_choice").length;
  activityData.questions.forEach(q => {
    if (q.type === "multiple_choice" && q.answer && responses[q.id] === q.answer) correct++;
  });
  const percent = Math.round((correct / totalMC) * 100);

  const submission = {
    username,
    activity_id: activityData.activity_id,
    timestamp: new Date().toISOString(),
    draft: false,
    responses,
    score: { correct, totalMC, percent }
  };

  try {
    const res = await fetch("https://muggs-data-worker.sean-muggivan.workers.dev/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submission)
    });
    const data = await res.json();
    showCompletionScreen(true, data.key, correct, totalMC, percent);
  } catch (err) {
    console.error("Final submit failed:", err);
    localStorage.setItem(`submission_${username}_${activityData.activity_id}`, JSON.stringify(submission));
    showCompletionScreen(false, null, correct, totalMC, percent);
  }
}

// 🎉 Completion screen
function showCompletionScreen(success, recordId, correct, total, percent) {
  const container = document.getElementById("question-container");
  container.innerHTML = `
    <div style="text-align:center;">
      <h2>${success ? "✅ Submission Complete!" : "⚠️ Saved Locally"}</h2>
      <p>You answered <strong>${correct}</strong> of <strong>${total}</strong> multiple-choice questions correctly.</p>
      <p><strong>Score:</strong> ${percent}%</p>
      <p>${success
        ? `Submitted to Cloudflare.<br><small>Record ID: ${recordId}</small>`
        : `No internet? Saved locally and can be uploaded later.`}</p>
      <button id="doneBtn">Finish</button>
    </div>
  `;
  document.getElementById("doneBtn").onclick = () => {
    container.innerHTML = `
      <h3>🎉 Thank you for completing this activity!</h3>
      <p>Your work has been safely recorded.</p>
    `;
  };
}
