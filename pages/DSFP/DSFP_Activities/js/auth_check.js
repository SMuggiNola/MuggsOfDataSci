// =============================================
// auth_check.js
// Verifies user credentials for DSFP activities
// =============================================

export async function verifyLogin(authPath, username, pin) {
  try {
    const res = await fetch(authPath);
    const authList = await res.json();

    const key = Object.keys(authList).find(k => k.toLowerCase() === username.toLowerCase());
    const match = key ? authList[key] : null;

    if (!match || String(match.pin) !== String(pin)) {
      alert("Invalid username or PIN.");
      return false;
    }
    return true;
  } catch (err) {
    console.error("Auth load error:", err);
    alert("Could not load auth.json — please contact Mr. Mugg.");
    return false;
  }
}
