// =============================================
// save_to_cloudflare.js
// Unified DSFP/Classwork Cloudflare save utility
// =============================================

export async function saveToCloudflare(submission) {
  // Try the main domain first, then the fallback Worker.dev route
  const endpoints = [
    "https://muggsofdatasci.net/save", // ✅ preferred
    "https://muggs-data-worker.sean-muggivan.workers.dev/save" // fallback
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`📡 Trying Cloudflare endpoint: ${endpoint}`);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submission),
      });

      if (res.ok) {
        const data = await res.json();
        console.log("✅ Saved to Cloudflare KV:", data);
        return data;
      } else {
        console.warn(`⚠️ Endpoint ${endpoint} responded with HTTP ${res.status}`);
      }
    } catch (err) {
      console.warn(`⚠️ Endpoint ${endpoint} failed:`, err.message);
    }
  }

  console.error("❌ All Cloudflare endpoints failed — local fallback required.");
  throw new Error("Cloudflare upload failed.");
}
