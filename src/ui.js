// HTML overlay UI: dialog, quest cards, project modal, quick view, HUD bits.
// Text stays real HTML so it is crisp, selectable, accessible and indexable.
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const COLORS = ['#ff2a6d', '#00f0ff', '#ffe14d'];

export function fillStatic(content) {
  document.querySelectorAll('[data-name]').forEach((n) => (n.textContent = content.name));
  document.querySelectorAll('[data-role]').forEach((n) => (n.textContent = content.role));
  document.querySelectorAll('[data-level]').forEach((n) => (n.textContent = content.level));
  document.title = `${content.name} — Player 1 Portfolio`;
  // HUD heart icon drawn from the same pixel data as the Figma heart sprite.
  const rows = ['.KK.KK.', 'KJJKJJK', 'KJWJJJK', 'KJJJJJK', '.KJJJK.', '..KJK..', '...K...'];
  const pal = { K: '#0d0221', J: '#ff2a6d', W: '#ffffff' };
  const cv = document.createElement('canvas');
  cv.width = cv.height = 7;
  const ctx = cv.getContext('2d');
  rows.forEach((r, y) => [...r].forEach((c, x) => { if (c !== '.') { ctx.fillStyle = pal[c]; ctx.fillRect(x, y, 1, 1); } }));
  document.documentElement.style.setProperty('--heart', `url(${cv.toDataURL()})`);
}

// ---------- Dialog with typewriter text
export function createDialog() {
  const box = $('#dialog'), msg = box.querySelector('.msg'), who = box.querySelector('.speaker');
  let lines = [], i = 0, timer = null, typing = false, onDone = null;
  const type = (text) => {
    clearInterval(timer);
    msg.textContent = '';
    typing = true;
    let n = 0;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { msg.textContent = text; typing = false; return; }
    timer = setInterval(() => {
      msg.textContent = text.slice(0, ++n);
      if (n >= text.length) { clearInterval(timer); typing = false; }
    }, 22);
  };
  return {
    get open() { return !box.hidden; },
    show(speaker, l, done) {
      lines = l; i = 0; onDone = done; who.textContent = speaker;
      box.hidden = false; type(lines[0]);
    },
    next() {
      if (typing) { clearInterval(timer); msg.textContent = lines[i]; typing = false; return; }
      i++;
      if (i < lines.length) type(lines[i]);
      else { box.hidden = true; onDone && onDone(); }
    },
  };
}

// ---------- Floating quest card + prompt
export function questCardHTML(p, i) {
  return `<div class="q">${esc(p.quest)}</div><div class="t">${esc(p.title)}</div>
    <p>${esc(p.summary)}</p>
    <div class="tags">${p.tags.map((t) => `<span>${esc(t)}</span>`).join('')}</div>
    <div class="foot">[E] OPEN · REWARD ${esc(p.reward)}</div>`;
}

export function showCard(project, index, x, y, color) {
  const card = $('#card');
  if (card.dataset.index !== String(index)) {
    card.innerHTML = questCardHTML(project, index);
    card.dataset.index = index;
    card.style.setProperty('--c', color || COLORS[index % COLORS.length]);
  }
  card.hidden = false;
  card.style.left = `${x}px`;
  card.style.top = `${y}px`;
}
export function hideCard() { const c = $('#card'); c.hidden = true; c.dataset.index = ''; }

export function showPrompt(text, x, y) {
  const p = $('#prompt');
  p.textContent = text; p.hidden = false;
  p.style.left = `${x}px`; p.style.top = `${y}px`;
}
export function hidePrompt() { $('#prompt').hidden = true; }

// ---------- Overlays
let lastFocus = null;
function openOverlay(sel, html) {
  const o = $(sel);
  if (html !== undefined) o.querySelector('.body').innerHTML = html;
  lastFocus = document.activeElement;
  o.hidden = false;
  o.querySelector('[data-close], button')?.focus();
}
export function closeOverlay(sel) {
  const o = $(sel);
  if (o.hidden) return false;
  o.hidden = true;
  lastFocus?.focus?.();
  return true;
}
export const anyOverlayOpen = () => ['#modal', '#quick', '#menu'].some((s) => !$(s).hidden);

export function openProject(p, i, colors = COLORS) {
  const c = colors[i % colors.length];
  openOverlay('#modal', `
    <div class="q" style="--c:${c}">${esc(p.quest)} · REWARD ${esc(p.reward)}</div>
    <h2 id="modal-title">${esc(p.title)}</h2>
    <p>${esc(p.summary)}</p>
    <p>${esc(p.details)}</p>
    <div class="tags" style="--c:${c}">${p.tags.map((t) => `<span>${esc(t)}</span>`).join('')}</div>
    <div class="links">${p.links.map((l) => `<a href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`).join('')}</div>`);
}

