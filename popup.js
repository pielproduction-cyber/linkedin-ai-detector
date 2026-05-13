/**
 * popup.js — Handles the extension popup UI logic.
 * - Saves / loads the Gemini API key from chrome.storage.local.
 * - Toggles key visibility.
 */

const form = document.getElementById("apiKeyForm");
const input = document.getElementById("apiKeyInput");
const toggleBtn = document.getElementById("toggleVisibility");
const statusEl = document.getElementById("statusMessage");

// Load saved key on popup open
chrome.storage.local.get("geminiApiKey", (result) => {
  if (result.geminiApiKey) {
    input.value = result.geminiApiKey;
    showStatus("✅ Klucz API jest zapisany.", "success");
  }
});

// Save key on form submit
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const key = input.value.trim();

  if (!key) {
    showStatus("⚠️ Wklej klucz API.", "error");
    return;
  }

  if (key.length < 10) {
    showStatus("⚠️ Klucz wygląda na zbyt krótki.", "error");
    return;
  }

  chrome.storage.local.set({ geminiApiKey: key }, () => {
    showStatus("✅ Klucz zapisany pomyślnie!", "success");
  });
});

// Toggle password visibility
toggleBtn.addEventListener("click", () => {
  const isPassword = input.type === "password";
  input.type = isPassword ? "text" : "password";
  toggleBtn.textContent = isPassword ? "🙈" : "👁️";
});

/**
 * Displays a status message below the form.
 * @param {string} text
 * @param {"success"|"error"} type
 */
function showStatus(text, type) {
  statusEl.textContent = text;
  statusEl.className = `status-message status-${type}`;
  statusEl.classList.remove("hidden");
}
