// background.js

// Initialize default state
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ isActive: false });
  updateBadge(false);
});

// Toggle mode via Shortcut
chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle_mode") {
    toggleActiveState();
  }
});

function toggleActiveState() {
  chrome.storage.local.get(['isActive'], (result) => {
    const newState = !result.isActive;
    chrome.storage.local.set({ isActive: newState });
    updateBadge(newState);
  });
}

function updateBadge(isActive) {
  const text = isActive ? "ON" : "OFF";
  const color = isActive ? "#10b981" : "#64748b";
  chrome.action.setBadgeText({ text: text });
  chrome.action.setBadgeBackgroundColor({ color: color });
}

// Handle Messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "TRANSLATE") {
    translateText(request.text, request.targetLang)
      .then(result => sendResponse({ success: true, result }))
      .catch(err => {
          console.error("LinguaGemini Translation Error:", err);
          sendResponse({ success: false, error: err.message });
      });
    return true; // Async response
  }
  
  if (request.action === "QUEUE_SAVE") {
    queueFlashcard(request.data);
    sendResponse({ success: true });
  }

  if (request.action === "TOGGLE_STATE") {
      toggleActiveState();
      sendResponse({success: true});
  }
});

// Helper: Add to Sync Queue (for retrieval by Localhost content script)
function queueFlashcard(data) {
  chrome.storage.local.get(['saveQueue'], (res) => {
    const queue = res.saveQueue || [];
    queue.push(data);
    chrome.storage.local.set({ saveQueue: queue });
  });
}

// Helper: Call Gemini
async function translateText(text, targetLanguage) {
  const data = await chrome.storage.sync.get(['geminiApiKey']);
  const apiKey = data.geminiApiKey;
  
  if (!apiKey) throw new Error("API Key missing. Open LinguaGemini.");

  const prompt = `Translate this text to ${targetLanguage}. Only return the translated text, nothing else.\n\nText: "${text}"`;
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "API Error");
  }

  const json = await response.json();
  if (json.candidates && json.candidates[0] && json.candidates[0].content) {
      return json.candidates[0].content.parts[0].text.trim();
  }
  return "Translation unavailable.";
}