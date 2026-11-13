/**
 * SwarmRebuild — Joratali Engineering.
 *
 * A swarm of four nameless, coloured cursors rebuilds this site live
 * piece-by-piece, inspired by the Swarm Rebuild Chrome extension:
 *  1. When a section begins building, its outer `<section>` container
 *     is unlocked immediately (`data-swarm-building="1"`) while its
 *     inner pieces (window shell, heading, cards, preview image,
 *     buttons, form) are individually gated (`data-swarm-part` /
 *     `data-swarm-shell`).
 *  2. A cursor drags a crosshair box diagonally from top-left to
 *     bottom-right with a live-counting W x H badge and full-viewport
 *     crosshair lines; the Win98 window shell appears immediately.
 *  3. A pen cursor snaps a red ruler guide under the heading, then an
 *     I-beam cursor + blinking caret types across the heading while
 *     revealing the text character-by-character from left to right.
 *  4. The four cursors draw/duplicate the inner cards, images, and
 *     controls one by one (with an Alt-drag ghost duplicate box and
 *     red spacing measurement), and each card becomes visible the
 *     exact instant its cursor finishes drawing it.
 */

import { useEffect, useRef, useState } from 'react';
import { SwarmSound } from './swarmSound';
import './swarm.css';

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3];
const DEFAULT_SPEED_IX = 3; // 1x
const COLORS = ['#F24E1E', '#A259FF', '#1ABCFE', '#0ACF83'];

