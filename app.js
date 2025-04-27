// ---------------------------
// Mobile Menu Toggle
// ---------------------------
const menu = document.querySelector('#mobile-menu');
const menuLinks = document.querySelector('.navbar__menu');

if (menu && menuLinks) {
  menu.addEventListener('click', () => {
    menu.classList.toggle('is-active');
    menuLinks.classList.toggle('active');
  });
}

// ---------------------------
// Dark Mode Toggle (Homepage)
// ---------------------------
const toggle = document.getElementById('darkModeToggle');
if (toggle) {
  toggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    toggle.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
  });
}

// ---------------------------
// Sign Up with Firebase
// ---------------------------
const signUpForm = document.querySelector("#sign-up-form");
if (signUpForm) {
  signUpForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.querySelector("#email").value;
    const password = document.querySelector("#password").value;

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert("Sign up successful!");
      localStorage.setItem('najazaUser', JSON.stringify({ username: email, isLoggedIn: true }));
      window.location.href = "/thank-you.html";
    } catch (error) {
      alert("Error: " + error.message);
    }
  });
}

// ---------------------------
// Sign In with Firebase
// ---------------------------
const signInForm = document.querySelector("#sign-in-form");
if (signInForm) {
  signInForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.querySelector("#email").value;
    const password = document.querySelector("#password").value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Signed in!");
      localStorage.setItem('najazaUser', JSON.stringify({ username: email, isLoggedIn: true }));
      window.location.href = "/dashboard.html";
    } catch (error) {
      alert("Sign in failed: " + error.message);
    }
  });
}

// ---------------------------
// ScrollReveal Animations
// ---------------------------
ScrollReveal().reveal('.portfolio h1', {
  duration: 1000,
  origin: 'top',
  distance: '50px',
  easing: 'ease-in-out',
  reset: false
});

ScrollReveal().reveal('.portfolio p', {
  duration: 1000,
  origin: 'bottom',
  distance: '30px',
  delay: 200,
  easing: 'ease-in-out',
  reset: false
});

ScrollReveal().reveal('.project-card', {
  duration: 1200,
  interval: 200,
  origin: 'bottom',
  distance: '40px',
  easing: 'ease-in-out',
  reset: false
});

// ---------------------------
// Dashboard Auth & UI Controls
// ---------------------------
document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('najazaUser'));

  // Redirect to sign-in if not logged in
  if (!user || !user.isLoggedIn) {
    if (window.location.pathname.includes("dashboard")) {
      window.location.href = '/signin.html';
    }
  }

  // Display username
  const usernameDisplay = document.getElementById('username');
  if (usernameDisplay && user?.username) {
    usernameDisplay.textContent = user.username;
  }

  // Theme toggle (Dashboard)
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark');
      themeToggle.textContent = document.body.classList.contains('dark') ? '🌞' : '🌙';
    });
  }

  // Sidebar toggle
  const toggleSidebar = document.getElementById('toggleSidebar');
  if (toggleSidebar) {
    toggleSidebar.addEventListener('click', () => {
      document.querySelector('.sidebar')?.classList.toggle('open');
    });
  }

  // Logout
  const logout = document.getElementById('logout');
  if (logout) {
    logout.addEventListener('click', () => {
      localStorage.removeItem('najazaUser');
      window.location.href = '/signin.html';
    });
  }
});

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBf56KIkY6197EpikJWA4J2KbPVpGGM3xY",
  authDomain: "najazachat.firebaseapp.com",
  projectId: "najazachat",
  storageBucket: "najazachat.firebasestorage.app",
  messagingSenderId: "93782128218",
  appId: "1:93782128218:web:169cf9051f2532a9664a63",
  measurementId: "G-28QPTZ86DV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const loginForm = document.getElementById("login-form");
const loginSection = document.getElementById("login-section");
const userDashboard = document.getElementById("user-dashboard");
const userNameElement = document.getElementById("user-name");
const userProjectElement = document.getElementById("user-project");
const userProgressElement = document.getElementById("user-progress");
const logoutBtn = document.getElementById("logout-btn");

const allowedAdmins = ["layeninathania@gmail.com"];

// Session persistence
auth.setPersistence(browserLocalPersistence).catch((error) => {
  console.error("Error setting persistence", error);
});

// Login Function
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      if (!allowedAdmins.includes(user.email)) {
        signOut(auth);
        alert("Access denied.");
      } else {
        loginSection.style.display = "none";
        userDashboard.style.display = "block";

        // Fetch user progress after login
        fetchUserProgress(user.email);
      }
    })
    .catch((err) => alert("Login failed: " + err.message));
});

// Fetch User Progress from Firestore
function fetchUserProgress(userEmail) {
  const userRef = doc(db, "users", userEmail);

  getDoc(userRef).then((docSnap) => {
    if (docSnap.exists()) {
      const userData = docSnap.data();
      userNameElement.textContent = userData.name;
      userProjectElement.textContent = userData.project;
      userProgressElement.textContent = userData.progress || 0;
    } else {
      console.error("No such user!");
    }
  }).catch((error) => {
    console.error("Error getting user data:", error);
  });
}

// Auth State
onAuthStateChanged(auth, (user) => {
  if (user && allowedAdmins.includes(user.email)) {
    loginSection.style.display = "none";
    userDashboard.style.display = "block";

    // Fetch user progress after login
    fetchUserProgress(user.email);
  } else {
    loginSection.style.display = "block";
    userDashboard.style.display = "none";
  }
});

// Logout
logoutBtn.addEventListener("click", () => {
  if (confirm("Are you sure you want to log out?")) {
    signOut(auth);
  }
});
