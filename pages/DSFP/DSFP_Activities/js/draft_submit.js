// =============================================
// draft_submit.js — DSFP Activity Save & Submit
// =============================================

import { saveToCloudflare } from "./save_to_cloudflare.js";

/**
 * Save draft to localStorage + Cloudflare KV.
 * Redirects user back to the DSFP Activities index.
 */
export async function saveDraft(username, pin, activity_id, responses) {
  const payload = {
    username,
    pin,
    activity_id,
    draft: true,
    timestamp: new Date().toISOString(),
    responses
  };

  const draftKey = `draft_${username}_${activity_id}`;
  localStorage.setItem(draftKey, JSON.stringify(payload));

  try {
    await saveToCloudflare(payload);
    alert("✅ Draft saved and uploaded to Cloudflare.");
  } catch (err) {
    console.warn("⚠️ Cloudflare save failed. Draft saved locally only.", err);
    alert("⚠️ Could not connect to Cloudflare — saved locally only.");
  }

  window.location.href = "./index.html"; // ✅ Redirect to DSFP Activities
}

/**
 * Submit final responses.
 * Redirects user back to DSFP Activities index on completion.
 */
export async function submitFinal(username, pin, activity_id, responses) {
  const payload = {
    username,
    pin,
    activity_id,
    draft: false,
    timestamp: new Date().toISOString(),
    responses
  };

  try {
    await saveToCloudflare(payload);
    alert("✅ Final submission complete! Returning to DSFP Activities.");
  } catch (err) {
    console.error("❌ Final submit failed:", err);
    localStorage.setItem(`submission_${username}_${activity_id}`, JSON.stringify(payload));
    alert("⚠️ Upload failed. Submission saved locally. Please show Mr. Mugg.");
  }

  window.location.href = "./index.html"; // ✅ Redirect to DSFP Activities
}

/**
 * Manual return button helper.
 */
export function returnToActivities() {
  window.location.href = "./index.html";
}
