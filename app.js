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
