// Copyright © 2026 Christopher Snow.
import './theme.mjs';
// Preserve links shared when Lab 01 was part of the introduction.
if (['#lab', '#cuda', '#challenge', '#simulator'].includes(location.hash)) {
  location.replace(new URL(`./lessons/memory.html${location.hash}`, location.href));
}

// Keep previously shared architecture links working after moving the reference.
if (location.hash === '#meet-gpu') {
  location.replace(new URL('./lessons/meet-gpu.html', location.href));
}
