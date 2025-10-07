let activityData;
let currentIndex = 0;
let responses = {};

async function loadActivity() {
  const res = await fetch("activity.json");
  activityData = await res.json();

  const info = document.getElementById("info");
  info.innerHTML = `
    <p><em>${activityData.source.publication}</em> — <strong>${activityData.source.title}</strong></p>
    <p>
      <a href="${activityData.source.link}" target="_blank">🔗 Read Online</a> |
      <a href="${activityData.source.local_file}" target="_blank">📄 View Local Copy</a>
    </p>
    <p>${activityData.objective}</p>
  `;

  showQuestion();
}

function showQuestion() {
  const container = document.getElementById("question-container");
  const q = activityData.questions[currentIndex];

  if (!q) {
    container.innerHTML = `<h3>All done!</h3><p>Submitting your responses...</p>`;
    submitResponses();
    return;
  }

  let content = `<h3>Question ${currentIndex + 1}</h3><p>${q.question}</p>`;
  if (q.type === "multiple_choice") {
    content += q.options.map(opt => `
      <label><input type="radio" name="q${q.id}" value="${opt}"> ${opt}</label><br/>
    `).join("");
  } else {
    content += `<textarea id="short-${q.id}" rows="4" placeholder="Write your answer..."></textarea>`;
  }
  content += `<button id="nextBtn">Next →</button>`;
  container.innerHTML = content;

  document.getElementById("nextBtn").onclick = () => {
    if (q.type === "multiple_choice") {
      const selected = document.querySelector(`input[name="q${q.id}"]:checked`);
      if (!selected) return alert("Please choose an answer.");
      responses[q.id] = selected.value;
    } else {
      const val = document.getElementById(`short-${q.id}`).value.trim();
      if (!val) return alert("Please enter a response.");
      responses[q.id] = val;
    }
    currentIndex++;
    showQuestion();
  };
}

async function submitResponses() {
  const username = localStorage.getItem("studentUsername") || prompt("Enter your username:");
  
  // ✅ Score calculation
  let correct = 0;
  const total = activityData.questions.length;
  activityData.questions.forEach(q => {
    if (q.answer && responses[q.id] === q.answer) correct++;
  });
  const percent = Math.round((correct / total) * 100);

  // ✅ Reflection responses
  const reflectionResponses = {};
  let reflectionsCompleted = 0;
  if (activityData.reflections) {
    activityData.reflections.forEach(r => {
      const el = document.getElementById(r.id);
      if (el && el.value.trim()) reflectionsCompleted++;
      reflectionResponses[r.id] = el ? el.value.trim() : "";
    });
  }

  const submission = {
    username,
    activity_id: activityData.activity_id,
    timestamp: new Date().toISOString(),
    responses,
    reflections: reflectionResponses,
    score: { correct, total, percent, reflectionsCompleted }
  };

  try {
    const res = await fetch("https://muggs-data-worker.sean-muggivan.workers.dev/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submission)
    });
    const data = await res.json();
    showCompletionScreen(true, data.key, correct, total, percent, reflectionsCompleted);
  } catch (err) {
    localStorage.setItem(`submission_${username}_${activityData.activity_id}`, JSON.stringify(submission));
    showCompletionScreen(false, null, correct, total, percent, reflectionsCompleted);
  }
}

// ✅ New: Submission Complete Screen
function showCompletionScreen(success, recordId, correct, total, percent, reflectionsCompleted) {
  const container = document.getElementById("question-container");
  container.innerHTML = `
    <div style="text-align:center;">
      <h2>${success ? "✅ Submission Complete!" : "⚠️ Saved Locally"}</h2>
      <p>You answered <strong>${correct}</strong> of <strong>${total}</strong> correctly (<strong>${percent}%</strong>).</p>
      <p>Reflections completed: <strong>${reflectionsCompleted}</strong></p>
      <p>${success
        ? `Your work was successfully submitted to Cloudflare.<br><small>Record ID: ${recordId}</small>`
        : `There was a connection problem. Your work has been saved locally and can be re-uploaded later.`}</p>
      <button id="doneBtn">Finish</button>
    </div>
  `;

  document.getElementById("doneBtn").onclick = () => {
    container.innerHTML = `
      <h3>🎉 Thank you for completing this activity!</h3>
      <p>Your work has been safely recorded. You may now close this tab.</p>
    `;
  };
}

loadActivity();
