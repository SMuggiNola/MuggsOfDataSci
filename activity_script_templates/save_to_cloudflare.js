export async function saveToCloudflare(submission) {
  try {
    const res = await fetch("https://YOUR-WORKER-NAME.YOUR-ACCOUNT.workers.dev/save", {
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
