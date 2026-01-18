document.addEventListener('DOMContentLoaded', async () => {
    const statusText = document.getElementById('status-text');
    const toggleBtn = document.getElementById('toggle-btn');
    const langSelect = document.getElementById('lang-select');
    const keyDot = document.getElementById('key-dot');
    const keyText = document.getElementById('key-text');
    
    // Init State
    const local = await chrome.storage.local.get(['isActive']);
    const sync = await chrome.storage.sync.get(['targetLang', 'geminiApiKey']);
    
    updateUI(local.isActive);
    updateKeyStatus(sync.geminiApiKey);

    if (sync.targetLang) {
        langSelect.value = sync.targetLang;
    }

    // Toggle
    toggleBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'TOGGLE_STATE' }, () => {
             // Re-fetch state because logic is in background
             setTimeout(async () => {
                 const newState = await chrome.storage.local.get(['isActive']);
                 updateUI(newState.isActive);
             }, 100);
        });
    });

    // Lang Change
    langSelect.addEventListener('change', () => {
        chrome.storage.sync.set({ targetLang: langSelect.value });
    });

    function updateUI(isActive) {
        if (isActive) {
            statusText.textContent = "ON";
            statusText.className = "status-indicator on";
            toggleBtn.textContent = "Disable Monitoring";
            toggleBtn.style.background = "#ef4444";
        } else {
            statusText.textContent = "OFF";
            statusText.className = "status-indicator off";
            toggleBtn.textContent = "Enable Monitoring";
            toggleBtn.style.background = "#4f46e5";
        }
    }

    function updateKeyStatus(key) {
        if (key && key.length > 0) {
            keyDot.className = "dot connected";
            keyText.textContent = "API Key Synced";
        } else {
            keyDot.className = "dot";
            keyText.innerHTML = "API Key Missing (<a href='http://localhost:3000' target='_blank' style='color:#818cf8'>Open App</a>)";
        }
    }
});