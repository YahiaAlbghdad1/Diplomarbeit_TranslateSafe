document.addEventListener('DOMContentLoaded', async () => {
    const statusText = document.getElementById('status-text');
    const toggleBtn = document.getElementById('toggle-btn');
    const langSelect = document.getElementById('lang-select');
    const keyDot = document.getElementById('key-dot');
    const keyText = document.getElementById('key-text');
    
    // Comprehensive Language List for Extension
    const LANGUAGES = [
      "Afrikaans", "Albanian", "Amharic", "Arabic", "Armenian", "Azerbaijani", "Basque", "Belarusian", "Bengali", 
      "Bosnian", "Bulgarian", "Catalan", "Cebuano", "Chinese (Simplified)", "Chinese (Traditional)", "Corsican", 
      "Croatian", "Czech", "Danish", "Dutch", "English", "Esperanto", "Estonian", "Finnish", "French", "Frisian", 
      "Galician", "Georgian", "German", "Greek", "Gujarati", "Haitian Creole", "Hausa", "Hawaiian", "Hebrew", "Hindi", 
      "Hmong", "Hungarian", "Icelandic", "Igbo", "Indonesian", "Irish", "Italian", "Japanese", "Javanese", "Kannada", 
      "Kazakh", "Khmer", "Korean", "Kurdish", "Kyrgyz", "Lao", "Latin", "Latvian", "Lithuanian", "Luxembourgish", 
      "Macedonian", "Malagasy", "Malay", "Malayalam", "Maltese", "Maori", "Marathi", "Mongolian", "Myanmar (Burmese)", 
      "Nepali", "Norwegian", "Nyanja (Chichewa)", "Pashto", "Persian", "Polish", "Portuguese", "Punjabi", "Romanian", 
      "Russian", "Samoan", "Scots Gaelic", "Serbian", "Sesotho", "Shona", "Sindhi", "Sinhala (Sinhalese)", "Slovak", 
      "Slovenian", "Somali", "Spanish", "Sundanese", "Swahili", "Swedish", "Tagalog (Filipino)", "Tajik", "Tamil", 
      "Telugu", "Thai", "Turkish", "Ukrainian", "Urdu", "Uzbek", "Vietnamese", "Welsh", "Xhosa", "Yiddish", "Yoruba", "Zulu"
    ];

    // Populate Dropdown
    LANGUAGES.forEach(lang => {
      const option = document.createElement('option');
      option.value = lang;
      option.textContent = lang;
      langSelect.appendChild(option);
    });
    
    // Init State
    const local = await chrome.storage.local.get(['isActive']);
    const sync = await chrome.storage.sync.get(['targetLang', 'geminiApiKey']);
    
    updateUI(local.isActive);
    updateKeyStatus(sync.geminiApiKey);

    if (sync.targetLang) {
        langSelect.value = sync.targetLang;
    } else {
        langSelect.value = "English"; // Default
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