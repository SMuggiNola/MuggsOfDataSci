let activityData;
let currentIndex = 0;
let responses = {};

async function loadActivity() {
  const res = await fetch("activity.json");
  activityData = await res.json();

  const info = document.getElementById("info");
  info.innerHTML = `
    <p><em>${activityData.source.publication}</em> — <strong>${activityData.source.title}</strong></p>
    <p><a href="${activityData.source.link}" target="_blank">🔗 Read on HBR</a> |
       <a href="${activityData.source.local_file}" target="_blank">📄 View Local Copy</a></p>
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

  let content = `<h3>Question ${q.id}</h3><p>${q.question}</p>`;
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
      responses[`Q${q.id}`] = selected.value;
    } else {
      const val = document.getElementById(`short-${q.id}`).value.trim();
      if (!val) return alert("Please enter a response.");
      responses[`Q${q.id}`] = val;
    }
    currentIndex++;
    showQuestion();
  };
}

async function submitResponses() {
  const payload = {
    activity_id: activityData.activity_id,
    student_email: prompt("Enter your school email:"),
    timestamp: Date.now(),
    ping_method: "cloudflare",
    responses
  };

  const res = await fetch("https://activity-data-collector.sean-muggivan.workers.dev/save_activity", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  document.getElementById("question-container").innerHTML = `
    <p>✅ Submission saved successfully!</p>
    <p><small>Record ID: ${data.key}</small></p>
  `;
}

loadActivity();
