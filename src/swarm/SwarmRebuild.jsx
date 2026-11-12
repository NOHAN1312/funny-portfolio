/**
 * SwarmRebuild — Joratali Engineering.
 *
 * A swarm of four nameless, coloured cursors rebuilds this site live:
 * on load it builds the navbar and the hero window, then builds each
 * section as it scrolls into view — the same idea as the Swarm Rebuild
 * extension, adapted to this site's own Win98 windows.
 *
 * How it works (no DOM text is ever rewritten, no React state is
 * touched, no copy / project data / form behaviour changes):
 *  - Target sections stay in the DOM for SEO, but are visually hidden
 *    ("ghost state") until a cursor builds them. The gate is a
 *    `data-swarm-built` attribute, which React never manages, so a
 *    re-render can never wipe it away.
 *  - The existing `.reveal` IntersectionObserver is left alone; the
 *    swarm CSS simply keeps `.reveal` invisible while the swarm is
 *    active and the section is not built yet.
 *  - Each build step is a small choreography: a cursor changes shape
 *    (crosshair for boxes, I-beam for typing, pen for lines), draws a
 *    box with a live W x H badge, a red ruler guide snaps in, a
 *    blinking caret "types" across the heading while mechanical
 *    keyboard sounds play, then the real section sweeps in
 *    top-to-bottom. Repeated cards are built as duplicates with a red
 *    spacing measurement.
 *  - ParticleText and SpiderClock are NOT rebuilt; they stay live.
 *  - prefers-reduced-motion shows the whole site instantly, with no
 *    sound and no overlay.
 */

import { useEffect, useRef, useState } from 'react';
import { SwarmSound } from './swarmSound';
import './swarm.css';

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3];
const DEFAULT_SPEED_IX = 3; // 1x
const COLORS = ['#F24E1E', '#A259FF', '#1ABCFE', '#0ACF83'];

// Speed fix (2026-11-07): the 1x base pacing was so slow that a full
// build took ~6 minutes on the live site (hero ~20s, ~2min stall at
// 6/7). All waits below are divided by the speed stepper, so -/+
// still scales everything. Hard cap per section: SECTION_BUDGET_MS.
//
// PR #3 (2026-11-12) — why the 4s cap did NOT cap live time:
// the cap only bounds the choreography AFTER a section's build starts.
// It does not bound (a) bundle load + React hydration before startRun,
// (b) the 700ms orbit intro, (c) time spent waiting in the serial
// queue behind earlier sections, or (d) — biggest — time waiting for
// the IntersectionObserver to fire, which needs the section to scroll
// into view. On desktop there was NO auto-advance at all: a visitor
// who never scrolled sat at 2/7 forever, and every live check's wall
// clock was dominated by waiting between scrolls. The live bundle was
// verified to BE the PR #2 build (asset hash index-DyKkcqGp.js matches
// a fresh local build of main@14c0342b), so this is runtime gating,
// not a stale deploy. PR #3 therefore adds: a gentle auto-tour on
// every viewport once the hero is built (stops on user scroll/wheel),
// try/finally + watchdog so a stalled section can never stick the
// counter, and a one-item Contact build.
const SECTION_BUDGET_MS = 4000;
// Watchdog: a section may not sit in `building` longer than this.
const WATCHDOG_MS = 10000;
// Beat after the hero finishes before the auto-tour starts moving.
const AUTO_TOUR_DELAY_MS = 2500;

const SECTIONS = [
  { id: 'nav', label: 'ন্যাভবার' },
  { id: 'hero', label: 'হিরো' },
  { id: 'skills', label: 'স্কিলস' },
  { id: 'projects', label: 'প্রজেক্টস' },
  { id: 'process', label: 'পদ্ধতি' },
  { id: 'victims', label: 'ভিক্টিমগণ' },
  { id: 'contact', label: 'কনট্যাক্ট' },
];
const SECTION_IDS = SECTIONS.map((s) => s.id);

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);

