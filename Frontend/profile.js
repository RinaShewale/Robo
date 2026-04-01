document.addEventListener("DOMContentLoaded", () => {
  // ===== CHECK LOGIN =====
  const loggedIn = localStorage.getItem("loggedIn");
  const userId = localStorage.getItem("userId");

  if (!loggedIn || !userId) {
    window.location.href = "index.html";
    return;
  }

  // ===== DOM ELEMENTS =====
  const usernameEl = document.getElementById("username2");
  const emailEl = document.getElementById("email");
  const editModal = document.getElementById("edit-modal");
  const editUsername = document.getElementById("edit-username");
  const editEmail = document.getElementById("edit-email");
  const saveBtn = document.getElementById("save-profile");
  const cancelBtn = document.getElementById("cancel-edit");
  const editBtns = [
    document.getElementById("edit-btn"),
    document.getElementById("edit-btn-mobile")
  ];
  const logoutBtns = [
    document.getElementById("logout-btn"),
    document.getElementById("logout-btn-mobile")
  ];
  const menuBtn = document.getElementById("menu-btn");
  const mobileSidebar = document.getElementById("mobile-sidebar");
  const messagesContainer = document.getElementById("messages-container");
  const msgCountEl = document.getElementById("msg-count");
  const voiceCountEl = document.getElementById("voice-count");
  const langCountEl = document.getElementById("lang-count");
  const deleteAllBtn = document.getElementById("delete-all-btn");

  // ===== LOAD PROFILE =====
  function loadProfile() {
    const username = localStorage.getItem("username") || "User";
    const email = (localStorage.getItem("email") || "user@email.com").toLowerCase();

    usernameEl.textContent = username;
    emailEl.textContent = email;
    editUsername.value = username;
    editEmail.value = email;
  }
  loadProfile();

  // ===== MOBILE SIDEBAR TOGGLE =====
  menuBtn.addEventListener("click", () => {
    mobileSidebar.classList.toggle("show");
    document.body.classList.toggle("no-scroll");
  });
  document.querySelectorAll(".mobile-sidebar .nav-item").forEach(link => {
    link.addEventListener("click", () => {
      mobileSidebar.classList.remove("show");
      document.body.classList.remove("no-scroll");
    });
  });

  // ===== EDIT PROFILE MODAL =====
  editBtns.forEach(btn => btn.addEventListener("click", e => {
    e.preventDefault();
    editModal.style.display = "flex";
  }));
  cancelBtn.addEventListener("click", () => editModal.style.display = "none");
  window.addEventListener("click", e => {
    if (e.target === editModal) editModal.style.display = "none";
  });

  saveBtn.addEventListener("click", async () => {
    const username = editUsername.value.trim();
    const email = (editEmail.value || "").trim().toLowerCase();

    if (!username || !email) return alert("All fields required");

    try {
      const res = await fetch("https://robo-t52y.onrender.com/auth/update_profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, username, email })
      });
      const data = await res.json();

      if (res.ok && data.user) {
        localStorage.setItem("username", data.user.username);
        localStorage.setItem("email", data.user.email);
        loadProfile();
        editModal.style.display = "none";
        alert("Profile updated ✅");
      } else {
        alert(data.error || "Update failed ❌");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong ❌");
    }
  });

  // ===== LOGOUT =====
  logoutBtns.forEach(btn => btn.addEventListener("click", async e => {
    e.preventDefault();
    try {
      await fetch("https://robo-t52y.onrender.com/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error ❌", err);
    } finally {
      localStorage.clear();
      window.location.href = "index.html";
    }
  }));

  // ===== LOAD MESSAGES & STATS =====
  async function loadMessages() {
    try {
      const res = await fetch(`https://robo-t52y.onrender.com/messages/get_messages/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch messages");

      const messages = await res.json();
      messagesContainer.innerHTML = "";

      messages.forEach(msg => {
        const div = document.createElement("div");
        div.classList.add("message", msg.sender === "user" ? "user" : "bot");

        // ✅ CURRENT LOCAL TIME FORMAT H:MM AM/PM
        const now = new Date();
        const currentTime = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

        div.innerHTML = `
          <div>${msg.message}</div>
          <div class="msg-time">${currentTime}</div>
        `;
        messagesContainer.appendChild(div);
      });

      // update count
      if (msgCountEl) msgCountEl.textContent = messages.length;
      messagesContainer.scrollTop = messagesContainer.scrollHeight;

    } catch (err) {
      console.error("Messages error ❌", err);
    }

    // Voice messages from localStorage
    const voiceMessages = JSON.parse(localStorage.getItem("voiceMessages")) || [];
    if (voiceCountEl) voiceCountEl.textContent = voiceMessages.length;

    // Languages from localStorage
    const languages = JSON.parse(localStorage.getItem("languagesUsed")) || [];
    if (langCountEl) langCountEl.textContent = languages.length;
  }

  loadMessages();
  setInterval(loadMessages, 5000);

  // ===== UTILITY TO SAVE VOICE & LANGUAGE =====
  window.saveVoiceMessage = function(text) {
    const voices = JSON.parse(localStorage.getItem("voiceMessages")) || [];
    voices.push(text || "voice input");
    localStorage.setItem("voiceMessages", JSON.stringify(voices));
    loadMessages();
  }
  window.saveLanguage = function(lang) {
    const langs = JSON.parse(localStorage.getItem("languagesUsed")) || [];
    if (!langs.includes(lang)) {
      langs.push(lang);
      localStorage.setItem("languagesUsed", JSON.stringify(langs));
      loadMessages();
    }
  }

  // ===== DELETE ALL MESSAGES =====
  if (deleteAllBtn) {
    deleteAllBtn.addEventListener("click", async () => {
      if (!confirm("Are you sure you want to delete all messages? ❌")) return;

      try {
        const res = await fetch(`https://robo-t52y.onrender.com/messages/delete_all/${userId}`, {
          method: "DELETE"
        });

        const data = await res.json();
        if (res.ok && data.success) {
          messagesContainer.innerHTML = "";
          if (msgCountEl) msgCountEl.textContent = "0";
          alert("All messages deleted ✅");

          // clear voice messages and languages in localStorage
          localStorage.setItem("voiceMessages", JSON.stringify([]));
          localStorage.setItem("languagesUsed", JSON.stringify([]));
          if (voiceCountEl) voiceCountEl.textContent = "0";
          if (langCountEl) langCountEl.textContent = "0";

        } else {
          alert(data.error || "Failed to delete messages ❌");
        }
      } catch (err) {
        console.error("Delete all messages error ❌", err);
        alert("Something went wrong ❌");
      }
    });
  }

});