// content.js - Runs on Localhost (The Web App)

console.log("LinguaGemini Bridge Active");

const BRIDGE_ID = 'lingua-gemini-bridge';

// 1. Sync Config (App -> Extension)
function syncToExtension() {
  const bridge = document.getElementById(BRIDGE_ID);
  if (bridge) {
    // Sync API Key
    if (bridge.dataset.apiKey) {
       chrome.storage.sync.set({ geminiApiKey: bridge.dataset.apiKey }, () => {
           console.log("%cLinguaGemini: API Key Synced from Web App", "color: #10b981; font-weight: bold;");
       });
    }
    // Sync Target Language
    if (bridge.dataset.targetLang) {
        chrome.storage.sync.set({ targetLang: bridge.dataset.targetLang });
    }
  }
}

// Observer to catch App state changes
const observer = new MutationObserver(syncToExtension);
observer.observe(document.body, { childList: true, subtree: true, attributes: true });

// Run immediately in case element is already there
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncToExtension);
} else {
    syncToExtension();
}

// 2. Sync Config (Extension -> App)
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.targetLang) {
        // Dispatch event to React App
        const event = new CustomEvent('lingua-gemini-config-update', { 
            detail: { targetLang: changes.targetLang.newValue } 
        });
        window.dispatchEvent(event);
    }
});

// 3. Process Save Queue (Extension -> App)
// Dispatches a custom event directly on window so the React app can save via Supabase
// using its existing auth session — no backend endpoint needed.
function processQueue() {
  chrome.storage.local.get(['saveQueue'], (res) => {
    const queue = res.saveQueue || [];
    if (queue.length === 0) return;

    console.log(`LinguaGemini: processing ${queue.length} queued flashcard(s)...`);

    for (const item of queue) {
      window.dispatchEvent(new CustomEvent('lingua-gemini-save-flashcard', {
        detail: {
          original: item.original,
          translated: item.translated,
          sourceLang: item.sourceLang || 'Auto',
          targetLang: item.targetLang,
        }
      }));
    }

    // Clear queue and notify app to refresh its list
    chrome.storage.local.set({ saveQueue: [] });
    window.dispatchEvent(new Event('lingua-gemini-update'));
  });
}

// Check queue on load and when window gains focus
processQueue();
window.addEventListener('focus', processQueue);
setInterval(processQueue, 2000); // Periodic check