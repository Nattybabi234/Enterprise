const darkModeToggle = document.getElementById('darkModeToggle');
const body = document.body;

darkModeToggle.addEventListener('click', () => {
  body.classList.toggle('dark');
  body.classList.toggle('light');
  darkModeToggle.textContent = body.classList.contains('dark') ? '☀️' : '🌙';
});
