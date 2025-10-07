let activityData;
let selectedQuestions = [];
let currentIndex = 0;
let responses = {};

async function loadActivity() {
  const res = await fetch("activity.json");
  activityData = await res.json();
  document.getElementById("activityTitle").textContent = activityData.title;

  // Show source info in Directions box
  const info = document.getElementById("info");
  info.innerHTML += `
    <p><em>${activityData.source.publication}</em> — <strong>${activityData.source.title}</strong></p>
    <p>
      <a href="${activityData.source.link}" target="_blank">Read Online</a> |
      <a href="${activityData.source.local_file}" target="_blank">View Local Copy</a>
    </p>
    <p>${activityData.objective}</p>
  `;

  document.getElementById("startActivityBtn").addEventListener("click", startActivity);
}

// ---- Select questions: 2 per section, keep chronological order ----
function selectQuestions() {
  const sections = [...new Set(activityData.questions.map(q => q.group))];
  let chosen = [];

  sections.forEach(section => {
    const group = activityData.questions.filter(q => q.group === section);
    // Randomize, pick 2 (or fewer if section has <2)
    const sample = group.sort(() => Math.random() - 0.5).slice(0, 2);
    chosen.push(...sample);
  });

  // Sort by section number for chronological order
  chosen.sort((a, b) => {
    const numA = parseInt(a.group.replace("Section ", ""));
    const numB = parseInt(b.group.replace("Section ", ""));
    return numA - numB;
  });

  return chosen;
}

function startActivity() {
  document.getElementById("startActivityBtn").disabled = true;
  selectedQuestions = selectQuestions();
  showQuestion();
}

// ---- Question display ----
function showQuestion() {
  const container = document.getElementById("question-container");
  const q = selectedQuestions[currentIndex];

  if (!q) {
    showReflections();
    return;
  }

  let html = `<h3>${q.group}: Question ${currentIndex + 1}</h3><p>${q.question}</p>`;

  if (q.type === "multiple_choice") {
    html += q.options.map(opt => `
      <label><input type="radio" name="q${q.id}" value="${opt}"> ${opt}</label><br>
    `).join("");
  } else {
    html += `<textarea id="short-${q.id}" rows="4" placeholder="Write your answer..."></textarea>`;
  }

  html += `<button id="nextBtn">Next →</button>`;
  container.innerHTML = html;
  container.style.display = "block";

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

// ---- Reflection section (Section 6) ----
function showReflections() {
  const reflections = activityData.questions.filter(q => q.group === "Section 6");
  const container = document.getElementById("question-container");

  let html = `<h2>Reflection Questions</h2>
              <p>${activityData.reflection_instructions}</p><ol>`;
  reflections.forEach(r => {
    html += `
      <li><p>${r.question}</p>
      <textarea id="${r.id}" rows="4" placeholder="Write your response..."></textarea></li>`;
  });
  html += `</ol><button id="submitBtn">Submit Activity</button>
           <p id="submitMessage" style="margin-top:1rem;"></p>`;
  container.innerHTML = html;

  document.getElementById("submitBtn").onclick = () => handleSubmit(reflections);
}

// ---- Submission handling ----
async function handleSubmit(reflections) {
  const username = localStorage.getItem("studentUsername") || prompt("Enter your username:");
  const reflectionResponses = {};
  let answered = 0;

  reflections.forEach(r => {
    const val = document.getElementById(r.id).value.trim();
    if (val) answered++;
    reflectionResponses[r.id] = val;
  });

  if (answered < 2) return alert("Please answer at least two reflection questions.");

  // Scoring only applies to questions with 'answer' key
  let correct = 0;
  const total = selectedQuestions.length;
  selectedQuestions.forEach(q => {
    if (q.answer && responses[q.id] === q.answer) correct++;
  });
  const percent = Math.round((correct / total) * 100);

  const msg = document.getElementById("submitMessage");
  msg.style.color = "#d4af37";
  msg.innerHTML = `Submitting... (${correct}/${total} correct, ${percent}%)`;

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
    showCompletionScreen(true, data.key, correct, total, percent);
  } catch (err) {
    localStorage.setItem(`submission_${username}_${activityData.activity_id}`, JSON.stringify(submission));
    showCompletionScreen(false, null, correct, total, percent);
  }
}

// ---- Completion display ----
function showCompletionScreen(success, recordId, correct, total, percent) {
  const container = document.getElementById("question-container");
  let html = `
    <div style="text-align:center;">
      <h2>${success ? "✅ Submission Complete!" : "⚠️ Saved Locally"}</h2>
      <p>You answered ${correct} of ${total} correctly (<strong>${percent}%</strong>).</p>
      <p>${success
        ? `Your work was successfully submitted to Cloudflare.<br><small>Record ID: ${recordId}</small>`
        : `There was a problem connecting. Your work has been saved locally and can be re-submitted later.`}</p>
      <button id="doneBtn">Finish</button>
    </div>`;
  container.innerHTML = html;
  document.getElementById("doneBtn").onclick = () => {
    container.innerHTML = `<h3>🎉 Thank you for completing this activity!</h3><p>You may now close this tab.</p>`;
  };
}

loadActivity();
