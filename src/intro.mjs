// Copyright © 2026 Christopher Snow.
import './theme.mjs';
function redirectLegacyLinks() {
  // Preserve links shared when these lessons were part of the introduction.
  if (['#lab', '#cuda', '#challenge', '#simulator'].includes(location.hash)) {
    location.replace(new URL(`./lessons/memory.html${location.hash}`, location.href));
  } else if (location.hash === '#meet-gpu') {
    location.replace(new URL('./lessons/meet-gpu.html', location.href));
  }
}
redirectLegacyLinks();
addEventListener('hashchange',redirectLegacyLinks);
