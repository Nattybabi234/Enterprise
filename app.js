// Mobile Menu Toggle
const menu = document.querySelector('#mobile-menu');
const menuLinks = document.querySelector('.navbar__menu');

menu.addEventListener('click', () => {
    menu.classList.toggle('is-active');
    menuLinks.classList.toggle('active');
});

// Dark Mode Toggle
const toggle = document.getElementById('darkModeToggle');
toggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    toggle.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
});

const signUpForm = document.querySelector("#sign-up-form");

signUpForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.querySelector("#email").value;
  const password = document.querySelector("#password").value;

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    alert("Sign up successful!");
    window.location.href = "/thank-you.html"; // or redirect elsewhere
  } catch (error) {
    alert("Error: " + error.message);
  }
});

const signInForm = document.querySelector("#sign-in-form");

signInForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.querySelector("#email").value;
  const password = document.querySelector("#password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Signed in!");
    window.location.href = "/dashboard.html"; // or wherever you want
  } catch (error) {
    alert("Sign in failed: " + error.message);
  }
});
