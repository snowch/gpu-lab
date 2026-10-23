// Copyright © 2026 Christopher Snow.
import './course-nav.mjs';
const control = document.getElementById('theme');
function apply(theme) {
  document.documentElement.dataset.theme = theme;
  control.textContent = theme === 'dark' ? 'Light theme' : 'Dark theme';
}
let saved;
try { saved = localStorage.getItem('gpu-lab-theme'); } catch { /* Storage is optional. */ }
apply(['light', 'dark'].includes(saved) ? saved : matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
control.addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  apply(theme);
  try { localStorage.setItem('gpu-lab-theme', theme); } catch { /* Storage is optional. */ }
});