const SECTION_BUDGET_MS = 4000;
const WATCHDOG_MS = 10000;
const AUTO_TOUR_DELAY_MS = 2500;
const MIN_TOUR_DWELL_MS = 1200;
const SCROLL_RESUME_MS = 900;
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
  const buildStartRef = useRef(new Map());
  const retryRef = useRef(new Set());
  const pendingRef = useRef(0);
  const sectionWatcherRef = useRef(null);
  const skipRef = useRef(new Set());
  const queueRef = useRef(Promise.resolve());
  const tourRef = useRef(false);
  const phaseRef = useRef('building');
  const mouseRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const userScrolledRef = useRef(false);
  const queuedAtRef = useRef(new Map());
  const heroVisibleAtRef = useRef(null);
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
  const dupBoxRef = useRef(null);
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

  const sleep = (ms, sectionId) => {
    const token = tokenRef.current;
    const total = Math.max(0, ms);
    return new Promise((resolve) => {
      const started = perfMs();
      const step = () => {
        if (tokenRef.current !== token || (sectionId && skipRef.current.has(sectionId))) {
          resolve(false);
          return;
        }
        const rem = total - (perfMs() - started);
        if (rem <= 0) {
          resolve(true);
          return;
        }
        setTimeout(step, Math.min(35, rem));
      };
      setTimeout(step, Math.min(35, total));
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
    const dur = clamp(dist / 2.6, 55, 170) / speedRef.current;
    await sleep(dur, sectionId);
  };

  const hoverOthers = (i, rect) => {
    cursorsRef.current.forEach((c, j) => {
      if (j === i) return;
      c.tx = clamp(rect.left + rand(0.08, 0.92) * rect.width, 8, window.innerWidth - 8);
      c.ty = clamp(rect.top + rand(0.08, 0.92) * rect.height, 8, window.innerHeight - 8);
    });
  };

  // Drag a crosshair rectangle from top-left to bottom-right with the
  // cursor physically pulling the bottom-right corner and the W x H
  // badge counting up live.
  const dragBoxWithCursor = async (cursorIx, rect, durationMs, sectionId) => {
    const box = boxRef.current;
    const badge = badgeRef.current;
    const c = cursorsRef.current[cursorIx];
    if (!box || !badge || !c) return;
    setCursorShape(cursorIx, 'cross');
    const startX = clamp(rect.left, 4, window.innerWidth - 12);
    const startY = clamp(rect.top, 4, window.innerHeight - 12);
    const totalW = Math.max(8, Math.min(rect.width, window.innerWidth - startX - 4));
    const totalH = Math.max(8, Math.min(rect.height, window.innerHeight - startY - 4));

    box.style.display = 'block';
    box.style.left = `${startX}px`;
    box.style.top = `${startY}px`;
    const steps = 6;
    const stepWait = Math.max(14, durationMs / steps / speedRef.current);
    for (let k = 1; k <= steps; k++) {
      if (sectionId && skipRef.current.has(sectionId)) break;
      const pct = k / steps;
      const eased = 1 - Math.pow(1 - pct, 2);
      const w = Math.max(6, Math.round(totalW * eased));
      const h = Math.max(6, Math.round(totalH * eased));
      box.style.width = `${w}px`;
      box.style.height = `${h}px`;
      box.style.setProperty('--cross-x', `${startX + w}px`);
      box.style.setProperty('--cross-y', `${startY + h}px`);
      badge.textContent = `${Math.round(rect.width * eased)} × ${Math.round(rect.height * eased)}`;
      c.tx = clamp(startX + w, 8, window.innerWidth - 8);
      c.ty = clamp(startY + h, 8, window.innerHeight - 8);
      await sleep(stepWait, sectionId);
    }
    box.style.display = 'none';
  };

  // Alt-drag duplicate choreography: cursor starts on the previous card,
  // drags a purple dashed ghost clone across to the new card while the
  // red spacing badge measures the gap between them.
  const dragDuplicateWithCursor = async (cursorIx, prevRect, rect, durationMs, sectionId) => {
    const dup = dupBoxRef.current;
    const sp = spacingRef.current;
    const c = cursorsRef.current[cursorIx];
    if (!dup || !c) return;
    setCursorShape(cursorIx, 'arrow');
    dup.style.display = 'block';
    dup.style.width = `${Math.max(24, Math.min(rect.width, window.innerWidth - 16))}px`;
    dup.style.height = `${Math.max(24, Math.min(rect.height, window.innerHeight - 16))}px`;

    const gap = Math.round(
      Math.abs(rect.top - prevRect.bottom) > 6
        ? Math.abs(rect.top - prevRect.bottom)
        : Math.abs(rect.left - prevRect.right),
    );
    if (sp) {
      sp.style.display = 'block';
      sp.style.left = `${clamp(rect.left + 8, 8, window.innerWidth - 90)}px`;
      sp.style.top = `${clamp(rect.top - 24, 8, window.innerHeight - 32)}px`;
      sp.textContent = `↔ ${gap}px`;
    }

    const steps = 6;
    const stepWait = Math.max(14, durationMs / steps / speedRef.current);
    for (let k = 1; k <= steps; k++) {
      if (sectionId && skipRef.current.has(sectionId)) break;
      const pct = k / steps;
      const eased = 1 - Math.pow(1 - pct, 2);
      const curLeft = prevRect.left + (rect.left - prevRect.left) * eased;
      const curTop = prevRect.top + (rect.top - prevRect.top) * eased;
      dup.style.left = `${curLeft}px`;
      dup.style.top = `${curTop}px`;
      c.tx = clamp(curLeft + Math.min(80, rect.width * 0.35), 8, window.innerWidth - 8);
      c.ty = clamp(curTop + Math.min(40, rect.height * 0.35), 8, window.innerHeight - 8);
      await sleep(stepWait, sectionId);
    }
    dup.style.display = 'none';
    if (sp) sp.style.display = 'none';
  };

  const hideOverlays = () => {
    if (boxRef.current) boxRef.current.style.display = 'none';
    if (dupBoxRef.current) dupBoxRef.current.style.display = 'none';
    if (guideRef.current) guideRef.current.style.display = 'none';
    if (caretRef.current) caretRef.current.style.display = 'none';
    if (spacingRef.current) spacingRef.current.style.display = 'none';
  };

  const showGuide = async (cursorIx, rect, sectionId) => {
    const g = guideRef.current;
    const c = cursorsRef.current[cursorIx];
    if (!g) return;
    setCursorShape(cursorIx, 'pen');
    const startX = Math.max(0, rect.left - 20);
    const y = rect.bottom + 2;
    const totalW = Math.min(window.innerWidth - startX, rect.width + 40);
    g.style.display = 'block';
    g.style.left = `${startX}px`;
    g.style.top = `${y}px`;
    g.style.width = '0px';
    const steps = 5;
    const stepWait = Math.max(12, 110 / steps / speedRef.current);
    for (let k = 1; k <= steps; k++) {
      if (sectionId && skipRef.current.has(sectionId)) break;
      const w = (k / steps) * totalW;
      g.style.width = `${w}px`;
      if (c) {
        c.tx = clamp(startX + w, 8, window.innerWidth - 8);
        c.ty = clamp(y, 8, window.innerHeight - 8);
      }
      await sleep(stepWait, sectionId);
    }
    sfx().snap(rect.left + rect.width / 2, window.innerWidth);
    await sleep(30 / speedRef.current, sectionId);
    g.style.display = 'none';
  };

  // Type across a heading while revealing the heading's actual DOM text
  // character-by-character from left to right behind the blinking caret.
  const typeAcross = async (cursorIx, headingEl, rect, text, sectionId) => {
    const caret = caretRef.current;
    const steps = Math.min(Math.max(text ? text.length : 12, 10), 18);
    const c = cursorsRef.current[cursorIx];
    if (!c) return;
    setCursorShape(cursorIx, 'ibeam');
    if (headingEl) {
      headingEl.dataset.swarmBuilt = '1';
      headingEl.style.clipPath = 'inset(0 100% 0 0)';
    }
    if (caret) {
      caret.style.display = 'block';
      caret.style.top = `${rect.top + Math.max(0, (rect.height - 24) / 2)}px`;
    }
    for (let k = 1; k <= steps; k++) {
      if (sectionId && skipRef.current.has(sectionId)) break;
      const pct = k / steps;
      const x = rect.left + 4 + pct * Math.max(0, rect.width - 8);
      const y = rect.top + rect.height / 2;
      c.tx = clamp(x, 8, window.innerWidth - 8);
      c.ty = clamp(y, 8, window.innerHeight - 8);
      if (caret) caret.style.left = `${x + 4}px`;
      if (headingEl) {
        const rightInset = Math.max(0, Math.round((1 - pct) * 100));
        headingEl.style.clipPath = `inset(0 ${rightInset}% 0 0)`;
      }
      const ch = text ? text[Math.floor(pct * (text.length - 1))] : '';
      sfx().key(x, window.innerWidth, `type-${cursorIx}`, 1, ch === ' ' ? 1 : 0);
      if (k % 6 === 5) sfx().grow(Math.floor(k / 6), x, window.innerWidth);
      await sleep(11 / speedRef.current, sectionId);
    }
    if (headingEl) {
      headingEl.style.clipPath = '';
      headingEl.dataset.swarmBuilt = '1';
    }
    if (caret) caret.style.display = 'none';
    setCursorShape(cursorIx, 'arrow');
  };

  const releaseEl = (el, kind, slideFromRect) => {
    if (!el) return;
    el.dataset.swarmBuilt = '1';
    el.style.clipPath = '';
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      if (slideFromRect) {
        const dx = clamp((slideFromRect.left - rect.left) * 0.28, -90, 90);
        const dy = clamp((slideFromRect.top - rect.top) * 0.28, -90, 90);
        el.animate(
          [
            { opacity: 0.35, transform: `translate(${dx}px, ${dy}px) scale(0.97)` },
            { opacity: 1, transform: 'translate(0, 0) scale(1)' },
          ],
          { duration: 190 / speedRef.current, easing: 'ease-out' },
        );
      } else {
        el.animate(
          [
            { opacity: 0.2, clipPath: 'inset(0 0 85% 0)' },
            { opacity: 1, clipPath: 'inset(0 0 0% 0)' },
          ],
          { duration: 200 / speedRef.current, easing: 'ease-out' },
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
    if (rect.width < 4 || rect.height < 4 || rect.bottom < 0 || rect.top > window.innerHeight + 80) {
      el.dataset.swarmBuilt = '1';
      el.style.clipPath = '';
      return;
    }
    hoverOthers(cursorIx, rect);
    if (isDup && prevRect) {
      await moveCursorTo(
        cursorIx,
        prevRect.left + Math.min(40, prevRect.width * 0.3),
        prevRect.top + Math.min(24, prevRect.height * 0.3),
        'arrow',
        sectionId,
      );
      if (sectionId && skipRef.current.has(sectionId)) {
        el.dataset.swarmBuilt = '1';
        return;
      }
      sfx().press(prevRect.left, window.innerWidth);
      await dragDuplicateWithCursor(cursorIx, prevRect, rect, 130, sectionId);
      sfx().place(
        'dup',
        rect.left + rect.width / 2,
        rect.top,
        rect.width,
        rect.height,
        window.innerWidth,
        window.innerHeight,
      );
      releaseEl(el, null, prevRect);
    } else {
      await moveCursorTo(cursorIx, rect.left + 6, rect.top + 6, 'cross', sectionId);
      if (sectionId && skipRef.current.has(sectionId)) {
        el.dataset.swarmBuilt = '1';
        return;
      }
      sfx().press(rect.left, window.innerWidth);
      await dragBoxWithCursor(cursorIx, rect, 125, sectionId);
      releaseEl(el, kind === 'image' ? 'image' : 'rect', null);
    }
    await sleep(30 / speedRef.current, sectionId);
  };

  const itemSelectorFor = (section) => {
    if (section.id === 'projects') return '#projects .win98-window';
    if (section.id === 'victims') return '#victims .win98-window';
    if (section.id === 'process') return '#process .grid > .win98-box';
    if (section.id === 'skills') return '#skills .grid > .win98-inset';
    return null;
  };

  const sectionItems = (section) => {
    const sel = itemSelectorFor(section);
    return sel ? Array.from(document.querySelectorAll(sel)) : [];
  };

  // Discover the granular sub-elements inside a section so we can hide
  // them individually (`data-swarm-shell` / `data-swarm-part`), unlock
  // the outer `<section>` right away (`data-swarm-building="1"`), and
  // reveal each piece live on screen as its cursor draws/types it.
  const prepareSectionParts = (section, el) => {
    let shell = null;
    const heading =
      el.querySelector('h1, h2') || (section.id === 'skills' ? el.querySelector('.border-b') : null);
    const extras = [];

    if (section.id === 'nav') {
      const bars = Array.from(el.children);
      if (bars[0]) shell = bars[0];
      if (bars[1]) extras.push({ el: bars[1], kind: 'rect' });
    } else if (section.id === 'hero') {
      shell = el.querySelector(':scope > .win98-window') || el;
      const leftCol = el.querySelector('.md\\:col-span-7');
      if (leftCol) {
        Array.from(leftCol.children).forEach((child) => {
          if (heading && child.contains(heading)) return;
          extras.push({ el: child, kind: 'rect' });
        });
      }
      const rightBox = el.querySelector('.md\\:col-span-5 .win98-box');
      if (rightBox) extras.push({ el: rightBox, kind: 'image' });
    } else if (section.id === 'skills') {
      shell = el.querySelector(':scope > .win98-window') || el;
    } else if (section.id === 'projects' || section.id === 'victims') {
      shell = el.querySelector(':scope > .win98-box');
      if (section.id === 'victims') {
        const moreBtn = el.querySelector(':scope > .text-center');
        if (moreBtn) extras.push({ el: moreBtn, kind: 'rect' });
      }
    } else if (section.id === 'process') {
      shell = el.querySelector(':scope > .win98-window') || el;
    } else if (section.id === 'contact') {
      shell = el.querySelector(':scope > .win98-window') || el;
      const form = el.querySelector('form');
      if (form) extras.push({ el: form, kind: 'rect' });
    }

    if (shell && shell !== el && !shell.dataset.swarmBuilt) {
      shell.dataset.swarmShell = '1';
    }
    if (heading && !heading.dataset.swarmBuilt) {
      heading.dataset.swarmPart = '1';
    }
    extras.forEach(({ el: node }) => {
      if (node && !node.dataset.swarmBuilt) {
        node.dataset.swarmPart = '1';
      }
    });
    sectionItems(section).forEach((item) => {
      if (!item.dataset.swarmBuilt) {
        item.dataset.swarmPart = '1';
      }
    });

    // Unlock the outer <section> container immediately so every child piece
    // becomes visible on screen the exact moment its cursor finishes!
    el.dataset.swarmBuilding = '1';

    return { shell, heading, extras };
  };

  const releaseAllPartsInEl = (section, el) => {
    if (!el) return;
    delete el.dataset.swarmBuilding;
    el.dataset.swarmBuilt = '1';
    el.style.clipPath = '';
    el.querySelectorAll('[data-swarm-shell], [data-swarm-part], h1, h2').forEach((node) => {
      node.dataset.swarmBuilt = '1';
      node.style.clipPath = '';
    });
    sectionItems(section).forEach((item) => {
      item.dataset.swarmBuilt = '1';
      item.style.clipPath = '';
    });
  };

  const checkAllDone = () => {
    if (builtRef.current.size >= SECTIONS.length && phaseRef.current === 'building') {
      updatePhase('done');
      setCurrentLabel('সব তৈরি!');
      hideOverlays();
      sfx().finale();
    }
  };

  const releaseSectionNow = (section, markHeroSeenIfInView = false) => {
    const el = getSectionEl(section.id);
    if (el) {
      releaseAllPartsInEl(section, el);
      if (section.id === 'hero' && markHeroSeenIfInView && heroVisibleAtRef.current === null) {
        const r = el.getBoundingClientRect();
        if (r.bottom > 0 && r.top < window.innerHeight) {
          heroVisibleAtRef.current = nowMs();
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

  const findNearestUnbuiltSection = () => {
    const unbuilt = SECTIONS.filter((s) => !builtRef.current.has(s.id));
    if (unbuilt.length === 0) return null;
    const vh = window.innerHeight;
    for (const s of unbuilt) {
      const el = getSectionEl(s.id);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh) return s;
    }
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
    programmaticScrollUntilRef.current = nowMs() + 1100;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scheduleResume = (delayMs) => {
    if (scrollEndTimerRef.current) clearTimeout(scrollEndTimerRef.current);
    const wait = typeof delayMs === 'number' ? delayMs : SCROLL_RESUME_MS / speedRef.current;
    scrollEndTimerRef.current = setTimeout(() => {
      scrollEndTimerRef.current = null;
      if (phaseRef.current !== 'building' || tourRef.current) return;
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

  const buildSection = async (section) => {
    buildStartRef.current.set(section.id, nowMs());
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
    const startedAt = nowMs();
    const budgetMs = Math.min(SECTION_BUDGET_MS, SECTION_BUDGET_MS / speedRef.current);
    const aborted = () => tokenRef.current !== token || skipRef.current.has(section.id);
    const overBudget = () => nowMs() - startedAt > budgetMs;
    const finishFast = () => releaseSectionNow(section, section.id === 'hero');
    if (skipRef.current.has(section.id) || builtRef.current.has(section.id)) return;

    const el = getSectionEl(section.id);
    if (!el) {
      releaseSectionNow(section, false);
      return;
    }
    setCurrentLabel(`${section.label} বানানো হচ্ছে…`);
    const lead = SECTIONS.findIndex((s) => s.id === section.id) % COLORS.length;

    // Unlock the outer <section> right away and gate its individual inner
    // pieces so each piece appears on screen the moment a cursor draws it!
    const { shell, heading, extras } = prepareSectionParts(section, el);
    const shellEl = shell || el;
    const shellRect = shellEl.getBoundingClientRect();

    // 1. Drag out the outer window shell / header bar and reveal it immediately!
    await moveCursorTo(lead, shellRect.left + 8, shellRect.top + 8, 'cross', section.id);
    if (aborted()) return;
    if (overBudget()) return finishFast();
    hoverOthers(lead, shellRect);
    sfx().press(shellRect.left, window.innerWidth);
    await dragBoxWithCursor(lead, shellRect, 145, sectionIdOrNull(section));
    if (aborted()) return;
    releaseEl(shellEl, 'rect', null);

    // 2. Pen ruler guide + live left-to-right character typing on the heading.
    if (heading) {
      const hRect = heading.getBoundingClientRect();
      if (hRect.width > 0 && hRect.bottom > 0 && hRect.top < window.innerHeight) {
        await showGuide((lead + 1) % COLORS.length, hRect, section.id);
        if (aborted()) return;
        if (overBudget()) return finishFast();
        await typeAcross(lead, heading, hRect, heading.textContent || '', section.id);
        if (aborted()) return;
        if (overBudget()) return finishFast();
      } else {
        heading.dataset.swarmBuilt = '1';
      }
    }

    // 3. Draw repeated cards inside (first card drawn with crosshair box,
    // subsequent cards Alt-dragged as duplicates with spacing guide).
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

    // 4. Draw section-specific inner pieces (Hero image/description/buttons,
    // Contact form as one box, Navbar taskbar, Victims load-more button).
    for (let j = 0; j < extras.length; j++) {
      if (aborted()) return;
      if (overBudget()) return finishFast();
      const { el: partEl, kind } = extras[j];
      if (!partEl || partEl.dataset.swarmBuilt) continue;
      const cursorIx = (lead + j + 1) % COLORS.length;
      await drawItem(cursorIx, partEl, kind, false, null, section.id);
    }

    if (aborted()) return;

    // 5. Finalize section and guarantee all child parts are marked built.
    releaseAllPartsInEl(section, el);

    if (section.id === 'hero') {
      const r = el.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) {
        heroVisibleAtRef.current = nowMs();
      }
    }
    builtRef.current.add(section.id);
    setBuiltCount(builtRef.current.size);
    await sleep(40 / speedRef.current, section.id);
    checkAllDone();
  };

  const sectionIdOrNull = (section) => (section ? section.id : null);

  const enqueueBuild = (section) => {
    if (builtRef.current.has(section.id) || buildingRef.current.has(section.id)) return queueRef.current;
    buildingRef.current.add(section.id);
    queuedAtRef.current.set(section.id, nowMs());
    pendingRef.current += 1;
    queueRef.current = queueRef.current
      .then(() => buildSection(section))
      .catch((err) => {
        console.warn('[swarm] build failed for section:', section.id, err);
        if (!retryRef.current.has(section.id)) {
          retryRef.current.add(section.id);
          buildingRef.current.add(section.id);
          queuedAtRef.current.set(section.id, nowMs());
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
    document.querySelectorAll('.reveal, nav, [data-swarm-shell], [data-swarm-part]').forEach((el) => {
      delete el.dataset.swarmBuilding;
      el.dataset.swarmBuilt = '1';
      el.style.clipPath = '';
    });
    document
      .querySelectorAll(
        '#projects .win98-window, #victims .win98-window, #skills .grid > .win98-inset, #process .grid > .win98-box',
      )
      .forEach((el) => {
        el.dataset.swarmBuilt = '1';
        el.style.clipPath = '';
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
    hideOverlays();
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
    document
      .querySelectorAll('[data-swarm-built], [data-swarm-building], [data-swarm-shell], [data-swarm-part]')
      .forEach((el) => {
        delete el.dataset.swarmBuilt;
        delete el.dataset.swarmBuilding;
        delete el.dataset.swarmShell;
        delete el.dataset.swarmPart;
        el.style.clipPath = '';
      });
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
    document.querySelectorAll('.reveal').forEach((el) => {
      if (!SECTION_IDS.includes(el.id)) el.dataset.swarmBuilt = '1';
    });
    document.documentElement.classList.add('swarm-active');
    sfx().init();
    sfx().intro();

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
      if (perfMs() - orbitStart < 340) requestAnimationFrame(orbit);
    };
    orbit();
    await sleep((isReplay ? 240 : 340) / speedRef.current);
    if (tokenRef.current !== token) return;
    sfx().start();

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

    const waitHero = setInterval(() => {
      if (tokenRef.current !== token || phaseRef.current !== 'building') {
        clearInterval(waitHero);
        return;
      }
      const seenAt = heroVisibleAtRef.current;
      const requiredDelay = AUTO_TOUR_DELAY_MS / speedRef.current;
      if (
        seenAt !== null &&
        nowMs() - seenAt >= requiredDelay &&
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
      const arrived = nowMs();
      const minDwell = MIN_TOUR_DWELL_MS / speedRef.current;
      const maxWait = Math.max(minDwell + 400, SECTION_BUDGET_MS + 300);
      while (tourRef.current && tokenRef.current === token) {
        const done = builtRef.current.has(next.id);
        const elapsed = nowMs() - arrived;
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
        c.x += (c.tx - c.x) * 0.22;
        c.y += (c.ty - c.y) * 0.22;
        el.style.transform = `translate(${c.x}px, ${c.y}px)`;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [reducedMotion]);

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
      if (tourRef.current || nowMs() < programmaticScrollUntilRef.current) return;
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

    const watchdog = setInterval(() => {
      if (phaseRef.current !== 'building') return;
      const now = nowMs();
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
      markAllBuilt();
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
        <div ref={dupBoxRef} className="swarm-dup-box" />
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