function arrowSvg(color) {
  return `<svg viewBox="0 0 24 24"><path d="M4.6 3.9 C4.2 3.1 4.9 2.4 5.7 2.8 L20.6 9.4 C21.5 9.8 21.4 11.1 20.4 11.3 L13.9 12.9 C13.4 13 13 13.4 12.9 13.9 L11.3 20.4 C11.1 21.4 9.8 21.5 9.4 20.6 Z" fill="${color}" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
}
function crossSvg(color) {
  return `<svg viewBox="0 0 24 24"><g stroke-linecap="round"><path d="M12 3.5 V20.5 M3.5 12 H20.5" stroke="#fff" stroke-width="3.6"/><path d="M12 3.5 V20.5 M3.5 12 H20.5" stroke="${color}" stroke-width="1.5"/></g></svg>`;
}
function ibeamSvg(color) {
  const d =
    'M8.5 4.5 H10.5 Q12 4.5 12 6 Q12 4.5 13.5 4.5 H15.5 M12 6 V18 M8.5 19.5 H10.5 Q12 19.5 12 18 Q12 19.5 13.5 19.5 H15.5';
  return `<svg viewBox="0 0 24 24"><g fill="none" stroke-linecap="round"><path d="${d}" stroke="#fff" stroke-width="3.6"/><path d="${d}" stroke="${color}" stroke-width="1.5"/></g></svg>`;
}
function penSvg(color) {
  return `<svg viewBox="0 0 24 24"><path d="M17.4 10.6 L20.6 13.8 L13.8 20.6 L10.6 17.4 Z" fill="${color}" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/><path d="M3 3 L13.1 6.3 L17.4 10.6 L10.6 17.4 L6.3 13.1 Z" fill="${color}" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/><path d="M3.6 3.6 L8.9 8.9" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/></svg>`;
}
const SHAPE_SVG = { arrow: arrowSvg, cross: crossSvg, ibeam: ibeamSvg, pen: penSvg };

export default function SwarmRebuild() {
  const [reducedMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [speedIx, setSpeedIx] = useState(DEFAULT_SPEED_IX);
  const [soundOn, setSoundOn] = useState(true);
  const [soundBlocked, setSoundBlocked] = useState(true);
  const [phase, setPhase] = useState('building'); // building | done | live
  const [tourOn, setTourOn] = useState(false);
  const [builtCount, setBuiltCount] = useState(0);
  const [currentLabel, setCurrentLabel] = useState('তৈরি হচ্ছে…');

  const speedRef = useRef(SPEEDS[DEFAULT_SPEED_IX]);
  const soundRef = useRef(null);
  const tokenRef = useRef(0);
  const builtRef = useRef(new Set());
  const buildingRef = useRef(new Set());
  const buildStartRef = useRef(new Map()); // section id -> Date.now() when its build started
  const retryRef = useRef(new Set()); // sections already retried once after a throw
  const pendingRef = useRef(0); // sections enqueued but not yet settled (queue not idle)
  const sectionWatcherRef = useRef(null); // MutationObserver for late-mounted sections
  const skipRef = useRef(new Set()); // sections released early (timeout / catch-up)
  const queueRef = useRef(Promise.resolve());
  const tourRef = useRef(false);
  const phaseRef = useRef('building');
  const mouseRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const userScrolledRef = useRef(false);

  const cursorElsRef = useRef([]);
  const cursorsRef = useRef(
    COLORS.map((color, i) => ({
      color,
      x: -100,
      y: -100,
      tx: window.innerWidth / 2,
      ty: 120,
      shape: 'arrow',
      angle: (i / COLORS.length) * Math.PI * 2,
    })),
  );
  const boxRef = useRef(null);
  const badgeRef = useRef(null);
  const guideRef = useRef(null);
  const caretRef = useRef(null);
  const spacingRef = useRef(null);
  const observerRef = useRef(null);
  const rafRef = useRef(0);

  speedRef.current = SPEEDS[speedIx];
  phaseRef.current = phase;

  const sleep = (ms) => {
    const token = tokenRef.current;
    return new Promise((resolve) => {
      const t = setTimeout(() => resolve(tokenRef.current === token), Math.max(0, ms));
      // If the run is cancelled, resolve early on the next tick check.
      void t;
    });
  };

  const sfx = () => {
    if (!soundRef.current) {
      soundRef.current = new SwarmSound();
      soundRef.current.init();
    }
    return soundRef.current;
  };

  const setCursorShape = (i, shape) => {
    const c = cursorsRef.current[i];
    if (!c || c.shape === shape) return;
    c.shape = shape;
    const el = cursorElsRef.current[i];
    if (el) el.innerHTML = SHAPE_SVG[shape](c.color);
  };

  const moveCursorTo = async (i, x, y, shape) => {
    const c = cursorsRef.current[i];
    if (!c) return;
    if (shape) setCursorShape(i, shape);
    c.tx = clamp(x, 8, window.innerWidth - 8);
    c.ty = clamp(y, 8, window.innerHeight - 8);
    const dist = Math.hypot(c.tx - c.x, c.ty - c.y);
    const dur = clamp(dist / 2.2, 80, 260) / speedRef.current;
    await sleep(dur);
  };

  const hoverOthers = (i, rect) => {
    cursorsRef.current.forEach((c, j) => {
      if (j === i) return;
      c.tx = clamp(rect.left + rand(0.1, 0.9) * rect.width, 8, window.innerWidth - 8);
      c.ty = clamp(rect.top + rand(0.1, 0.9) * rect.height, 8, window.innerHeight - 8);
    });
  };

  const showDrawBox = (rect) => {
    const box = boxRef.current;
    const badge = badgeRef.current;
    if (!box || !badge) return;
    box.style.display = 'block';
    box.style.left = `${rect.left}px`;
    box.style.top = `${rect.top}px`;
    box.style.width = '4px';
    box.style.height = '4px';
    badge.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)}`;
    box.animate(
      [
        { width: '4px', height: '4px' },
        { width: `${rect.width}px`, height: `${rect.height}px` },
      ],
      { duration: 140 / speedRef.current, easing: 'ease-out', fill: 'forwards' },
    );
  };

  const hideDrawBox = () => {
    if (boxRef.current) boxRef.current.style.display = 'none';
  };

  const showGuide = async (rect) => {
    const g = guideRef.current;
    if (!g) return;
    g.style.display = 'block';
    g.style.left = `${Math.max(0, rect.left - 24)}px`;
    g.style.top = `${rect.top - 6}px`;
    g.style.width = '0px';
    g.animate([{ width: '0px' }, { width: `${rect.width + 48}px` }], {
      duration: 150 / speedRef.current,
      easing: 'ease-out',
      fill: 'forwards',
    });
    await sleep(150 / speedRef.current);
    sfx().snap(rect.left + rect.width / 2, window.innerWidth);
    await sleep(50 / speedRef.current);
    g.style.display = 'none';
  };

  const typeAcross = async (cursorIx, rect, text) => {
    const caret = caretRef.current;
    const steps = Math.min(Math.max(text ? text.length : 12, 8), 16);
    const c = cursorsRef.current[cursorIx];
    if (!c) return;
    setCursorShape(cursorIx, 'ibeam');
    if (caret) {
      caret.style.display = 'block';
      caret.style.top = `${rect.top + rect.height / 2 - 11}px`;
    }
    for (let k = 0; k < steps; k++) {
      const x = rect.left + 6 + (k / steps) * Math.max(0, rect.width - 12);
      const y = rect.top + rect.height / 2;
      c.tx = x;
      c.ty = y;
      if (caret) caret.style.left = `${x + 8}px`;
      const ch = text ? text[Math.floor((k / steps) * text.length)] : '';
      sfx().key(x, window.innerWidth, `type-${cursorIx}`, 1, ch === ' ' ? 1 : 0);
      if (k % 6 === 5) sfx().grow(Math.floor(k / 6), x, window.innerWidth);
      await sleep(10 / speedRef.current);
    }
    if (caret) caret.style.display = 'none';
    setCursorShape(cursorIx, 'arrow');
  };

  const releaseEl = (el, kind) => {
    if (!el) return;
    el.dataset.swarmBuilt = '1';
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      el.animate(
        [{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)' }],
        { duration: 250 / speedRef.current, easing: 'ease-out' },
      );
    }
    if (kind) {
      sfx().place(kind, rect.left + rect.width / 2, rect.top, rect.width, rect.height, window.innerWidth, window.innerHeight);
    }
  };

  const drawItem = async (cursorIx, el, kind, isDup, prevRect) => {
    const rect = el.getBoundingClientRect();
    if (rect.width < 4 || rect.height < 4) return;
    await moveCursorTo(cursorIx, rect.left + 8, rect.top + 8, 'cross');
    sfx().press(rect.left, window.innerWidth);
    showDrawBox(rect);
    await sleep(90 / speedRef.current);
    hideDrawBox();
    if (isDup && prevRect) {
      const sp = spacingRef.current;
      if (sp) {
        sp.style.display = 'block';
        sp.style.left = `${rect.left}px`;
        sp.style.top = `${Math.max(8, rect.top - 26)}px`;
        sp.textContent = `↔ ${Math.round(Math.abs(rect.top - prevRect.bottom))}px`;
        await sleep(80 / speedRef.current);
        sp.style.display = 'none';
      }
      sfx().place('dup', rect.left + rect.width / 2, rect.top, rect.width, rect.height, window.innerWidth, window.innerHeight);
    }
    releaseEl(el, kind === 'image' ? 'image' : 'rect');
    await sleep(50 / speedRef.current);
  };

  // Items drawn one-by-one inside a section (victims/projects/process/skills).
  // NOTE: skills uses a direct-child selector — `#skills .grid .win98-inset`
  // also matched the 4 progress bars nested inside the 4 skill cards
  // (App.jsx), so skills used to draw 8 items instead of 4.
  const itemSelectorFor = (section) => {
    if (section.id === 'projects') return '#projects .win98-window';
    if (section.id === 'victims') return '#victims .win98-window';
    if (section.id === 'process') return '#process .win98-box';
    if (section.id === 'skills') return '#skills .grid > .win98-inset';
    return null;
  };

  const sectionItems = (section) => {
    const sel = itemSelectorFor(section);
    return sel ? Array.from(document.querySelectorAll(sel)) : [];
  };

  // Mark a whole section (and every item inside it) built at once, with
  // no choreography. Used for the hard timeout and for catching up when
  // the visitor has already scrolled past a section.
  const releaseSectionNow = (section) => {
    const el =
      section.id === 'nav' ? document.querySelector('nav') : document.getElementById(section.id);
    if (el) {
      sectionItems(section).forEach((item) => {
        item.dataset.swarmBuilt = '1';
      });
      el.dataset.swarmBuilt = '1';
    }
    skipRef.current.add(section.id);
    builtRef.current.add(section.id);
    buildingRef.current.delete(section.id);
    buildStartRef.current.delete(section.id);
    setBuiltCount(builtRef.current.size);
    if (builtRef.current.size >= SECTIONS.length && phaseRef.current === 'building') {
      setPhase('done');
      setCurrentLabel('সব তৈরি!');
      sfx().finale();
    }
  };

  // Earlier sections the visitor has scrolled past: release them instantly
  // so the section actually on screen can build right away instead of
  // waiting behind a queue of unseen sections.
  const releaseEarlierSections = (section) => {
    const ix = SECTIONS.findIndex((s) => s.id === section.id);
    for (let i = 0; i < ix; i++) {
      const earlier = SECTIONS[i];
      if (!builtRef.current.has(earlier.id)) releaseSectionNow(earlier);
    }
  };

  // One build attempt. The wrapper owns the `building` bookkeeping with
  // try/finally, so a step that throws can NEVER leak the entry: before
  // PR #3 a throw left the section in buildingRef, enqueueBuild then
  // refused it forever ("already building"), the queue never retried
  // it, and the section stayed ghost-hidden with the counter stuck —
  // while the queue's .catch(()=>{}) swallowed the error silently.
  const buildSection = async (section) => {
    buildStartRef.current.set(section.id, Date.now());
    try {
      await buildSectionOnce(section);
    } finally {
      buildingRef.current.delete(section.id);
      buildStartRef.current.delete(section.id);
      pendingRef.current = Math.max(0, pendingRef.current - 1);
    }
  };

  const buildSectionOnce = async (section) => {
    const token = tokenRef.current;
    const startedAt = Date.now();
    // Stop choreographing if this run was cancelled, released early, or
    // ran past the hard per-section budget.
    const aborted = () => tokenRef.current !== token || skipRef.current.has(section.id);
    const overBudget = () => Date.now() - startedAt > SECTION_BUDGET_MS;
    const finishFast = () => releaseSectionNow(section);
    if (skipRef.current.has(section.id)) return;
    const el =
      section.id === 'nav' ? document.querySelector('nav') : document.getElementById(section.id);
    if (!el) {
      builtRef.current.add(section.id);
      setBuiltCount(builtRef.current.size);
      return;
    }
    if (builtRef.current.has(section.id)) return;
    setCurrentLabel(`${section.label} বানানো হচ্ছে…`);
    const rect = el.getBoundingClientRect();
    const lead = SECTIONS.findIndex((s) => s.id === section.id) % COLORS.length;

    // 1. Draw the section box with a crosshair + live W x H badge.
    await moveCursorTo(lead, rect.left + 10, rect.top + 10, 'cross');
    if (aborted()) return;
    if (overBudget()) return finishFast();
    hoverOthers(lead, rect);
    sfx().press(rect.left, window.innerWidth);
    showDrawBox(rect);
    await sleep(120 / speedRef.current);
    hideDrawBox();

    // 2. Ruler guide + typing across the heading.
    const heading = el.querySelector('h1, h2');
    if (heading) {
      const hRect = heading.getBoundingClientRect();
      if (hRect.width > 0) {
        await showGuide(hRect);
        if (aborted()) return;
        if (overBudget()) return finishFast();
        await typeAcross(lead, hRect, heading.textContent || '');
        if (aborted()) return;
        if (overBudget()) return finishFast();
      }
    }

    // 3. Build the repeated items inside, one by one.
    const items = sectionItems(section);
    let prevRect = null;
    for (let i = 0; i < items.length; i++) {
      if (aborted()) return;
      if (overBudget()) return finishFast();
      const item = items[i];
      if (item.dataset.swarmBuilt) {
        prevRect = item.getBoundingClientRect();
        continue;
      }
      const cursorIx = (lead + i + 1) % COLORS.length;
      await drawItem(cursorIx, item, 'rect', i > 0, prevRect);
      prevRect = item.getBoundingClientRect();
    }

    // Contact form: ONE box for the whole form — never type into it,
    // and never draw each input separately. Drawing every field made
    // 7/7 the slowest step; the form stays exactly as the user built it.
    if (section.id === 'contact') {
      const form = el.querySelector('form');
      if (form) {
        if (aborted()) return;
        if (overBudget()) return finishFast();
        await drawItem(lead, form, 'rect', false, null);
      }
    }

    // Hero preview image sweeps in top-to-bottom with the section.
    if (section.id === 'hero') {
      const img = el.querySelector('img');
      if (img) {
        const r = img.getBoundingClientRect();
        sfx().place('image', r.left + r.width / 2, r.top, r.width, r.height, window.innerWidth, window.innerHeight);
      }
    }

    // 4. Release the real section. (buildSection's finally removes the
    // `building` entry, so this path never has to.)
    releaseEl(el, 'rect');
    builtRef.current.add(section.id);
    setBuiltCount(builtRef.current.size);
    await sleep(60 / speedRef.current);

    if (builtRef.current.size >= SECTIONS.length) {
      setPhase('done');
      setCurrentLabel('সব তৈরি!');
      sfx().finale();
    }
  };

  const enqueueBuild = (section) => {
    if (builtRef.current.has(section.id) || buildingRef.current.has(section.id)) return queueRef.current;
    buildingRef.current.add(section.id);
    pendingRef.current += 1;
    queueRef.current = queueRef.current
      .then(() => buildSection(section))
      .catch((err) => {
        // A failed build is retried ONCE, then force-released visible —
        // it must never sit in `building` forever. Errors are logged,
        // not swallowed: the old silent .catch(()=>{}) hid the stall.
        // The retry's own failure is caught too, so the queue chain
        // itself never rejects and later sections are never blamed.
        console.warn('[swarm] build failed for section:', section.id, err);
        if (!retryRef.current.has(section.id)) {
          retryRef.current.add(section.id);
          buildingRef.current.add(section.id);
          pendingRef.current += 1;
          return buildSection(section).catch((err2) => {
            console.warn('[swarm] build failed twice, force-releasing section:', section.id, err2);
            releaseSectionNow(section);
          });
        }
        console.warn('[swarm] build failed twice, force-releasing section:', section.id);
        releaseSectionNow(section);
      });
    return queueRef.current;
  };

  const markAllBuilt = () => {
    document.querySelectorAll('.reveal, nav').forEach((el) => {
      el.dataset.swarmBuilt = '1';
    });
    document
      .querySelectorAll('#projects .win98-window, #victims .win98-window, #skills .grid > .win98-inset, #process .win98-box')
      .forEach((el) => {
        el.dataset.swarmBuilt = '1';
      });
    SECTIONS.forEach((s) => builtRef.current.add(s.id));
    setBuiltCount(builtRef.current.size);
  };

  const goLive = () => {
    tokenRef.current += 1;
    tourRef.current = false;
    setTourOn(false);
    buildStartRef.current = new Map();
    retryRef.current = new Set();
    pendingRef.current = 0;
    markAllBuilt();
    document.documentElement.classList.remove('swarm-active');
    setPhase('live');
    setCurrentLabel('লাইভ — আসল সাইট');
    sfx().release();
  };

  const replay = () => {
    tokenRef.current += 1;
    tourRef.current = false;
    setTourOn(false);
    document
      .querySelectorAll('[data-swarm-built]')
      .forEach((el) => delete el.dataset.swarmBuilt);
    builtRef.current = new Set();
    buildingRef.current = new Set();
    buildStartRef.current = new Map();
    retryRef.current = new Set();
    pendingRef.current = 0;
    skipRef.current = new Set();
    setBuiltCount(0);
    setPhase('building');
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.documentElement.classList.add('swarm-active');
    queueRef.current = Promise.resolve();
    void startRun(true);
  };

  const startRun = async (isReplay) => {
    const token = tokenRef.current;
    // Anything that is not a build target behaves exactly as before.
    document.querySelectorAll('.reveal').forEach((el) => {
      if (!SECTION_IDS.includes(el.id)) el.dataset.swarmBuilt = '1';
    });
    document.documentElement.classList.add('swarm-active');
    sfx().init();
    sfx().intro();
    // Intro: cursors orbit the logo, then fan out.
    const cx = window.innerWidth / 2;
    const cy = 110;
    const orbitStart = performance.now();
    const orbit = () => {
      if (tokenRef.current !== token) return;
      const t = (performance.now() - orbitStart) / 1000;
      cursorsRef.current.forEach((c) => {
        const a = c.angle + t * 1.6;
        const r = Math.max(30, 90 - t * 30);
        c.tx = cx + Math.cos(a) * r;
        c.ty = cy + Math.sin(a) * r * 0.6;
      });
      if (performance.now() - orbitStart < 400) requestAnimationFrame(orbit);
    };
    orbit();
    await sleep(isReplay ? 300 : 400);
    if (tokenRef.current !== token) return;
    sfx().start();
    // Observe first, so a fast scroll during the hero build is not missed.
    // A section that enters view jumps the queue: anything earlier that
    // the visitor already scrolled past is released instantly, then the
    // section on screen builds right away.
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const sec = SECTIONS.find((s) => s.id === entry.target.id);
          if (!sec) return;
          releaseEarlierSections(sec);
          enqueueBuild(sec);
        });
      },
      // Low threshold on purpose: on a phone a tall section (victims
      // with 11 cards in one column) can never reach 15% visibility,
      // so it would never start building at all.
      { threshold: 0.05, rootMargin: '0px 0px -10% 0px' },
    );
    observerRef.current = observer;
    SECTIONS.slice(2).forEach((sec) => {
      const el = document.getElementById(sec.id);
      if (el) observer.observe(el);
    });
    // Sections mount late when a window was closed and is restored
    // (App.jsx renders hero/skills/process/contact only when not
    // closed). The one-time observer above never sees them, so they
    // would mount ghost-hidden and never build. Watch for them and
    // observe + start any that is already in view.
    if (window.MutationObserver) {
      const watcher = new MutationObserver(() => {
        SECTIONS.slice(2).forEach((sec) => {
          const el = document.getElementById(sec.id);
          if (!el) return;
          observer.observe(el);
          const r = el.getBoundingClientRect();
          if (r.bottom > 0 && r.top < window.innerHeight * 0.9 && !builtRef.current.has(sec.id)) {
            releaseEarlierSections(sec);
            enqueueBuild(sec);
          }
        });
      });
      watcher.observe(document.body, { childList: true, subtree: true });
      sectionWatcherRef.current = watcher;
    }
    enqueueBuild(SECTIONS[0]);
    enqueueBuild(SECTIONS[1]);
    // Gentle auto-tour on EVERY viewport once the hero is built: if the
    // visitor has not scrolled, tour the rest of the page. Any wheel /
    // touch scroll stops it. Before PR #3 this existed only on mobile
    // (<720px), so on desktop a visitor who never scrolled sat at 2/7
    // forever — the main reason live builds looked minutes long.
    // (The 2.5s beat lets the visitor actually see the finished hero.)
    const waitHero = setInterval(() => {
      if (tokenRef.current !== token || phaseRef.current !== 'building') {
        clearInterval(waitHero);
        return;
      }
      if (builtRef.current.has('hero') && !userScrolledRef.current && window.scrollY < 100) {
        clearInterval(waitHero);
        setTimeout(() => {
          if (tokenRef.current !== token || phaseRef.current !== 'building' || userScrolledRef.current) return;
          setTourOn(true);
          tourRef.current = true;
          void runTour();
        }, AUTO_TOUR_DELAY_MS);
      }
    }, 500);
    setTimeout(() => clearInterval(waitHero), 60000);
  };

  const runTour = async () => {
    const token = tokenRef.current;
    while (tourRef.current && tokenRef.current === token && phaseRef.current === 'building') {
      const next = SECTIONS.find((s) => !builtRef.current.has(s.id));
      if (!next) break;
      const el = next.id === 'nav' ? document.querySelector('nav') : document.getElementById(next.id);
      if (!el) {
        builtRef.current.add(next.id);
        continue;
      }
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const started = Date.now();
      while (
        !builtRef.current.has(next.id) &&
        Date.now() - started < 4500 &&
        tourRef.current &&
        tokenRef.current === token
      ) {
        await sleep(200);
      }
      await sleep(150 / speedRef.current);
    }
    tourRef.current = false;
    setTourOn(false);
  };

  // Cursor animation loop (imperative — no React re-render at 60fps).
  useEffect(() => {
    if (reducedMotion) return undefined;
    const tick = () => {
      const mouse = mouseRef.current;
      cursorsRef.current.forEach((c, i) => {
        const el = cursorElsRef.current[i];
        if (!el) return;
        if (phaseRef.current === 'done' || phaseRef.current === 'live') {
          // Finale: flock to the real mouse.
          c.tx = mouse.x + (i - 1.5) * 26;
          c.ty = mouse.y + (i % 2 === 0 ? -14 : 16);
        }
        c.x += (c.tx - c.x) * 0.16;
        c.y += (c.ty - c.y) * 0.16;
        el.style.transform = `translate(${c.x}px, ${c.y}px)`;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [reducedMotion]);

  // Main run + global keys + sound unlock.
  useEffect(() => {
    if (reducedMotion) return undefined;
    tokenRef.current = 0;
    const onPointerMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const onUnlock = () => {
      sfx().init();
      sfx().resume();
      setSoundBlocked(!sfx().ready());
      setTimeout(() => setSoundBlocked(!sfx().ready()), 300);
    };
    const onScroll = () => {
      if (window.scrollY > 120) userScrolledRef.current = true;
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        goLive();
      } else if ((e.key === 'm' || e.key === 'M') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        setSoundOn((prev) => {
          const next = !prev;
          sfx().setOn(next);
          return next;
        });
      }
      onUnlock();
    };
    const onWheel = () => {
      userScrolledRef.current = true;
      if (tourRef.current) {
        tourRef.current = false;
        setTourOn(false);
      }
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onUnlock, true);
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('wheel', onWheel, { passive: true });
    // Victims 4-11 only render after "load more" is clicked: if the
    // victims section is already built, new cards must show at once
    // instead of arriving ghost-hidden.
    let victimsObserver = null;
    const victimsEl = document.getElementById('victims');
    if (victimsEl && window.MutationObserver) {
      victimsObserver = new MutationObserver(() => {
        if (!builtRef.current.has('victims')) return;
        victimsEl.querySelectorAll('.win98-window:not([data-swarm-built])').forEach((node) => {
          node.dataset.swarmBuilt = '1';
        });
      });
      victimsObserver.observe(victimsEl, { childList: true, subtree: true });
    }
    // Watchdog (PR #3): no section may sit in `building` for more than
    // WATCHDOG_MS. If one does — stalled mid-build, or its build never
    // started because the queue is idle and it never intersected — it
    // is force-released visible and the queue advances. Without this,
    // one stuck section hid forever and the counter stuck with it.
    const watchdog = setInterval(() => {
      if (phaseRef.current !== 'building') return;
      const now = Date.now();
      buildStartRef.current.forEach((startedAt, id) => {
        if (now - startedAt > WATCHDOG_MS) {
          const sec = SECTIONS.find((s) => s.id === id);
          console.warn('[swarm] watchdog: section stuck in building, force-releasing:', id);
          if (sec) releaseSectionNow(sec);
        }
      });
      // Queue idle but an unbuilt section is already on screen (e.g.
      // its observer never fired): start it instead of waiting forever.
      if (pendingRef.current === 0 && buildingRef.current.size === 0) {
        const inView = SECTIONS.find((s) => {
          if (builtRef.current.has(s.id)) return false;
          const el = s.id === 'nav' ? document.querySelector('nav') : document.getElementById(s.id);
          if (!el) return false;
          const r = el.getBoundingClientRect();
          return r.bottom > 0 && r.top < window.innerHeight;
        });
        if (inView) enqueueBuild(inView);
      }
    }, 1000);
    void startRun(false);
    return () => {
      tokenRef.current = -1;
      cancelAnimationFrame(rafRef.current);
      clearInterval(watchdog);
      if (sectionWatcherRef.current) sectionWatcherRef.current.disconnect();
      if (observerRef.current) observerRef.current.disconnect();
      if (victimsObserver) victimsObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onUnlock);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('wheel', onWheel);
      // Never leave the site hidden if this component unmounts.
      document.documentElement.classList.remove('swarm-active');
      document.querySelectorAll('[data-swarm-built]').forEach((el) => {
        el.dataset.swarmBuilt = '1';
      });
      if (soundRef.current) soundRef.current.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  // Keep the sound engine in sync with the toggle.
  useEffect(() => {
    if (soundRef.current) soundRef.current.setOn(soundOn);
  }, [soundOn]);

  if (reducedMotion) return null;

  const toggleTour = () => {
    if (tourOn) {
      tourRef.current = false;
      setTourOn(false);
      return;
    }
    if (phase === 'done' || phase === 'live') return;
    tourRef.current = true;
    setTourOn(true);
    void runTour();
  };

  const toggleSound = () => {
    if (soundBlocked) {
      sfx().init();
      sfx().resume();
      setTimeout(() => setSoundBlocked(!sfx().ready()), 300);
      return;
    }
    setSoundOn((prev) => {
      const next = !prev;
      sfx().setOn(next);
      return next;
    });
  };

  const changeSpeed = (dir) => {
    setSpeedIx((ix) => clamp(ix + dir, 0, SPEEDS.length - 1));
  };

  return (
    <>
      <div className="swarm-overlay" aria-hidden="true">
        {cursorsRef.current.map((c, i) => (
          <div
            key={c.color}
            ref={(el) => {
              cursorElsRef.current[i] = el;
            }}
            className="swarm-cursor"
            dangerouslySetInnerHTML={{ __html: arrowSvg(c.color) }}
          />
        ))}
        <div ref={boxRef} className="swarm-draw-box">
          <span ref={badgeRef} className="swarm-size-badge" />
        </div>
        <div ref={guideRef} className="swarm-guide" />
        <div ref={caretRef} className="swarm-caret" />
        <div ref={spacingRef} className="swarm-spacing" />
      </div>

      <div className="swarm-toolbar" role="toolbar" aria-label="Swarm Rebuild নিয়ন্ত্রণ">
        <span className="swarm-status">
          {phase === 'live' ? 'লাইভ — আসল সাইট' : `${currentLabel} (${builtCount}/${SECTIONS.length})`}
        </span>
        <button type="button" onClick={toggleTour} disabled={phase !== 'building'} className={tourOn ? 'swarm-on' : ''}>
          {tourOn ? 'ট্যুর থামাও' : 'ট্যুর'}
        </button>
        <div className="swarm-speed">
          <button type="button" onClick={() => changeSpeed(-1)} disabled={speedIx === 0} aria-label="গতি কমাও">
            −
          </button>
          <span className="swarm-speed-label">{SPEEDS[speedIx]}×</span>
          <button
            type="button"
            onClick={() => changeSpeed(1)}
            disabled={speedIx === SPEEDS.length - 1}
            aria-label="গতি বাড়াও"
          >
            +
          </button>
        </div>
        <button type="button" onClick={toggleSound} title="সাউন্ড (M)" className="swarm-sound-btn">
          <span aria-hidden="true">{soundBlocked ? '🔊' : soundOn ? '🔊' : '🔇'}</span>
          <span className="swarm-sound-label">
            {soundBlocked ? ' শব্দের জন্য ট্যাপ করুন' : soundOn ? ' সাউন্ড' : ' নিঃশব্দ'}
          </span>
        </button>
        {phase !== 'live' && (
          <button type="button" onClick={goLive} className="swarm-primary">
            লাইভ দেখুন
          </button>
        )}
        <button type="button" onClick={replay}>
          রিপ্লে
        </button>
      </div>
    </>
  );
}
