// ===== TTS ENHANCER APPLICATION =====

const API_BASE = "https://robo-t52y.onrender.com"; // Change to your production URL
let enhancedText = "";

// ===== DOM ELEMENTS =====
const ttsInput = document.getElementById("tts-input");
const ttsMode = document.getElementById("tts-mode");
const ttsPersonality = document.getElementById("tts-personality");
const ttsEmotion = document.getElementById("tts-emotion");
const ttsAction = document.getElementById("tts-action");
const enhanceBtn = document.getElementById("tts-enhance-btn");
const clearBtn = document.getElementById("tts-clear-btn");
const ttsOutput = document.getElementById("tts-output");
const speakBtn = document.getElementById("tts-speak-btn");
const copyBtn = document.getElementById("tts-copy-btn");
const downloadBtn = document.getElementById("tts-download-btn");
const voiceLang = document.getElementById("voice-lang");
const voiceGender = document.getElementById("voice-gender");
const voiceSpeed = document.getElementById("voice-speed");
const speedDisplay = document.getElementById("speed-display");
const charCount = document.getElementById("char-count");
const wordCount = document.getElementById("word-count");
const duration = document.getElementById("duration");

// ===== INITIALIZATION =====
document.addEventListener("DOMContentLoaded", () => {
    loadSavedSettings();
    setupEventListeners();
});

// ===== LOAD SAVED SETTINGS =====
function loadSavedSettings() {
    const saved = localStorage.getItem("ttsSettings");
    if (saved) {
        const settings = JSON.parse(saved);
        ttsMode.value = settings.mode || "friendly";
        ttsPersonality.value = settings.personality || "podcast";
        ttsEmotion.value = settings.emotion || "neutral";
        ttsAction.value = settings.action || "improve";
    }
}

// ===== SETUP EVENT LISTENERS =====
function setupEventListeners() {
    enhanceBtn.addEventListener("click", enhanceText);
    clearBtn.addEventListener("click", clearAll);
    speakBtn.addEventListener("click", speakText);
    copyBtn.addEventListener("click", copyText);
    downloadBtn.addEventListener("click", downloadText);
    
    ttsInput.addEventListener("input", updateStats);
    voiceSpeed.addEventListener("input", (e) => {
        speedDisplay.textContent = e.target.value + "x";
    });

    // Save settings on change
    [ttsMode, ttsPersonality, ttsEmotion, ttsAction].forEach(el => {
        el.addEventListener("change", saveSettings);
    });

    // Load voices when available
    loadAvailableVoices();
    speechSynthesis.onvoiceschanged = loadAvailableVoices;

    // Add listeners for language and gender changes to test voice immediately
    voiceLang.addEventListener("change", testVoiceSelection);
    voiceGender.addEventListener("change", testVoiceSelection);
}

// ===== LOAD AVAILABLE VOICES =====
function loadAvailableVoices() {
    const voices = speechSynthesis.getVoices();
    console.log(`✅ Available voices: ${voices.length}`);
    
    // Get unique languages from available voices
    const uniqueLangs = {};
    voices.forEach((voice, index) => {
        if (!uniqueLangs[voice.lang]) {
            uniqueLangs[voice.lang] = [];
        }
        uniqueLangs[voice.lang].push(voice);
        console.log(`${index}: ${voice.name} (${voice.lang}) ${voice.localService ? "[Local]" : "[Remote]"}`);
    });
    
    console.log("\n🗣️ Voices by Language:");
    Object.entries(uniqueLangs).forEach(([lang, voiceList]) => {
        console.log(`${lang}: ${voiceList.map(v => v.name).join(", ")}`);
    });

    // Update language dropdown with ONLY available languages
    updateLanguageDropdown(uniqueLangs);
}

// ===== UPDATE LANGUAGE DROPDOWN WITH AVAILABLE VOICES =====
function updateLanguageDropdown(voicesByLang) {
    // Language name mapping
    const langNames = {
        'en-US': 'English (US)',
        'en-GB': 'English (UK)',
        'hi-IN': 'Hindi',
        'mr-IN': 'Marathi',
        'fr-FR': 'French',
        'es-ES': 'Spanish',
        'es-MX': 'Spanish (Mexico)',
        'de-DE': 'German',
        'it-IT': 'Italian',
        'ja-JP': 'Japanese',
        'ko-KR': 'Korean',
        'pt-BR': 'Portuguese (Brazil)',
        'zh-CN': 'Chinese (Simplified)',
        'zh-TW': 'Chinese (Traditional)',
        'ru-RU': 'Russian',
        'id-ID': 'Indonesian',
        'pl-PL': 'Polish',
        'nl-NL': 'Dutch'
    };

    // Clear existing options
    voiceLang.innerHTML = '';

    // Add only available languages
    Object.keys(voicesByLang).sort().forEach(langCode => {
        const option = document.createElement('option');
        option.value = langCode;
        option.textContent = langNames[langCode] || langCode;
        voiceLang.appendChild(option);
    });

    console.log(`\n✅ Language dropdown updated with ${Object.keys(voicesByLang).length} available languages`);
}

