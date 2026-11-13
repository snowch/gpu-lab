// Copyright © 2026 Christopher Snow.
// Decorative SVGs supplement the headings; their text remains the accessible name.
const paths={
 recap:'<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9 5 3-5 3Z"/>',
 desktop:'<rect x="3" y="4" width="18" height="16" rx="3"/><path d="m7 9 3 3-3 3m6 0h4"/>',
 references:'<path d="M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Zm0 0v14"/>',
 documentation:'<circle cx="12" cy="12" r="9"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5Z"/>',
};
export function sectionIcon(kind){
 if(!paths[kind])throw new Error('Unknown section role: '+kind);
 return `<span class="section-cue-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" focusable="false">${paths[kind]}</svg></span>`;
}
export const sectionHeading=(kind,title,id='')=>`<h2 class="section-cue-heading"${id?` id="${id}"`:''}>${sectionIcon(kind)}<span>${title}</span></h2>`;
