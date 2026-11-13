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
 *    box with a live W x H badge and crosshair lines, a red ruler guide
 *    snaps in, a blinking caret "types" across the heading while
 *    mechanical keyboard sounds play, then the real section sweeps in
 *    top-to-bottom. Repeated cards are built as duplicates with a red
 *    spacing measurement and duplicate-slide animation.
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

// Hard per-section budget at 1x speed (~4s). A slow section is
// force-released immediately when its budget expires so it can never
// block the serial build queue.
const SECTION_BUDGET_MS = 4000;
// Watchdog: force-releases any section stuck in `building` OR stuck in
// the queue longer than 10s.
const WATCHDOG_MS = 10000;
// Auto-tour starts 2.5s after the hero is visibly built and on screen.
const AUTO_TOUR_DELAY_MS = 2500;
// Minimum time the tour lingers on each section.
const MIN_TOUR_DWELL_MS = 1200;
// Idle time after user scrolling ends before the build auto-resumes.
const SCROLL_RESUME_MS = 900;
// Max cards individually choreographed per section so 11 expanded
// victims never blow past the 4s section budget.
const MAX_CHOREOGRAPHED_ITEMS = 4;

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
const nowMs = () => Date.now();
const perfMs = () => performance.now();

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
  const queuedAtRef = useRef(new Map()); // section id -> Date.now() when enqueued
  const heroVisibleAtRef = useRef(null); // set ONLY when hero's own build completes in view
  const scrollEndTimerRef = useRef(null);
  const waitHeroTimerRef = useRef(null);
  const programmaticScrollUntilRef = useRef(0);

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

  useEffect(() => {
    speedRef.current = SPEEDS[speedIx];
  }, [speedIx]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const updatePhase = (nextPhase) => {
    phaseRef.current = nextPhase;
    setPhase(nextPhase);
  };

  const getSectionEl = (sectionId) =>
    sectionId === 'nav' ? document.querySelector('nav') : document.getElementById(sectionId);

  // Cancellable sleep: wakes early if the run token changes or if the
  // given section was force-released via skipRef.
  const sleep = (ms, sectionId) => {
    const token = tokenRef.current;
    const total = Math.max(0, ms);
    return new Promise((resolve) => {
      const started = performance.now();
      const step = () => {
        if (tokenRef.current !== token || (sectionId && skipRef.current.has(sectionId))) {
          resolve(false);
          return;
        }
        const rem = total - (performance.now() - started);
        if (rem <= 0) {
          resolve(true);
          return;
        }
        setTimeout(step, Math.min(40, rem));
      };
      setTimeout(step, Math.min(40, total));
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

  const moveCursorTo = async (i, x, y, shape, sectionId) => {
    const c = cursorsRef.current[i];
    if (!c) return;
    if (shape) setCursorShape(i, shape);
    c.tx = clamp(x, 8, window.innerWidth - 8);
    c.ty = clamp(y, 8, window.innerHeight - 8);
    const dist = Math.hypot(c.tx - c.x, c.ty - c.y);
    const dur = clamp(dist / 2.2, 70, 220) / speedRef.current;
    await sleep(dur, sectionId);
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
    box.style.setProperty('--cross-x', `${Math.round(rect.left + rect.width)}px`);
    box.style.setProperty('--cross-y', `${Math.round(rect.top + rect.height)}px`);
    badge.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)}`;
    box.animate(
      [
        { width: '4px', height: '4px' },
        { width: `${rect.width}px`, height: `${rect.height}px` },
      ],
      { duration: 130 / speedRef.current, easing: 'ease-out', fill: 'forwards' },
    );
  };

  const hideDrawBox = () => {
    if (boxRef.current) boxRef.current.style.display = 'none';
  };

  const showGuide = async (cursorIx, rect, sectionId) => {
    const g = guideRef.current;
    if (!g) return;
    setCursorShape(cursorIx, 'pen');
    g.style.display = 'block';
    g.style.left = `${Math.max(0, rect.left - 24)}px`;
    g.style.top = `${rect.top - 6}px`;
    g.style.width = '0px';
    g.animate([{ width: '0px' }, { width: `${rect.width + 48}px` }], {
      duration: 140 / speedRef.current,
      easing: 'ease-out',
      fill: 'forwards',
    });
    await sleep(140 / speedRef.current, sectionId);
    sfx().snap(rect.left + rect.width / 2, window.innerWidth);
    await sleep(40 / speedRef.current, sectionId);
    g.style.display = 'none';
  };

  const typeAcross = async (cursorIx, rect, text, sectionId) => {
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
      if (sectionId && skipRef.current.has(sectionId)) break;
      const x = rect.left + 6 + (k / steps) * Math.max(0, rect.width - 12);
      const y = rect.top + rect.height / 2;
      c.tx = x;
      c.ty = y;
      if (caret) caret.style.left = `${x + 8}px`;
      const ch = text ? text[Math.floor((k / steps) * text.length)] : '';
      sfx().key(x, window.innerWidth, `type-${cursorIx}`, 1, ch === ' ' ? 1 : 0);
      if (k % 6 === 5) sfx().grow(Math.floor(k / 6), x, window.innerWidth);
      await sleep(10 / speedRef.current, sectionId);
    }
    if (caret) caret.style.display = 'none';
    setCursorShape(cursorIx, 'arrow');
  };

  const releaseEl = (el, kind, slideFromRect) => {
    if (!el) return;
    el.dataset.swarmBuilt = '1';
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      if (slideFromRect) {
        const dx = clamp((slideFromRect.left - rect.left) * 0.35, -120, 120);
        const dy = clamp((slideFromRect.top - rect.top) * 0.35, -120, 120);
        el.animate(
          [
            { opacity: 0.25, transform: `translate(${dx}px, ${dy}px)` },
            { opacity: 1, transform: 'translate(0, 0)' },
          ],
          { duration: 220 / speedRef.current, easing: 'ease-out' },
        );
      } else {
        el.animate(
          [{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)' }],
          { duration: 240 / speedRef.current, easing: 'ease-out' },
        );
      }
    }
    if (kind) {
      sfx().place(
        kind,
        rect.left + rect.width / 2,
        rect.top,
        rect.width,
        rect.height,
        window.innerWidth,
        window.innerHeight,
      );
    }
  };

  const drawItem = async (cursorIx, el, kind, isDup, prevRect, sectionId) => {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width < 4 || rect.height < 4) {
      el.dataset.swarmBuilt = '1';
      return;
    }
    await moveCursorTo(cursorIx, rect.left + 8, rect.top + 8, 'cross', sectionId);
    if (sectionId && skipRef.current.has(sectionId)) {
      el.dataset.swarmBuilt = '1';
      return;
    }
    sfx().press(rect.left, window.innerWidth);
    showDrawBox(rect);
    await sleep(85 / speedRef.current, sectionId);
    hideDrawBox();
    if (isDup && prevRect) {
      const sp = spacingRef.current;
      if (sp) {
        sp.style.display = 'block';
        sp.style.left = `${rect.left}px`;
        sp.style.top = `${Math.max(8, rect.top - 26)}px`;
        const gap = Math.round(
          Math.abs(rect.top - prevRect.bottom) > 4
            ? Math.abs(rect.top - prevRect.bottom)
            : Math.abs(rect.left - prevRect.right),
        );
        sp.textContent = `↔ ${gap}px`;
        await sleep(75 / speedRef.current, sectionId);
        sp.style.display = 'none';
      }
      sfx().place(
        'dup',
        rect.left + rect.width / 2,
        rect.top,
        rect.width,
        rect.height,
        window.innerWidth,
        window.innerHeight,
      );
    }
    releaseEl(el, kind === 'image' ? 'image' : 'rect', isDup ? prevRect : null);
    await sleep(45 / speedRef.current, sectionId);
  };

  // Items drawn one-by-one inside a section (victims/projects/process/skills).
  // Skills uses a direct-child selector (`#skills .grid > .win98-inset`) so
  // nested progress bars inside the 4 skill cards are never double-counted.
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

  const checkAllDone = () => {
    if (builtRef.current.size >= SECTIONS.length && phaseRef.current === 'building') {
      updatePhase('done');
      setCurrentLabel('সব তৈরি!');
      hideDrawBox();
      if (guideRef.current) guideRef.current.style.display = 'none';
      if (caretRef.current) caretRef.current.style.display = 'none';
      if (spacingRef.current) spacingRef.current.style.display = 'none';
      sfx().finale();
    }
  };

  // Mark a whole section (and every item inside it) built at once, with
  // no choreography. Used for the hard timeout and for catching up when
  // the visitor has already scrolled past a section.
  // NOTE: Instant-release intentionally does NOT set heroVisibleAtRef
  // unless `markHeroSeenIfInView` is explicitly requested (e.g. when the
  // hero's own 4s budget expires while on screen).
  const releaseSectionNow = (section, markHeroSeenIfInView = false) => {
    const el = getSectionEl(section.id);
    if (el) {
      sectionItems(section).forEach((item) => {
        item.dataset.swarmBuilt = '1';
      });
      el.dataset.swarmBuilt = '1';
      if (section.id === 'hero' && markHeroSeenIfInView && heroVisibleAtRef.current === null) {
        const r = el.getBoundingClientRect();
        if (r.bottom > 0 && r.top < window.innerHeight) {
          heroVisibleAtRef.current = Date.now();
        }
      }
    }
    skipRef.current.add(section.id);
    builtRef.current.add(section.id);
    buildingRef.current.delete(section.id);
    buildStartRef.current.delete(section.id);
    queuedAtRef.current.delete(section.id);
    setBuiltCount(builtRef.current.size);
    checkAllDone();
  };

  // Earlier sections that the visitor has scrolled completely past
  // (above the viewport, r.bottom <= 0) are released instantly so the
  // section currently on screen builds right away. Sections that are
  // STILL visible in the viewport (r.bottom > 0) are never killed here.
  const releaseEarlierSections = (section) => {
    const ix = SECTIONS.findIndex((s) => s.id === section.id);
    for (let i = 0; i < ix; i++) {
      const earlier = SECTIONS[i];
      if (builtRef.current.has(earlier.id)) continue;
      const el = getSectionEl(earlier.id);
      if (!el) {
        releaseSectionNow(earlier, false);
        continue;
      }
      const r = el.getBoundingClientRect();
      if (r.bottom <= 0) {
        releaseSectionNow(earlier, false);
      }
    }
  };

  // Find the nearest unbuilt section to the current viewport so
  // scroll-end auto-resume always targets the section closest to where
  // the visitor stopped scrolling.
  const findNearestUnbuiltSection = () => {
    const unbuilt = SECTIONS.filter((s) => !builtRef.current.has(s.id));
    if (unbuilt.length === 0) return null;
    const vh = window.innerHeight;
    // 1. Prefer an unbuilt section already intersecting the viewport.
    for (const s of unbuilt) {
      const el = getSectionEl(s.id);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh) return s;
    }
    // 2. Otherwise pick the unbuilt section with minimum vertical distance
    // to the viewport, preferring sections at or below the top of the screen.
    let best = unbuilt[0];
    let bestDist = Infinity;
    for (const s of unbuilt) {
      const el = getSectionEl(s.id);
      if (!el) return s;
      const r = el.getBoundingClientRect();
      const dist = r.top >= 0 ? r.top : Math.abs(r.bottom) + vh * 0.5;
      if (dist < bestDist) {
        bestDist = dist;
        best = s;
      }
    }
    return best;
  };

  const smoothScrollToEl = (el) => {
    if (!el) return;
    programmaticScrollUntilRef.current = Date.now() + 1100;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scheduleResume = (delayMs) => {
    if (scrollEndTimerRef.current) clearTimeout(scrollEndTimerRef.current);
    const wait = typeof delayMs === 'number' ? delayMs : SCROLL_RESUME_MS / speedRef.current;
    scrollEndTimerRef.current = setTimeout(() => {
      scrollEndTimerRef.current = null;
      if (phaseRef.current !== 'building' || tourRef.current) return;
      // If a section is still building or queued when the scroll-end timer
      // fires, do NOT drop the resume on the floor — poll again shortly
      // so the next section starts within ~1-2s of the current build ending.
      if (pendingRef.current > 0 || buildingRef.current.size > 0) {
        scheduleResume(250);
        return;
      }
      const next = findNearestUnbuiltSection();
      if (!next) return;
      const el = getSectionEl(next.id);
      if (!el) {
        releaseSectionNow(next, false);
        scheduleResume(150);
        return;
      }
      const r = el.getBoundingClientRect();
      if (r.bottom <= 40 || r.top >= window.innerHeight - 40) {
        smoothScrollToEl(el);
      }
      releaseEarlierSections(next);
      enqueueBuild(next);
    }, Math.max(120, wait));
  };

  // One build attempt with a hard 4s timer and try/finally bookkeeping.
  const buildSection = async (section) => {
    buildStartRef.current.set(section.id, Date.now());
    queuedAtRef.current.delete(section.id);
    const budgetMs = Math.min(SECTION_BUDGET_MS, SECTION_BUDGET_MS / speedRef.current);
    const budgetTimer = setTimeout(() => {
      if (!builtRef.current.has(section.id) && phaseRef.current === 'building') {
        console.warn('[swarm] section exceeded 4s budget, force-releasing:', section.id);
        releaseSectionNow(section, section.id === 'hero');
      }
    }, budgetMs);
    try {
      await buildSectionOnce(section);
    } finally {
      clearTimeout(budgetTimer);
      buildingRef.current.delete(section.id);
      buildStartRef.current.delete(section.id);
      pendingRef.current = Math.max(0, pendingRef.current - 1);
      // If the queue just became completely idle while still in `building`
      // phase and the auto-tour was stopped by user scroll, schedule
      // auto-resume so the queue never stalls at 4/7 -> 5/7.
      if (
        phaseRef.current === 'building' &&
        pendingRef.current === 0 &&
        buildingRef.current.size === 0 &&
        !tourRef.current &&
        builtRef.current.size < SECTIONS.length &&
        (userScrolledRef.current || heroVisibleAtRef.current !== null)
      ) {
        scheduleResume(450 / speedRef.current);
      }
    }
  };

  const buildSectionOnce = async (section) => {
    const token = tokenRef.current;
    const startedAt = Date.now();
    const budgetMs = Math.min(SECTION_BUDGET_MS, SECTION_BUDGET_MS / speedRef.current);
    const aborted = () => tokenRef.current !== token || skipRef.current.has(section.id);
    const overBudget = () => Date.now() - startedAt > budgetMs;
    const finishFast = () => releaseSectionNow(section, section.id === 'hero');
    if (skipRef.current.has(section.id) || builtRef.current.has(section.id)) return;

    const el = getSectionEl(section.id);
    if (!el) {
      releaseSectionNow(section, false);
      return;
    }
    setCurrentLabel(`${section.label} বানানো হচ্ছে…`);
    const rect = el.getBoundingClientRect();
    const lead = SECTIONS.findIndex((s) => s.id === section.id) % COLORS.length;

    // 1. Draw the section box with a crosshair + live W x H badge.
    await moveCursorTo(lead, rect.left + 10, rect.top + 10, 'cross', section.id);
    if (aborted()) return;
    if (overBudget()) return finishFast();
    hoverOthers(lead, rect);
    sfx().press(rect.left, window.innerWidth);
    showDrawBox(rect);
    await sleep(110 / speedRef.current, section.id);
    hideDrawBox();
    if (aborted()) return;

    // 2. Ruler guide + typing across the heading.
    const heading = el.querySelector('h1, h2');
    if (heading) {
      const hRect = heading.getBoundingClientRect();
      if (hRect.width > 0 && hRect.bottom > 0 && hRect.top < window.innerHeight) {
        await showGuide(lead, hRect, section.id);
        if (aborted()) return;
        if (overBudget()) return finishFast();
        await typeAcross(lead, hRect, heading.textContent || '', section.id);
        if (aborted()) return;
        if (overBudget()) return finishFast();
      }
    }

    // 3. Build repeated items inside (capped at MAX_CHOREOGRAPHED_ITEMS so
    // an expanded 11-card Victims section still completes well under 4s).
    const allItems = sectionItems(section);
    const choreographed = allItems.slice(0, MAX_CHOREOGRAPHED_ITEMS);
    let prevRect = null;
    for (let i = 0; i < choreographed.length; i++) {
      if (aborted()) return;
      if (overBudget()) return finishFast();
      const item = choreographed[i];
      if (item.dataset.swarmBuilt) {
        prevRect = item.getBoundingClientRect();
        continue;
      }
      const cursorIx = (lead + i + 1) % COLORS.length;
      await drawItem(cursorIx, item, 'rect', i > 0, prevRect, section.id);
      prevRect = item.getBoundingClientRect();
    }

    // Contact form: ONE box for the whole form — never type into each field.
    if (section.id === 'contact') {
      const form = el.querySelector('form');
      if (form) {
        if (aborted()) return;
        if (overBudget()) return finishFast();
        await drawItem(lead, form, 'rect', false, null, section.id);
      }
    }

    // Hero preview image box: draw it as an image unit so the hero build
    // feels rich and lands right inside the ~3-5s initial load target.
    if (section.id === 'hero') {
      const imgBox = el.querySelector('img');
      if (imgBox) {
        if (aborted()) return;
        if (overBudget()) return finishFast();
        await drawItem((lead + 1) % COLORS.length, imgBox, 'image', false, null, section.id);
      }
    }

    if (aborted()) return;

    // 4. Release the real section and guarantee all child items are marked
    // built (including any extra cards or cards mounted mid-build).
    sectionItems(section).forEach((item) => {
      item.dataset.swarmBuilt = '1';
    });
    releaseEl(el, 'rect', null);

    // Hero-visible gate: record heroVisibleAtRef ONLY when the hero's own
    // build finishes while the hero is actually in the viewport.
    if (section.id === 'hero') {
      const r = el.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) {
        heroVisibleAtRef.current = Date.now();
      }
    }
    builtRef.current.add(section.id);
    setBuiltCount(builtRef.current.size);
    await sleep(50 / speedRef.current, section.id);
    checkAllDone();
  };

  const enqueueBuild = (section) => {
    if (builtRef.current.has(section.id) || buildingRef.current.has(section.id)) return queueRef.current;
    buildingRef.current.add(section.id);
    queuedAtRef.current.set(section.id, Date.now());
    pendingRef.current += 1;
    queueRef.current = queueRef.current
      .then(() => buildSection(section))
      .catch((err) => {
        console.warn('[swarm] build failed for section:', section.id, err);
        if (!retryRef.current.has(section.id)) {
          retryRef.current.add(section.id);
          buildingRef.current.add(section.id);
          queuedAtRef.current.set(section.id, Date.now());
          pendingRef.current += 1;
          return buildSection(section).catch((err2) => {
            console.warn('[swarm] build failed twice, force-releasing section:', section.id, err2);
            releaseSectionNow(section, section.id === 'hero');
          });
        }
        console.warn('[swarm] build failed twice, force-releasing section:', section.id);
        releaseSectionNow(section, section.id === 'hero');
      });
    return queueRef.current;
  };

  const markAllBuilt = () => {
    document.querySelectorAll('.reveal, nav').forEach((el) => {
      el.dataset.swarmBuilt = '1';
    });
    document
      .querySelectorAll(
        '#projects .win98-window, #victims .win98-window, #skills .grid > .win98-inset, #process .win98-box',
      )
      .forEach((el) => {
        el.dataset.swarmBuilt = '1';
      });
    SECTIONS.forEach((s) => builtRef.current.add(s.id));
    setBuiltCount(builtRef.current.size);
  };

  const cleanupRunObservers = () => {
    if (waitHeroTimerRef.current) {
      clearInterval(waitHeroTimerRef.current);
      waitHeroTimerRef.current = null;
    }
    if (scrollEndTimerRef.current) {
      clearTimeout(scrollEndTimerRef.current);
      scrollEndTimerRef.current = null;
    }
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (sectionWatcherRef.current) {
      sectionWatcherRef.current.disconnect();
      sectionWatcherRef.current = null;
    }
    hideDrawBox();
    if (guideRef.current) guideRef.current.style.display = 'none';
    if (caretRef.current) caretRef.current.style.display = 'none';
    if (spacingRef.current) spacingRef.current.style.display = 'none';
  };

  const goLive = () => {
    tokenRef.current += 1;
    tourRef.current = false;
    setTourOn(false);
    cleanupRunObservers();
    buildingRef.current = new Set();
    buildStartRef.current = new Map();
    queuedAtRef.current = new Map();
    retryRef.current = new Set();
    pendingRef.current = 0;
    markAllBuilt();
    document.documentElement.classList.remove('swarm-active');
    updatePhase('live');
    setCurrentLabel('লাইভ — আসল সাইট');
    sfx().release();
  };

  const replay = () => {
    tokenRef.current += 1;
    tourRef.current = false;
    setTourOn(false);
    cleanupRunObservers();
    document.querySelectorAll('[data-swarm-built]').forEach((el) => delete el.dataset.swarmBuilt);
    builtRef.current = new Set();
    buildingRef.current = new Set();
    buildStartRef.current = new Map();
    queuedAtRef.current = new Map();
    retryRef.current = new Set();
    pendingRef.current = 0;
    skipRef.current = new Set();
    heroVisibleAtRef.current = null;
    userScrolledRef.current = false;
    setBuiltCount(0);
    updatePhase('building');
    setCurrentLabel('তৈরি হচ্ছে…');
    programmaticScrollUntilRef.current = nowMs() + 600;
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.documentElement.classList.add('swarm-active');
    queueRef.current = Promise.resolve();
    void startRun(true);
  };

  const startRun = async (isReplay) => {
    const token = tokenRef.current;
    // Anything that is not a build target (e.g. ParticleText wrapper) stays visible.
    document.querySelectorAll('.reveal').forEach((el) => {
      if (!SECTION_IDS.includes(el.id)) el.dataset.swarmBuilt = '1';
    });
    document.documentElement.classList.add('swarm-active');
    sfx().init();
    sfx().intro();

    // Intro: cursors orbit the top center, then fan out.
    const cx = window.innerWidth / 2;
    const cy = 110;
    const orbitStart = perfMs();
    const orbit = () => {
      if (tokenRef.current !== token) return;
      const t = (perfMs() - orbitStart) / 1000;
      cursorsRef.current.forEach((c) => {
        const a = c.angle + t * 1.6;
        const r = Math.max(30, 90 - t * 30);
        c.tx = cx + Math.cos(a) * r;
        c.ty = cy + Math.sin(a) * r * 0.6;
      });
      if (perfMs() - orbitStart < 380) requestAnimationFrame(orbit);
    };
    orbit();
    await sleep((isReplay ? 280 : 380) / speedRef.current);
    if (tokenRef.current !== token) return;
    sfx().start();

    // Enqueue nav and hero FIRST so an initial intersection of a lower
    // section on tall viewports never jumps ahead of the hero on load.
    enqueueBuild(SECTIONS[0]);
    enqueueBuild(SECTIONS[1]);

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
      { threshold: 0.05, rootMargin: '0px 0px -8% 0px' },
    );
    observerRef.current = observer;
    SECTIONS.slice(2).forEach((sec) => {
      const el = document.getElementById(sec.id);
      if (el) observer.observe(el);
    });

    // MutationObserver handles:
    // 1. Late-mounted sections (windows restored from closed/minimised state).
    // 2. Late-mounted items inside already-built sections (e.g. Victims cards
    //    4-11 after clicking "load more", or restored project/victim cards).
    if (window.MutationObserver) {
      const watcher = new MutationObserver(() => {
        SECTIONS.forEach((sec) => {
          const el = getSectionEl(sec.id);
          if (!el) return;
          if (builtRef.current.has(sec.id)) {
            if (!el.dataset.swarmBuilt) el.dataset.swarmBuilt = '1';
            sectionItems(sec).forEach((item) => {
              if (!item.dataset.swarmBuilt) item.dataset.swarmBuilt = '1';
            });
            return;
          }
          if (sec.id !== 'nav' && sec.id !== 'hero') {
            observer.observe(el);
            // Only auto-enqueue from MutationObserver after the hero has built
            // or if the visitor has scrolled down, so cursor DOM updates during
            // the initial hero build don't prematurely trigger lower sections.
            if (builtRef.current.has('hero') || window.scrollY > 80) {
              const r = el.getBoundingClientRect();
              if (r.bottom > 0 && r.top < window.innerHeight * 0.9) {
                releaseEarlierSections(sec);
                enqueueBuild(sec);
              }
            }
          }
        });
      });
      watcher.observe(document.body, { childList: true, subtree: true });
      sectionWatcherRef.current = watcher;
    }

    // Auto-tour gate: starts 2.5s (scaled by speed) after the hero's own
    // build has visibly completed in the viewport, provided the visitor has
    // not scrolled away from the top (scrollY < 100).
    const waitHero = setInterval(() => {
      if (tokenRef.current !== token || phaseRef.current !== 'building') {
        clearInterval(waitHero);
        return;
      }
      const seenAt = heroVisibleAtRef.current;
      const requiredDelay = AUTO_TOUR_DELAY_MS / speedRef.current;
      if (
        seenAt !== null &&
        Date.now() - seenAt >= requiredDelay &&
        !userScrolledRef.current &&
        window.scrollY < 100
      ) {
        clearInterval(waitHero);
        waitHeroTimerRef.current = null;
        setTourOn(true);
        tourRef.current = true;
        void runTour();
      }
    }, 200);
    waitHeroTimerRef.current = waitHero;
  };

  const runTour = async () => {
    const token = tokenRef.current;
    while (tourRef.current && tokenRef.current === token && phaseRef.current === 'building') {
      const next = SECTIONS.find((s) => !builtRef.current.has(s.id));
      if (!next) break;
      const el = getSectionEl(next.id);
      if (!el) {
        releaseSectionNow(next, false);
        continue;
      }
      smoothScrollToEl(el);
      enqueueBuild(next);
      // Linger at least MIN_TOUR_DWELL_MS (scaled by speed) per section and
      // wait for the section's build to finish (up to 4.2s cap).
      const arrived = Date.now();
      const minDwell = MIN_TOUR_DWELL_MS / speedRef.current;
      const maxWait = Math.max(minDwell + 400, SECTION_BUDGET_MS + 300);
      while (tourRef.current && tokenRef.current === token) {
        const done = builtRef.current.has(next.id);
        const elapsed = Date.now() - arrived;
        if (done && elapsed >= minDwell) break;
        if (elapsed >= maxWait) {
          if (!done) releaseSectionNow(next, next.id === 'hero');
          break;
        }
        await sleep(120);
      }
      await sleep(140 / speedRef.current);
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
          c.tx = mouse.x + (i - 1.5) * 26;
          c.ty = mouse.y + (i % 2 === 0 ? -14 : 16);
        }
        c.x += (c.tx - c.x) * 0.18;
        c.y += (c.ty - c.y) * 0.18;
        el.style.transform = `translate(${c.x}px, ${c.y}px)`;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [reducedMotion]);

  // Main run + global keys + sound unlock + watchdog.
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
    const onUserScrollInput = () => {
      if (window.scrollY > 90) userScrolledRef.current = true;
      if (tourRef.current) {
        tourRef.current = false;
        setTourOn(false);
      }
      if (phaseRef.current === 'building') {
        scheduleResume();
      }
    };
    const onScroll = () => {
      // Ignore programmatic smooth-scrolls triggered by the tour or by
      // scroll-end auto-resume so the tour never cancels itself.
      if (tourRef.current || Date.now() < programmaticScrollUntilRef.current) return;
      if (window.scrollY > 90) userScrolledRef.current = true;
      if (phaseRef.current === 'building') {
        scheduleResume();
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        goLive();
      } else if ((e.key === 'm' || e.key === 'M') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = e.target && e.target.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
          setSoundOn((prev) => {
            const next = !prev;
            sfx().setOn(next);
            return next;
          });
        }
      }
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(e.key)) {
        const tag = e.target && e.target.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
          onUserScrollInput();
        }
      }
      onUnlock();
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onUnlock, true);
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('wheel', onUserScrollInput, { passive: true });
    window.addEventListener('touchmove', onUserScrollInput, { passive: true });

    // 10s Watchdog: force-releases any section stuck in `building` OR stuck
    // in the queue longer than WATCHDOG_MS, and rescues an idle queue.
    const watchdog = setInterval(() => {
      if (phaseRef.current !== 'building') return;
      const now = Date.now();
      buildStartRef.current.forEach((startedAt, id) => {
        if (now - startedAt > WATCHDOG_MS) {
          const sec = SECTIONS.find((s) => s.id === id);
          console.warn('[swarm] watchdog: section stuck in building, force-releasing:', id);
          if (sec) releaseSectionNow(sec, id === 'hero');
        }
      });
      queuedAtRef.current.forEach((queuedAt, id) => {
        if (now - queuedAt > WATCHDOG_MS && !builtRef.current.has(id)) {
          const sec = SECTIONS.find((s) => s.id === id);
          console.warn('[swarm] watchdog: section stuck in queue, force-releasing:', id);
          if (sec) releaseSectionNow(sec, id === 'hero');
        }
      });
      if (pendingRef.current === 0 && buildingRef.current.size === 0) {
        const inView = SECTIONS.find((s) => {
          if (builtRef.current.has(s.id)) return false;
          const el = getSectionEl(s.id);
          if (!el) return false;
          const r = el.getBoundingClientRect();
          return r.bottom > 0 && r.top < window.innerHeight;
        });
        if (inView) {
          enqueueBuild(inView);
        } else if (userScrolledRef.current && !scrollEndTimerRef.current) {
          scheduleResume(300);
        }
      }
    }, 1000);

    void startRun(false);
    return () => {
      tokenRef.current = -1;
      cancelAnimationFrame(rafRef.current);
      clearInterval(watchdog);
      cleanupRunObservers();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onUnlock, true);
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('wheel', onUserScrollInput);
      window.removeEventListener('touchmove', onUserScrollInput);
      document.documentElement.classList.remove('swarm-active');
      document.querySelectorAll('[data-swarm-built]').forEach((el) => {
        el.dataset.swarmBuilt = '1';
      });
      if (soundRef.current) soundRef.current.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

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
    setSpeedIx((ix) => {
      const nextIx = clamp(ix + dir, 0, SPEEDS.length - 1);
      speedRef.current = SPEEDS[nextIx];
      return nextIx;
    });
  };

  return (
    <>
      <div className="swarm-overlay" aria-hidden="true">
        {COLORS.map((color, i) => (
          <div
            key={color}
            ref={(el) => {
              cursorElsRef.current[i] = el;
            }}
            className="swarm-cursor"
            dangerouslySetInnerHTML={{ __html: arrowSvg(color) }}
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
