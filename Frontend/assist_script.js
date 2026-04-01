let voices = [];
let selectedLang = "en-US";
let selectedGender = "female";
const overlay = document.getElementById("overlay");

// ===== LOAD VOICES =====
function loadVoices() {
    voices = speechSynthesis.getVoices();
}
speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();

// ===== DOUBLE TAP FIX =====
let clickTimer = null;
function micAction() {
    if (clickTimer !== null) {
        clearTimeout(clickTimer);
        clickTimer = null;
        showVoicePopup(); // DOUBLE TAP opens settings
        return;
    }

    clickTimer = setTimeout(() => {
        speakAndSave(); // SINGLE TAP speaks & saves
        clickTimer = null;
    }, 300);
}

// ===== VOICE POPUP =====
const voicePopup = document.createElement("div");
voicePopup.id = "voicePopup";
document.body.appendChild(voicePopup);

voicePopup.innerHTML = `
<h3>Select Language</h3>
<div class="option-group">
    <button onclick="setLang('en-US')">English</button>
    <button onclick="setLang('hi-IN')">Hindi</button>
    <button onclick="setLang('mr-IN')">Marathi</button>
</div>

<h3>Select Voice</h3>
<div class="option-group">
    <button onclick="setGender('male')">👨 Alex</button>
    <button onclick="setGender('female')">👩 Emma</button>
</div>

<div class="option-group">
    <button onclick="closePopup()">Apply</button>
</div>
`;

// ===== SHOW/CLOSE POPUP =====
function showVoicePopup() {
    voicePopup.style.display = "flex";
    overlay.style.display = "block";
    document.querySelector(".main-content").style.filter = "blur(5px)";
}

function closePopup() {
    voicePopup.style.display = "none";
    overlay.style.display = "none";
    document.querySelector(".main-content").style.filter = "none";
}

// ===== SELECT LANGUAGE & VOICE =====
function setLang(lang) {
    selectedLang = lang;
    notify("Language: " + lang);
}

function setGender(g) {
    selectedGender = g;
    notify("Voice: " + g);
}

// ===== NOTIFY =====
function notify(msg) {
    const n = document.createElement("div");
    n.className = "notification";
    n.innerText = msg;
    document.body.appendChild(n);

    setTimeout(() => n.style.opacity = "1", 100);
    setTimeout(() => {
        n.style.opacity = "0";
        setTimeout(() => n.remove(), 300);
    }, 2000);
}

// ===== VOICE & LANGUAGE LOCAL STORAGE HELPERS =====
function saveVoiceMessage(text) {
    const voices = JSON.parse(localStorage.getItem("voiceMessages")) || [];
    voices.push(text || "voice input");
    localStorage.setItem("voiceMessages", JSON.stringify(voices));
    loadMessages();
}

function saveLanguage(lang) {
    const langs = JSON.parse(localStorage.getItem("languagesUsed")) || [];
    if (!langs.includes(lang)) {
        langs.push(lang);
        localStorage.setItem("languagesUsed", JSON.stringify(langs));
        loadMessages();
    }
}

// ===== LOAD MESSAGES & STATS =====
const userId = localStorage.getItem("userId");
const messagesContainer = document.getElementById("messages-container");
const msgCountEl = document.getElementById("msg-count");
const voiceCountEl = document.getElementById("voice-count");
const langCountEl = document.getElementById("lang-count");

async function loadMessages() {
    if (!userId) return;

    try {
        const res = await fetch(`https://robo-website-ce0e.onrender.com/messages/get_messages/${userId}?t=${Date.now()}`);
        const messages = await res.json();
        messagesContainer.innerHTML = "";

        messages.forEach(msg => {
            const div = document.createElement("div");
            div.classList.add("message");
            div.classList.add("user"); // for simplicity, assume user
            const now = new Date();
            const currentTime = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
            div.innerHTML = `
                <div>${msg.message}</div>
                <div class="msg-time">${currentTime}</div>
            `;
            messagesContainer.appendChild(div);
        });

        if (msgCountEl) msgCountEl.textContent = messages.length;
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

    } catch (err) {
        console.error("Error loading messages:", err);
    }

    // Update voice & language stats
    const voicesLS = JSON.parse(localStorage.getItem("voiceMessages")) || [];
    if (voiceCountEl) voiceCountEl.textContent = voicesLS.length;

    const langsLS = JSON.parse(localStorage.getItem("languagesUsed")) || [];
    if (langCountEl) langCountEl.textContent = langsLS.length;
}

setInterval(loadMessages, 5000);
loadMessages();

// ===== SPEAK & SAVE MESSAGE =====
async function speakAndSave() {
    const input = document.getElementById("inputMessage");
    const text = input.value.trim();
    if (!text) return alert("Type something 😅");

    // ===== SPEAK =====
    let voiceList = speechSynthesis.getVoices();
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = selectedLang;

    let voice;
    if (selectedGender === "female") {
        voice = voiceList.find(v => v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("google"));
    } else {
        voice = voiceList.find(v => v.name.toLowerCase().includes("male") || v.name.toLowerCase().includes("alex"));
    }
    if (!voice) voice = voiceList.find(v => v.lang.includes(selectedLang));
    speech.voice = voice || voiceList[0];

    speechSynthesis.cancel();
    speechSynthesis.speak(speech);

    // ===== FALLBACK API =====
    setTimeout(() => {
        if (!speechSynthesis.speaking) {
            const fallbackVoice = selectedGender === "female" ? "Emma" : "Brian";
            const audio = new Audio(
                `https://api.streamelements.com/kappa/v2/speech?voice=${fallbackVoice}&text=${encodeURIComponent(text)}`
            );
            audio.play();
        }
    }, 1000);

    // ===== SAVE TO DATABASE =====
    try {
        const res = await fetch("https://robo-website-ce0e.onrender.com/messages/save_message", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, message: text })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Save failed");
        loadMessages();
    } catch (err) {
        console.error("Error saving message:", err);
    }

    // ===== SAVE LOCAL STATS =====
    saveVoiceMessage(text);
    saveLanguage(selectedLang);

    input.value = "";
}