export function openQuick(c) {
  const segs = (n) => Array.from({ length: 10 }, (_, k) => `<i class="${k < n ? 'on' : ''}"></i>`).join('');
  openOverlay('#quick', `
    <h2>${esc(c.name)}</h2>
    <p class="q">${esc(c.role)} · LVL ${esc(c.level)}</p>
    <p>${esc(c.tagline)}</p>
    <h3>ABOUT</h3><p>${esc(c.about)}</p>
    <h3>SKILLS</h3>
    ${c.skills.map((s) => `<div class="skill"><b>${esc(s.name)}</b><div class="segs" aria-label="${s.level} of 10">${segs(s.level)}</div><small>${esc(s.tools)}</small></div>`).join('')}
    <h3>PROJECTS</h3>
    ${c.projects.map((p) => `<p><strong>${esc(p.title)}</strong> — ${esc(p.summary)} ${p.links.map((l) => `<a href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join(' · ')}</p>`).join('')}
    <h3>EXPERIENCE</h3>
    ${c.career.map((j) => `<p><strong>${esc(j.year)}</strong> · ${esc(j.role)} @ ${esc(j.company)} — ${esc(j.note)}</p>`).join('')}
    <h3>CONTACT</h3>
    <div class="links">${c.contact.map((l) => `<a href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('')}</div>`);
}

export function openMenu(quality) {
  document.querySelectorAll('.quality button').forEach((b) => b.classList.toggle('on', b.dataset.q === quality));
  openOverlay('#menu');
}

// ---------- Section panels (each stop on the planet opens one)
const segs = (n) => Array.from({ length: 10 }, (_, k) => `<i class="${k < n ? 'on' : ''}"></i>`).join('');
export function openAbout(c) {
  openOverlay('#modal', `<div class="q">HOME · ABOUT</div><h2 id="modal-title">${esc(c.name)}</h2>
    <p class="q">${esc(c.role)} · LVL ${esc(c.level)}</p><p>${esc(c.tagline)}</p><p>${esc(c.about)}</p>`);
}
export function openSkills(c) {
  openOverlay('#modal', `<div class="q">CRYSTAL SHRINE</div><h2 id="modal-title">SKILLS</h2>
    ${c.skills.map((s) => `<div class="skill"><b>${esc(s.name)}</b><div class="segs" aria-label="${s.level} of 10">${segs(s.level)}</div><small>${esc(s.tools)}</small></div>`).join('')}`);
}
export function openCareer(c) {
  openOverlay('#modal', `<div class="q">LIGHTHOUSE</div><h2 id="modal-title">CAREER</h2>
    ${c.career.map((j) => `<h3>${esc(j.year)}</h3><p><strong>${esc(j.role)}</strong> @ ${esc(j.company)}<br>${esc(j.note)}</p>`).join('')}`);
}
export function openContact(c) {
  openOverlay('#modal', `<div class="q">CAMPFIRE</div><h2 id="modal-title">SEND A MESSAGE</h2>
    <p>Pull up a log and say hi.</p>
    <div class="links">${c.contact.map((l) => `<a href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('')}</div>`);
}

// ---------- HUD: section label + ring minimap of the planet
export function setClock(text) {
  const el = $('#clock');
  if (el && el.textContent !== text) el.textContent = text;
}
export function setSection(text) {
  const el = $('#section');
  if (el.textContent !== text) el.textContent = text;
}
export function buildRing(stations) {
  const svg = $('#ring');
  const C = 50, Rr = 36;
  const dots = stations.filter((s) => s.kind !== 'npc').map((s) => {
    const a = (s.deg * Math.PI) / 180;
    return `<rect x="${(C + Math.sin(a) * Rr - 3).toFixed(1)}" y="${(C - Math.cos(a) * Rr - 3).toFixed(1)}" width="6" height="6" fill="${s.color}"><title>${esc(s.label)}</title></rect>`;
  }).join('');
  svg.innerHTML = `<circle cx="${C}" cy="${C}" r="${Rr}" fill="none" stroke="currentColor" stroke-width="3" opacity=".35"/>
    <g id="ring-dots">${dots}</g>
    <path d="M${C - 5} ${C - Rr - 13} L${C + 5} ${C - Rr - 13} L${C} ${C - Rr - 5} Z" fill="#ffffff"/>`;
}
export function setRing(rotDeg) {
  $('#ring-dots')?.setAttribute('transform', `rotate(${(-rotDeg).toFixed(2)} 50 50)`);
}
