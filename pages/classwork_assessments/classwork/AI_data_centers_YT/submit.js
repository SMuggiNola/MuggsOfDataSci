let activityData;
let currentIndex = 0;
let responses = {};
let selectedQuestions = [];
let username = ""; // 🔹 store temporarily for this session only

document.addEventListener("DOMContentLoaded", () => {
  loadActivity();
});

async function loadActivity() {
  try {
    const res = await fetch("activity.json");
    activityData = await res.json();
    document.getElementById("activityTitle").textContent = activityData.title;

    // Prepare random question set before the activity starts
    selectedQuestions = selectQuestionsBySection(activityData.questions);

    const startBtn = document.getElementById("startActivityBtn");
    if (startBtn) startBtn.addEventListener("click", startActivity);
  } catch (err) {
    console.error("❌ Error loading activity.json:", err);
    document.getElementById("info").innerHTML = `<p style="color:#f88;">Error loading activity data. Please check activity.json.</p>`;
  }
}

// 🧩 Select 2 random questions per section (S1–S5), keep order
function selectQuestionsBySection(questions) {
  const selected = [];
  for (let i = 1; i <= 5; i++) {
    const group = questions.filter(q => q.id.startsWith(`S${i}`));
    const shuffled = group.sort(() => Math.random() - 0.5).slice(0, 2);
    selected.push(...shuffled);
  }
  // Sort by section number to preserve sequence order
  return selected.sort((a, b) => a.id.localeCompare(b.id));
}

function startActivity() {
  // ✅ Always ask for username on every start
  username = prompt("Enter your username:");
  if (!username || !username.trim()) {
    alert("You must enter a username to start.");
    return;
  }
  username = username.trim();

  document.getElementById("startActivityBtn").disabled = true;
  showQuestion();
}

function showQuestion() {
  const container = document.getElementById("question-container");
  const q = selectedQuestions[currentIndex];

  if (!q) {
    showReflections();
    return;
  }

  let html = `<h3>Question ${currentIndex + 1} of ${selectedQuestions.length}</h3><p>${q.question}</p>`;
  html += `<textarea id="short-${q.id}" rows="4" placeholder="Write your answer..."></textarea>`;
  html += `<button id="nextBtn">Next →</button>`;
  container.innerHTML = html;
  container.style.display = "block";

  document.getElementById("nextBtn").onclick = () => {
    const val = document.getElementById(`short-${q.id}`).value.trim();
    if (!val) return alert("Please enter a response.");
    responses[q.id] = val;
    currentIndex++;
    showQuestion();
  };
}

function showReflections() {
  const container = document.getElementById("question-container");
  let html = `<h2>Reflection Questions</h2><p>${activityData.reflection_instructions}</p><ol>`;

  // Section 6 reflections only
  const reflectionQs = activityData.questions.filter(q => q.id.startsWith("S6"));
  reflectionQs.forEach(r => {
    html += `
      <li><p>${r.question}</p>
      <textarea id="${r.id}" rows="4" placeholder="Write your reflection..."></textarea></li>`;
  });

  html += `</ol><button id="submitBtn">Submit Activity</button>
           <p id="submitMessage" style="margin-top:1rem;"></p>`;
  container.innerHTML = html;

  document.getElementById("submitBtn").onclick = handleSubmit;
}

async function handleSubmit() {
  const reflectionResponses = {};
  let answered = 0;

  const reflectionQs = activityData.questions.filter(q => q.id.startsWith("S6"));
  reflectionQs.forEach(r => {
    const val = document.getElementById(r.id).value.trim();
    if (val) answered++;
    reflectionResponses[r.id] = val;
  });

  if (answered < 2) return alert("Please answer at least two reflection questions.");

  const correct = 0;
  const total = selectedQuestions.length + reflectionQs.length;
  const percent = 0;

  const msg = document.getElementById("submitMessage");
  msg.style.color = "#d4af37";
  msg.innerHTML = `Submitting...`;

  const submission = {
    username,
    activity_id: activityData.activity_id,
    timestamp: new Date().toISOString(),
    responses,
    reflections: reflectionResponses,
    score: { correct, total, percent }
  };

  try {
    const res = await fetch("https://muggs-data-worker.sean-muggivan.workers.dev/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submission)
    });
    const data = await res.json();
    showCompletionScreen(true, data.key);
  } catch (err) {
    localStorage.setItem(`submission_${username}_${activityData.activity_id}`, JSON.stringify(submission));
    showCompletionScreen(false, null);
  }
}

function showCompletionScreen(success, recordId) {
  const container = document.getElementById("question-container");
  let html = `
    <div style="text-align:center;">
      <h2>${success ? "✅ Submission Complete!" : "⚠️ Saved Locally"}</h2>
      <p>${success
        ? `Your work was successfully submitted to Cloudflare.<br><small>Record ID: ${recordId}</small>`
        : `There was a connection issue. Your work was saved locally and can be re-submitted later.`}</p>
      <button id="doneBtn">Finish</button>
    </div>
  `;
  container.innerHTML = html;
  document.getElementById("doneBtn").onclick = () => {
    container.innerHTML = `<h3>🎉 Thank you for completing this activity!</h3><p>You may now close this tab.</p>`;
  };
}
