// =============================================
// save_to_cloudflare.js
// Shared utility for DSFP activities
// =============================================

export async function saveToCloudflare(submission) {
  const endpoint = "https://muggsofdatasci.net/save";

  try {
    console.log("📡 Uploading submission to Cloudflare:", submission);

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submission),
    });

    // Check if Cloudflare returned a valid JSON response
    if (!res.ok) {
      console.warn(`⚠️ Cloudflare returned HTTP ${res.status}`);
      throw new Error(`Save failed (HTTP ${res.status})`);
    }

    const data = await res.json();
    console.log("✅ Saved to Cloudflare KV:", data);
    return data;
  } catch (err) {
    console.error("❌ Error saving to Cloudflare:", err.message || err);
    throw err; // Let caller handle localStorage fallback
  }
}