// ===== TEST VOICE SELECTION =====
function testVoiceSelection() {
    const selectedLang = voiceLang.value;
    const selectedGender = voiceGender.value;
    const voices = speechSynthesis.getVoices();
    
    console.log(`\n🔍 Testing: Language="${selectedLang}", Gender="${selectedGender}"`);
    
    // Find matching voice
    let matchingVoices = voices.filter(v => 
        v.lang === selectedLang || 
        v.lang.startsWith(selectedLang.split("-")[0])
    );
    
    if (matchingVoices.length === 0) {
        console.warn(`❌ No voices found for language: ${selectedLang}`);
        console.log("Available languages:", [...new Set(voices.map(v => v.lang))].join(", "));
        return;
    }
    
    console.log(`✅ Found ${matchingVoices.length} voices for ${selectedLang}:`);
    matchingVoices.forEach(v => {
        console.log(`  - ${v.name} (${v.lang})`);
    });
}

// ===== UPDATE STATISTICS =====
function updateStats() {
    const text = ttsInput.value;
    const characters = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const estimatedDuration = Math.ceil(words / 140); // ~140 words per minute

    charCount.textContent = characters;
    wordCount.textContent = words;
    duration.textContent = estimatedDuration + "s";
}

// ===== SAVE SETTINGS =====
function saveSettings() {
    const settings = {
        mode: ttsMode.value,
        personality: ttsPersonality.value,
        emotion: ttsEmotion.value,
        action: ttsAction.value
    };
    localStorage.setItem("ttsSettings", JSON.stringify(settings));
}

// ===== ENHANCE TEXT =====
async function enhanceText() {
    const text = ttsInput.value.trim();
    
    if (!text) {
        showNotification("Please enter some text first!", "error");
        return;
    }

    enhanceBtn.disabled = true;
    enhanceBtn.innerHTML = '<i class="ri-loader-4-line"></i> Processing...';

    try {
        const response = await fetch(`${API_BASE}/tts/build_prompt`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                text: text,
                mode: ttsMode.value,
                personality: ttsPersonality.value,
                emotion: ttsEmotion.value,
                action: ttsAction.value
            })
        });

        if (!response.ok) throw new Error("API Error");

        const data = await response.json();
        
        if (data.success) {
            enhancedText = data.prompt;
            displayOutput(enhancedText);
            enableActionButtons();
            showNotification("✨ Text enhanced successfully!", "success");
        } else {
            throw new Error(data.error || "Enhancement failed");
        }
    } catch (error) {
        console.error("Error:", error);
        showNotification("Error enhancing text: " + error.message, "error");
    } finally {
        enhanceBtn.disabled = false;
        enhanceBtn.innerHTML = '<i class="ri-magic-line"></i> Enhance Text';
    }
}

// ===== DISPLAY OUTPUT =====
function displayOutput(text) {
    ttsOutput.innerHTML = `<p>${text.replace(/\n/g, '<br>')}</p>`;
}

// ===== ENABLE ACTION BUTTONS =====
function enableActionButtons() {
    speakBtn.disabled = false;
    copyBtn.disabled = false;
    downloadBtn.disabled = false;
}

// ===== SPEAK TEXT =====
function speakText() {
    if (!enhancedText) return;

    const speech = new SpeechSynthesisUtterance();
    speech.text = enhancedText;
    speech.lang = voiceLang.value;
    speech.rate = parseFloat(voiceSpeed.value);

    // Wait for voices to load if needed
    let voices = speechSynthesis.getVoices();
    if (voices.length === 0) {
        speechSynthesis.onvoiceschanged = () => {
            voices = speechSynthesis.getVoices();
            selectAndSpeak(speech, voices);
        };
    } else {
        selectAndSpeak(speech, voices);
    }
}

