// ===== TTS ENHANCER APPLICATION =====

const API_BASE = "https://robo-t52y.onrender.com"; 
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

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
    setupEventListeners();
});

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    enhanceBtn.addEventListener("click", enhanceText);
    clearBtn.addEventListener("click", clearAll);
    speakBtn.addEventListener("click", speakText);
    copyBtn.addEventListener("click", copyText);
    downloadBtn.addEventListener("click", downloadText);

    voiceSpeed.addEventListener("input", (e) => {
        speedDisplay.textContent = e.target.value + "x";
    });
}

// ===== 🔥 FIXED ENHANCE TEXT =====
async function enhanceText() {
    const text = ttsInput.value.trim();

    if (!text) {
        alert("Enter text first!");
        return;
    }

    enhanceBtn.disabled = true;
    enhanceBtn.innerText = "✨ Enhancing...";

    try {
        const response = await fetch(`${API_BASE}/tts/enhance`, {
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

        const data = await response.json();
        console.log("API Response:", data);

        if (data.success) {
            enhancedText = data.enhanced;   // ✅ FIX
            ttsOutput.innerHTML = `<p>${enhancedText}</p>`;
            speakBtn.disabled = false;
            copyBtn.disabled = false;
            downloadBtn.disabled = false;
        } else {
            alert("Enhancement failed");
        }

    } catch (err) {
        console.error(err);
        alert("Server error");
    } finally {
        enhanceBtn.disabled = false;
        enhanceBtn.innerText = "✨ Enhance Text";
    }
}

// ===== SPEAK =====
function speakText() {
    if (!enhancedText) return;

    const speech = new SpeechSynthesisUtterance(enhancedText);
    speech.lang = voiceLang.value;
    speech.rate = parseFloat(voiceSpeed.value);

    speechSynthesis.cancel();
    speechSynthesis.speak(speech);
}

// ===== COPY =====
function copyText() {
    navigator.clipboard.writeText(enhancedText);
    alert("Copied!");
}

// ===== DOWNLOAD =====
function downloadText() {
    const blob = new Blob([enhancedText], { type: "text/plain" });
    const a = document.createElement("a");

    a.href = URL.createObjectURL(blob);
    a.download = "tts-output.txt";
    a.click();
}

// ===== CLEAR =====
function clearAll() {
    ttsInput.value = "";
    ttsOutput.innerHTML = "Output will appear here...";
    enhancedText = "";
}

// ===== READY =====
console.log("✅ TTS Ready");