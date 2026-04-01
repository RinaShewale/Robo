// ===================== SAFE HELPER =====================
function safe(el, cb) {
    if (el) cb(el);
}

// ===================== GSAP Setup =====================
if (typeof gsap !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

// ===================== Navbar Toggle =====================
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector("nav ul");
const signBtnContainer = document.querySelector(".btn1");

safe(menuToggle, () => {
    menuToggle.addEventListener("click", () => {
        safe(navLinks, el => el.classList.toggle("active"));
        document.body.classList.toggle("no-scroll");
        menuToggle.classList.toggle("open");
        safe(signBtnContainer, el => el.classList.toggle("active"));
    });
});

const navItems = document.querySelectorAll("nav ul li a");
navItems.forEach(link => {
    link.addEventListener("click", () => {
        safe(navLinks, el => el.classList.remove("active"));
        document.body.classList.remove("no-scroll");
        safe(menuToggle, el => el.classList.remove("open"));
        safe(signBtnContainer, el => el.classList.remove("active"));
    });
});

// ===================== Membership Section =====================
const elements = document.querySelectorAll('.view3 *');
elements.forEach(el => {
    el.style.pointerEvents = 'none';
    el.style.transform = 'none';
    el.style.transition = 'none';
    el.style.boxShadow = 'none';

    el.addEventListener('mouseenter', e => {
        e.stopPropagation();
    });

    el.addEventListener('click', e => e.preventDefault());
});

// ===================== Hero Section Animations =====================
const heroHeading = document.querySelector(".view1 h1");
const heroPara = document.querySelector(".view1 p");

if (typeof gsap !== "undefined") {
    if (heroHeading) {
        gsap.fromTo(heroHeading,
            { y: 0, opacity: 1, scale: 1 },
            {
                y: -100,
                scale: 0.9,
                opacity: 0.8,
                duration: 1.5,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: ".view1",
                    start: "top top",
                    end: "bottom top",
                    scrub: 0.5
                }
            }
        );
    }

    if (heroPara) {
        gsap.fromTo(heroPara,
            { y: 0, opacity: 1, scale: 1 },
            {
                y: -50,
                scale: 0.95,
                opacity: 0.9,
                duration: 1.5,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: ".view1",
                    start: "top top",
                    end: "bottom top",
                    scrub: 0.5
                }
            }
        );
    }
}

// ===================== Membership Cards Animation =====================
if (typeof gsap !== "undefined") {
    gsap.utils.toArray(".content").forEach((card, i) => {

        gsap.from(card, {
            opacity: 0,
            y: 50,
            duration: 1,
            delay: i * 0.2,
            ease: "power3.out",
            scrollTrigger: {
                trigger: card,
                start: "top 80%",
                toggleActions: "play none none reverse"
            }
        });

        card.addEventListener("mouseenter", () => {
            gsap.to(card, {
                scale: 1.05,
                boxShadow: "0 20px 40px rgba(193,56,92,0.41), 0 0 20px #cf204f",
                duration: 0.3
            });
        });

        card.addEventListener("mouseleave", () => {
            gsap.to(card, {
                scale: 1,
                boxShadow: "none",
                duration: 0.3
            });
        });
    });
}

// ===================== Auth UI (Login / Logout) =====================
document.addEventListener('DOMContentLoaded', () => {

    const loggedIn = localStorage.getItem("loggedIn");

    const navSignIn = document.getElementById("nav-signin");
    const navLogout = document.getElementById("nav-logout");
    const btnSignIn = document.getElementById("btn-signin");
    const btnLogout = document.getElementById("btn-logout");

    if (loggedIn === "true") {
        safe(navSignIn, el => el.style.display = "none");
        safe(btnSignIn, el => el.style.display = "none");

        safe(navLogout, el => el.style.display = "inline-block");
        safe(btnLogout, el => el.style.display = "inline-block");
    } else {
        safe(navSignIn, el => el.style.display = "inline-block");
        safe(btnSignIn, el => el.style.display = "inline-block");

        safe(navLogout, el => el.style.display = "none");
        safe(btnLogout, el => el.style.display = "none");
    }

    const logoutHandler = () => {
        localStorage.removeItem("loggedIn");
        localStorage.removeItem("username");
        alert("Logged out!");
        window.location.href = "login.html";
    };

    safe(navLogout, el => el.addEventListener("click", logoutHandler));
    safe(btnLogout, el => el.addEventListener("click", logoutHandler));
});

// ===================== Profile Avatar =====================
document.addEventListener("DOMContentLoaded", () => {

    const loggedIn = localStorage.getItem("loggedIn");
    const username = localStorage.getItem("username");

    const signBtn = document.getElementById("btn-signin");
    const signLink = document.getElementById("signin-link");

    if (loggedIn === "true" && username && signBtn) {

        const firstLetter = username.charAt(0).toUpperCase();

        if (signLink) signLink.removeAttribute("href");

        signBtn.textContent = firstLetter;
        signBtn.style.cssText = `
            width:42px;height:42px;border-radius:50%;
            background:#cf204f;color:white;font-weight:bold;
            display:flex;align-items:center;justify-content:center;
            cursor:pointer;
        `;

        const popup = document.createElement("div");
        popup.classList.add("profile-popup");

        popup.innerHTML = `
        <button id="profile-btn">Profile</button>
        <button id="logout-btn">Logout</button>
        `;

        document.body.appendChild(popup);

        signBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            popup.style.display =
                popup.style.display === "flex" ? "none" : "flex";
        });

        const profileBtn = document.getElementById("profile-btn");
        const logoutBtn = document.getElementById("logout-btn");

        safe(profileBtn, el => el.onclick = () => window.location.href = "profile.html");

        safe(logoutBtn, el => el.onclick = () => {
            localStorage.clear();
            alert("Logged out");
            window.location.href = "login.html";
        });

        document.addEventListener("click", () => {
            popup.style.display = "none";
        });
    }
});