// Helper function to select voice and speak
function selectAndSpeak(speech, voices) {
    const selectedLangCode = voiceLang.value;
    const genderPref = voiceGender.value.toLowerCase();

    console.log(`\n🎤 Speaking with: Language="${selectedLangCode}", Gender="${genderPref}", Speed="${voiceSpeed.value}x"`);

    // More flexible language matching
    let langVoices = voices.filter(v => {
        // Exact match
        if (v.lang === selectedLangCode) return true;
        // Partial match (e.g., "en" matches "en-US", "en-GB")
        if (v.lang.startsWith(selectedLangCode.split("-")[0])) return true;
        // Reverse check (e.g., if browser has "es-ES" and we want "es")
        if (selectedLangCode.split("-")[0] && v.lang.startsWith(selectedLangCode.split("-")[0])) return true;
        return false;
    });

    console.log(`Found ${langVoices.length} voices for language "${selectedLangCode}"`);
    if (langVoices.length > 0) {
        langVoices.forEach(v => console.log(`  - ${v.name}`));
    }

    // Filter by gender preference - more keywords
    let selectedVoice = langVoices.find(v => {
        const voiceName = v.name.toLowerCase();
        const voiceURI = v.voiceURI.toLowerCase();
        if (genderPref === "female") {
            return voiceName.includes("female") || voiceName.includes("woman") || 
                   voiceURI.includes("female") || voiceURI.includes("woman") ||
                   voiceName.includes("zira") || voiceName.includes("samantha") ||
                   voiceName.includes("victoria") || voiceName.includes("moira");
        } else {
            return voiceName.includes("male") || voiceName.includes("man") ||
                   voiceURI.includes("male") || voiceURI.includes("man") ||
                   voiceName.includes("david") || voiceName.includes("mark") ||
                   voiceName.includes("daniel") || voiceName.includes("oliver");
        }
    });

    // If no gender-matched voice found, use first available for that language
    if (!selectedVoice && langVoices.length > 0) {
        selectedVoice = langVoices[0];
        console.log(`⚠️ No ${genderPref} voice found, using: ${selectedVoice.name}`);
    }

    // Last resort: use any available voice
    if (!selectedVoice && voices.length > 0) {
        selectedVoice = voices[0];
        console.warn(`⚠️ No matching voice found, using default: ${selectedVoice.name}`);
    }

    if (selectedVoice) {
        speech.voice = selectedVoice;
        speech.lang = selectedVoice.lang;  // Use the voice's actual language
        console.log(`✅ Selected voice: "${selectedVoice.name}" (${selectedVoice.lang})`);
    } else {
        console.error("❌ No voices available at all!");
        showNotification("No voices available", "error");
        return;
    }

    speechSynthesis.cancel();
    speechSynthesis.speak(speech);
    
    showNotification("🔊 Speaking...", "info");
}

// ===== COPY TEXT =====
function copyText() {
    if (!enhancedText) return;

    navigator.clipboard.writeText(enhancedText).then(() => {
        showNotification("✅ Copied to clipboard!", "success");
    }).catch(err => {
        showNotification("Failed to copy", "error");
    });
}

// ===== DOWNLOAD TEXT =====
function downloadText() {
    if (!enhancedText) return;

    const element = document.createElement("a");
    const file = new Blob([enhancedText], { type: "text/plain" });
    
    element.href = URL.createObjectURL(file);
    element.download = `sahaay-enhanced-${new Date().getTime()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    showNotification("📥 Downloaded successfully!", "success");
}

// ===== CLEAR ALL =====
function clearAll() {
    if (confirm("Clear all text?")) {
        ttsInput.value = "";
        ttsOutput.innerHTML = '<p class="placeholder">Your enhanced text will appear here...</p>';
        enhancedText = "";
        speakBtn.disabled = true;
        copyBtn.disabled = true;
        downloadBtn.disabled = true;
        updateStats();
    }
}

// ===== NOTIFICATION SYSTEM =====
function showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.innerHTML = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === "success" ? "#10b981" : type === "error" ? "#ef4444" : "#3b82f6"};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = "slideOut 0.3s ease";
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ===== ANIMATIONS =====
const style = document.createElement("style");
style.innerHTML = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener("keydown", (e) => {
    // Ctrl+Enter = Enhance
    if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        enhanceText();
    }
    
    // Ctrl+Shift+S = Speak
    if (e.ctrlKey && e.shiftKey && e.code === "KeyS") {
        e.preventDefault();
        speakText();
    }
    
    // Ctrl+Shift+C = Copy
    if (e.ctrlKey && e.shiftKey && e.code === "KeyC") {
        e.preventDefault();
        copyText();
    }
});

// ===== LOAD AVAILABLE VOICES =====
window.addEventListener("DOMContentLoaded", () => {
    speechSynthesis.onvoiceschanged = () => {
        const voices = speechSynthesis.getVoices();
        console.log("Available voices:", voices);
    };
});

console.log("✅ TTS Enhancer Ready!");
