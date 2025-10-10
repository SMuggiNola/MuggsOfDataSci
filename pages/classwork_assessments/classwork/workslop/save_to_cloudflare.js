// ✅ save_to_cloudflare.js

async function saveToCloudflare(submission) {
  try {
    const res = await fetch("https://muggs-data-worker.sean-muggivan.workers.dev/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submission)
    });

    if (!res.ok) throw new Error(`Save failed (${res.status})`);
    const data = await res.json();
    console.log("✅ Saved to Cloudflare KV:", data);
    return data;
  } catch (err) {
    console.error("❌ Error saving to Cloudflare:", err);
    throw err;
  }
}

// 🔓 Expose globally so submit.js can call it
window.saveToCloudflare = saveToCloudflare;
