// Theme toggle
const themeToggle = document.querySelector('.theme-toggle');
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  document.documentElement.setAttribute('data-theme', savedTheme);
} else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
  document.documentElement.setAttribute('data-theme', 'dark');
} else {
  document.documentElement.setAttribute('data-theme', 'light');
}

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
});

// Auth-aware nav: swap "Sign in" for "Dashboard" if logged in
const navAuthBtn = document.querySelector('.nav-auth-btn');
if (navAuthBtn) {
  const hasKey = !!localStorage.getItem('lk_key');
  if (hasKey) {
    navAuthBtn.href = '/dashboard';
    navAuthBtn.textContent = 'Dashboard';
  } else {
    navAuthBtn.href = '/signin';
    navAuthBtn.textContent = 'Sign in';
  }
}

// Mobile nav toggle
const toggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

toggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

// Close mobile nav on link click
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
  });
});

// Scroll-fade reveal removed: it could strand cards at opacity 0 when the
// observer missed, and decorative motion is noise in this design language.
