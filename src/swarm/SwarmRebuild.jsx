/**
 * SwarmRebuild — Joratali Engineering.
 *
 * Authentic Figma-style multiplayer rebuild engine inspired by the
 * Swarm Rebuild Chrome extension, tailored for Joratali Engineering's
 * Win98 windows:
 *  - Four nameless, coloured cursors work in parallel inside each
 *    section with curved human-like paths, hotspot-aligned tool icons
 *    (arrow, double-arrow dup, crosshair, I-beam, pen, ew/ns resize),
 *    and click-press scaling.
 *  - Dark 20px top & left Figma rulers with tick marks, blue selection
 *    range highlights, and dashed ruler projection lines.
 *  - Each box/image starts as a growing #D9D9D9 wireframe placeholder
 *    (with a mountain/sun icon for images, 4 white 7x7 corner handles,
 *    and a live W x H badge) before morphing into the real Win98 card.
 *  - Headings are typed character-by-character with a blinking caret,
 *    step up in font scale (`grow`), and snap onto a red ruler guide
 *    pulled out from the ruler.
 *  - Repeated cards are Alt-dragged from the master card using the
 *    double-arrow `dup` cursor, sliding physically from the master
 *    card's position with dual red selection boxes and a red pixel
 *    spacing line + badge, followed by a quick blue selection edit.
 */

import { useEffect, useRef, useState } from 'react';
import { SwarmSound } from './swarmSound';
import './swarm.css';

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3];
const DEFAULT_SPEED_IX = 3; // 1x
const COLORS = ['#F24E1E', '#A259FF', '#1ABCFE', '#0ACF83'];
const BLUE = '#0D99FF';
const RED = '#F24822';
const RULER_SIZE = 20;

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
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const f1 = (n) => Math.round(n * 10) / 10;
const nowMs = () => Date.now();
const perfMs = () => performance.now();

const ARROW_PATH =
  'M4.6 3.9 C4.2 3.1 4.9 2.4 5.7 2.8 L20.6 9.4 C21.5 9.8 21.4 11.1 20.4 11.3 L13.9 12.9 C13.4 13 13 13.4 12.9 13.9 L11.3 20.4 C11.1 21.4 9.8 21.5 9.4 20.6 Z';

const HOTSPOTS = {
  arrow: [5, 3.5],
  dup: [5, 3.5],
  pen: [3, 3],
  cross: [12, 12],
  ibeam: [12, 12],
  ew: [12, 12],
  ns: [12, 12],
};

function renderCursorInnerSvg(shape, color) {
  const stroke = 'stroke="#fff" stroke-width="1.5" stroke-linejoin="round"';
  if (shape === 'dup') {
    return (
      `<path d="${ARROW_PATH}" transform="translate(4 3.5)" fill="#fff" stroke="${color}" stroke-width="1.3" stroke-linejoin="round"/>` +
      `<path d="${ARROW_PATH}" fill="${color}" ${stroke}/>`
    );
  }
  if (shape === 'cross') {
    return (
      `<g stroke-linecap="round"><path d="M12 3.5 V20.5 M3.5 12 H20.5" stroke="#fff" stroke-width="3.6"/>` +
      `<path d="M12 3.5 V20.5 M3.5 12 H20.5" stroke="${color}" stroke-width="1.5"/></g>`
    );
  }
  if (shape === 'ibeam') {
    const d =
      'M8.5 4.5 H10.5 Q12 4.5 12 6 Q12 4.5 13.5 4.5 H15.5 M12 6 V18 M8.5 19.5 H10.5 Q12 19.5 12 18 Q12 19.5 13.5 19.5 H15.5';
    return (
      `<g fill="none" stroke-linecap="round"><path d="${d}" stroke="#fff" stroke-width="3.6"/>` +
      `<path d="${d}" stroke="${color}" stroke-width="1.5"/></g>`
    );
  }
  if (shape === 'pen') {
    return (
      `<path d="M17.4 10.6 L20.6 13.8 L13.8 20.6 L10.6 17.4 Z" fill="${color}" ${stroke}/>` +
      `<path d="M3 3 L13.1 6.3 L17.4 10.6 L10.6 17.4 L6.3 13.1 Z" fill="${color}" ${stroke}/>` +
      `<path d="M3.6 3.6 L8.9 8.9" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/>` +
      `<circle cx="10.2" cy="10.2" r="1.75" fill="none" stroke="#fff" stroke-width="1.2"/>`
    );
  }
  if (shape === 'ew' || shape === 'ns') {
    const rot = shape === 'ns' ? ' transform="rotate(90 12 12)"' : '';
    return `<path d="M2.5 12 L7 7.5 V10.4 H17 V7.5 L21.5 12 L17 16.5 V13.6 H7 V16.5 Z"${rot} fill="${color}" ${stroke}/>`;
  }
  return `<path d="${ARROW_PATH}" fill="${color}" ${stroke}/>`;
}

const IMG_PH_SVG =
  '<svg class="swarm-ph-icon" viewBox="0 0 24 24" fill="none" stroke="#6E6E6E" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M4 18 L10 13 L14 16 L17 13.5 L21 17"/></svg>';

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
      id: i,
      color,
      x: i % 2 === 0 ? -40 : window.innerWidth + 40,
      y: 120 + i * 90,
      tx: window.innerWidth / 2,
      ty: 140,
      shape: 'arrow',
      renderedShape: '',
      press: 0,
      angle: 0,
      orbitAngle: (i / COLORS.length) * Math.PI * 2,
      ov: null, // active selection/measurement overlays for this cursor
      wf: null, // active growing wireframe box for this cursor
    })),
  );

  // Active red guide lines on screen: { axis: 'x'|'y', pos, cur, op, flash, dragging, vis }
  const guidesStateRef = useRef([]);
  const rulersAlphaRef = useRef(0);

  const wfLayerRef = useRef(null);
  const ovSvgRef = useRef(null);
  const badgesRef = useRef(null);
  const rulersRef = useRef(null);
  const caretRef = useRef(null);
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
        setTimeout(step, Math.min(25, rem));
      };
      setTimeout(step, Math.min(25, total));
    });
  };

  const sfx = () => {
    if (!soundRef.current) {
      soundRef.current = new SwarmSound();
      soundRef.current.init();
    }
    return soundRef.current;
  };

  // Move a cursor along a natural sine-arched curve (just like the
  // Swarm Rebuild extension's moveTo generator) with optional per-step
  // callback for live dragging.
  const moveCursorCurved = async (cursorIx, targetX, targetY, opts = {}) => {
    const c = cursorsRef.current[cursorIx];
    if (!c) return;
    if (opts.shape) c.shape = opts.shape;
    const x0 = c.x;
    const y0 = c.y;
    const tx = clamp(targetX, 6, window.innerWidth - 6);
    const ty = clamp(targetY, 6, window.innerHeight - 6);
    const dist = Math.hypot(tx - x0, ty - y0);
    if (dist < 1) {
      c.x = tx;
      c.y = ty;
      c.tx = tx;
      c.ty = ty;
      if (opts.onStep) opts.onStep(1, tx, ty);
      return;
    }
    const baseDur = opts.durationMs || clamp(65 + Math.sqrt(dist) * 4.2, 65, 210);
    const dur = baseDur / speedRef.current;
    const bend =
      opts.drag || opts.bend === 0
        ? 0
        : (Math.random() < 0.5 ? -1 : 1) * rand(0.05, 0.14) * Math.min(dist, 360);
    const steps = Math.max(4, Math.min(12, Math.round(dur / 16)));
    const stepWait = dur / steps;
    const dx = tx - x0;
    const dy = ty - y0;
    const L = Math.hypot(dx, dy) || 1;

    for (let k = 1; k <= steps; k++) {
      if (opts.sectionId && skipRef.current.has(opts.sectionId)) break;
      const pct = k / steps;
      const e = opts.drag ? easeInOut(pct) : easeOut(pct);
      const off = Math.sin(Math.PI * e) * bend;
      const cx = x0 + dx * e + (-dy / L) * off;
      const cy = y0 + dy * e + (dx / L) * off;
      c.x = cx;
      c.y = cy;
      c.tx = cx;
      c.ty = cy;
      if (opts.onStep) opts.onStep(e, cx, cy);
      await sleep(stepWait, opts.sectionId);
    }
    c.x = tx;
    c.y = ty;
    c.tx = tx;
    c.ty = ty;
    if (opts.onStep) opts.onStep(1, tx, ty);
  };

  const clickCursor = async (cursorIx, sectionId) => {
    const c = cursorsRef.current[cursorIx];
    if (!c) return;
    c.press = 1;
    sfx().press(c.x, window.innerWidth);
    await sleep(40 / speedRef.current, sectionId);
  };

  // Pull a red alignment guide out from the Left or Top 20px Figma ruler.
  const pullRulerGuide = async (cursorIx, axis, targetPos, sectionId) => {
    const c = cursorsRef.current[cursorIx];
    if (!c) return null;
    rulersAlphaRef.current = 1;
    const startX = axis === 'x' ? RULER_SIZE / 2 : clamp(window.innerWidth * 0.35, 60, window.innerWidth - 60);
    const startY = axis === 'y' ? RULER_SIZE / 2 : clamp(window.innerHeight * 0.35, 60, window.innerHeight - 60);
    await moveCursorCurved(cursorIx, startX, startY, { shape: 'arrow', durationMs: 90, sectionId });
    if (sectionId && skipRef.current.has(sectionId)) return null;

    c.press = 1;
    c.shape = axis === 'x' ? 'ew' : 'ns';
    const g = { axis, pos: targetPos, cur: axis === 'x' ? startX : startY, op: 1, flash: 0, dragging: true, vis: true };
    guidesStateRef.current.push(g);

    const endX = axis === 'x' ? targetPos : startX + 24;
    const endY = axis === 'y' ? targetPos : startY + 24;
    await moveCursorCurved(cursorIx, endX, endY, {
      shape: axis === 'x' ? 'ew' : 'ns',
      drag: true,
      durationMs: 130,
      sectionId,
      onStep: (_e, cx, cy) => {
        g.cur = axis === 'x' ? cx : cy;
      },
    });
    g.cur = targetPos;
    g.dragging = false;
    c.press = 0;
    c.shape = 'arrow';
    sfx().place('guide', endX, endY, 1, 1, window.innerWidth, window.innerHeight);
    return g;
  };

  // Draw a box or image the authentic Swarm Rebuild way:
  // 1. Move to top-left in `cross` shape.
  // 2. Drag diagonally while growing a #D9D9D9 wireframe placeholder
  //    (with the mountain/sun icon for images), 4 white 7x7 corner
  //    handles, dashed ruler lines, and a bottom W x H pill badge.
  // 3. Switch to `arrow`, morph wireframe into the real styled DOM
  //    element (`releaseEl`), and play the glass piano note.
  const drawBoxAuthentic = async (cursorIx, el, kind, durationMs, sectionId) => {
    const c = cursorsRef.current[cursorIx];
    if (!c || !el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width < 4 || rect.height < 4 || rect.bottom < 0 || rect.top > window.innerHeight + 100) {
      el.dataset.swarmBuilt = '1';
      el.style.clipPath = '';
      return;
    }
    rulersAlphaRef.current = 1;
    const x0 = clamp(rect.left, 4, window.innerWidth - 16);
    const y0 = clamp(rect.top, 4, window.innerHeight - 16);
    const maxW = Math.max(8, Math.min(rect.width, window.innerWidth - x0 - 4));
    const maxH = Math.max(8, Math.min(rect.height, window.innerHeight - y0 - 4));

    await moveCursorCurved(cursorIx, x0, y0, { shape: 'cross', durationMs: 85, sectionId });
    if (sectionId && skipRef.current.has(sectionId)) {
      el.dataset.swarmBuilt = '1';
      return;
    }
    c.press = 1;
    sfx().press(x0, window.innerWidth);

    const isImg = kind === 'image';
    const curBox = { x: x0, y: y0, w: 4, h: 4, isImg };
    c.wf = curBox;
    c.ov = () => [
      {
        t: 'box',
        b: curBox,
        handles: true,
        rulerLines: true,
        badge: `${Math.round(curBox.w)} × ${Math.round(curBox.h)}`,
      },
    ];

    await moveCursorCurved(cursorIx, x0 + maxW, y0 + maxH, {
      shape: 'cross',
      drag: true,
      durationMs: durationMs || 140,
      sectionId,
      onStep: (e) => {
        curBox.w = Math.max(6, maxW * e);
        curBox.h = Math.max(6, maxH * e);
      },
    });

    c.press = 0;
    c.shape = 'arrow';
    await sleep(45 / speedRef.current, sectionId);
    c.wf = null;
    releaseEl(el, isImg ? 'image' : 'rect', null);
    await sleep(55 / speedRef.current, sectionId);
    c.ov = null;
  };

  // Alt-drag duplicate choreography (matches Swarm Rebuild's `*duplicate`
  // and `*editText`):
  // 1. Click the master/previous card (`arrow`), show selection handles.
  // 2. Switch to double-arrow `dup` cursor.
  // 3. Reveal the new card AT the previous card's offset (`translate(ox, oy)`)
  //    and physically drag it across to its own slot while showing dual
  //    red selection boxes and the red spacing measurement line + badge!
  // 4. Flash blue text selection (`.swarm-sel-flash`) on its heading as
  //    the card settles.
  const duplicateCardAuthentic = async (cursorIx, prevRect, el, sectionId) => {
    const c = cursorsRef.current[cursorIx];
    if (!c || !el || !prevRect) return;
    const rect = el.getBoundingClientRect();
    if (rect.width < 4 || rect.height < 4 || rect.bottom < 0 || rect.top > window.innerHeight + 100) {
      el.dataset.swarmBuilt = '1';
      return;
    }

    const srcBox = { x: prevRect.left, y: prevRect.top, w: prevRect.width, h: prevRect.height };
    const grabX = clamp(srcBox.x + Math.min(srcBox.w * 0.45, 70), 8, window.innerWidth - 8);
    const grabY = clamp(srcBox.y + Math.min(srcBox.h * 0.4, 32), 8, window.innerHeight - 8);

    await moveCursorCurved(cursorIx, grabX, grabY, { shape: 'arrow', durationMs: 80, sectionId });
    if (sectionId && skipRef.current.has(sectionId)) {
      el.dataset.swarmBuilt = '1';
      return;
    }
    await clickCursor(cursorIx, sectionId);
    c.ov = () => [{ t: 'box', b: srcBox, handles: true, badge: `${Math.round(srcBox.w)} × ${Math.round(srcBox.h)}` }];
    await sleep(40 / speedRef.current, sectionId);

    c.shape = 'dup';
    c.press = 1;
    const ox = prevRect.left - rect.left;
    const oy = prevRect.top - rect.top;
    el.dataset.swarmBuilt = '1';
    el.style.transform = `translate(${ox}px, ${oy}px)`;

    const curDstBox = { x: prevRect.left, y: prevRect.top, w: rect.width, h: rect.height };
    c.ov = () => {
      const overlays = [
        { t: 'box', b: srcBox, color: 'red' },
        { t: 'box', b: curDstBox, color: 'red' },
      ];
      const sp = computeSpacingMeasure(srcBox, curDstBox);
      if (sp) overlays.push(sp);
      return overlays;
    };

    const targetX = clamp(grabX - ox, 8, window.innerWidth - 8);
    const targetY = clamp(grabY - oy, 8, window.innerHeight - 8);
    await moveCursorCurved(cursorIx, targetX, targetY, {
      shape: 'dup',
      drag: true,
      durationMs: 145,
      sectionId,
      onStep: (e) => {
        const curOx = ox * (1 - e);
        const curOy = oy * (1 - e);
        el.style.transform = `translate(${f1(curOx)}px, ${f1(curOy)}px)`;
        curDstBox.x = rect.left + curOx;
        curDstBox.y = rect.top + curOy;
      },
    });

    el.style.transform = '';
    c.press = 0;
    c.shape = 'arrow';
    sfx().place('dup', rect.left + rect.width / 2, rect.top, rect.width, rect.height, window.innerWidth, window.innerHeight);

    const finalBox = { x: rect.left, y: rect.top, w: rect.width, h: rect.height };
    c.ov = () => [{ t: 'box', b: finalBox, handles: true, badge: `${Math.round(finalBox.w)} × ${Math.round(finalBox.h)}` }];

    // Quick Figma text-selection flash on the duplicated card's title
    const cardTitle = el.querySelector('h3, .win98-titlebar, span');
    if (cardTitle) {
      cardTitle.classList.add('swarm-sel-flash');
      setTimeout(() => cardTitle.classList.remove('swarm-sel-flash'), 240);
    }
    await sleep(55 / speedRef.current, sectionId);
    c.ov = null;
  };

  // Type a heading with text-frame drag, character-by-character clip-path
  // reveal, blinking caret, font-scale stepping (`grow`), and guide snap!
  const typeHeadingAuthentic = async (cursorIx, headingEl, guide, sectionId) => {
    const c = cursorsRef.current[cursorIx];
    const caret = caretRef.current;
    if (!c || !headingEl) return;
    const rect = headingEl.getBoundingClientRect();
    if (rect.width <= 0 || rect.bottom <= 0 || rect.top >= window.innerHeight) {
      headingEl.dataset.swarmBuilt = '1';
      return;
    }

    const text = headingEl.textContent || '';
    const initDx = guide ? 24 : 0;
    headingEl.style.transform = initDx ? `translateX(${initDx}px) scale(0.84)` : 'scale(0.84)';
    headingEl.style.transformOrigin = 'left center';

    // 1. Drag a quick text frame with `cross` cursor
    const frameBox = { x: rect.left + initDx, y: rect.top, w: 8, h: Math.min(rect.height, 36) };
    await moveCursorCurved(cursorIx, frameBox.x, frameBox.y, { shape: 'cross', durationMs: 70, sectionId });
    c.ov = () => [
      {
        t: 'box',
        b: frameBox,
        handles: true,
        rulerLines: true,
        badge: `${Math.round(frameBox.w)} × ${Math.round(frameBox.h)}`,
      },
    ];
    await moveCursorCurved(cursorIx, frameBox.x + Math.min(rect.width, 260), frameBox.y + frameBox.h, {
      shape: 'cross',
      drag: true,
      durationMs: 90,
      sectionId,
      onStep: (e) => {
        frameBox.w = Math.max(12, Math.min(rect.width, 260) * e);
      },
    });

    // 2. Type across character-by-character with I-beam and blinking caret
    c.shape = 'ibeam';
    headingEl.dataset.swarmBuilt = '1';
    headingEl.style.clipPath = 'inset(0 100% 0 0)';
    if (caret) {
      caret.style.display = 'block';
      caret.style.top = `${rect.top + Math.max(0, (rect.height - 24) / 2)}px`;
    }

    const steps = Math.min(Math.max(text.length, 10), 16);
    for (let k = 1; k <= steps; k++) {
      if (sectionId && skipRef.current.has(sectionId)) break;
      const pct = k / steps;
      const x = rect.left + initDx + 4 + pct * Math.max(0, rect.width - 8);
      const y = rect.top + rect.height / 2;
      c.x = clamp(x, 8, window.innerWidth - 8);
      c.y = clamp(y, 8, window.innerHeight - 8);
      if (caret) caret.style.left = `${x + 4}px`;
      const rightInset = Math.max(0, Math.round((1 - pct) * 100));
      headingEl.style.clipPath = `inset(0 ${rightInset}% 0 0)`;
      frameBox.w = Math.max(24, rect.width * pct);
      const ch = text ? text[Math.floor(pct * (text.length - 1))] : '';
      sfx().key(x, window.innerWidth, `type-${cursorIx}`, 1, ch === ' ' ? 1 : 0);
      await sleep(10 / speedRef.current, sectionId);
    }
    if (caret) caret.style.display = 'none';
    headingEl.style.clipPath = '';

    // 3. Font-size step-up (`grow`) + snap onto the red ruler guide!
    c.shape = 'arrow';
    const fullBox = {
      x: rect.left + initDx,
      y: rect.top,
      w: rect.width,
      h: rect.height,
    };
    c.ov = () => [
      {
        t: 'box',
        b: fullBox,
        handles: true,
        rulerLines: true,
        underline: { x: fullBox.x, y: fullBox.y + fullBox.h - 3, w: fullBox.w },
        badge: `${Math.round(fullBox.w)} × ${Math.round(fullBox.h)}`,
      },
    ];
    for (let s = 0; s < 2; s++) {
      if (sectionId && skipRef.current.has(sectionId)) break;
      const sc = s === 0 ? 0.93 : 1;
      headingEl.style.transform = initDx ? `translateX(${initDx}px) scale(${sc})` : `scale(${sc})`;
      sfx().grow(s, c.x, window.innerWidth);
      await sleep(32 / speedRef.current, sectionId);
    }

    if (guide && initDx !== 0) {
      await moveCursorCurved(cursorIx, rect.left, rect.top + rect.height / 2, {
        shape: 'arrow',
        drag: true,
        durationMs: 75,
        sectionId,
        onStep: (e) => {
          const dx = initDx * (1 - e);
          headingEl.style.transform = `translateX(${f1(dx)}px)`;
          fullBox.x = rect.left + dx;
        },
      });
      guide.flash = 1;
      sfx().snap(rect.left, window.innerWidth);
    }
    headingEl.style.transform = '';
    headingEl.style.transformOrigin = '';
    await sleep(40 / speedRef.current, sectionId);
    c.ov = null;
  };

  const computeSpacingMeasure = (a, b) => {
    const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
    if (oy > 6) {
      const y = Math.max(a.y, b.y) + oy / 2;
      const [l, r] = a.x < b.x ? [a, b] : [b, a];
      const gap = Math.round(r.x - (l.x + l.w));
      if (gap > 2 && gap < 400) {
        return { t: 'measure', a: { x: l.x + l.w, y }, b: { x: r.x, y }, label: `${gap}` };
      }
    } else if (ox > 6) {
      const x = Math.max(a.x, b.x) + ox / 2;
      const [topB, botB] = a.y < b.y ? [a, b] : [b, a];
      const gap = Math.round(botB.y - (topB.y + topB.h));
      if (gap > 2 && gap < 400) {
        return { t: 'measure', a: { x, y: topB.y + topB.h }, b: { x, y: botB.y }, label: `${gap}` };
      }
    }
    return null;
  };

  const releaseEl = (el, kind, slideFromRect) => {
    if (!el) return;
    el.dataset.swarmBuilt = '1';
    el.style.clipPath = '';
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      if (slideFromRect) {
        const dx = clamp((slideFromRect.left - rect.left) * 0.25, -80, 80);
        const dy = clamp((slideFromRect.top - rect.top) * 0.25, -80, 80);
        el.animate(
          [
            { opacity: 0.4, transform: `translate(${dx}px, ${dy}px)` },
            { opacity: 1, transform: 'translate(0, 0)' },
          ],
          { duration: 180 / speedRef.current, easing: 'ease-out' },
        );
      } else {
        el.animate(
          [
            { opacity: 0.25, clipPath: 'inset(0 0 88% 0)' },
            { opacity: 1, clipPath: 'inset(0 0 0% 0)' },
          ],
          { duration: 210 / speedRef.current, easing: ' cubic-bezier(0.2, 0.75, 0.2, 1)' },
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

  const clearAllOverlays = () => {
    cursorsRef.current.forEach((c) => {
      c.ov = null;
      c.wf = null;
      c.press = 0;
      c.shape = 'arrow';
    });
    guidesStateRef.current = [];
    rulersAlphaRef.current = 0;
    if (caretRef.current) caretRef.current.style.display = 'none';
    if (wfLayerRef.current) wfLayerRef.current.innerHTML = '';
    if (ovSvgRef.current) ovSvgRef.current.innerHTML = '';
    if (badgesRef.current) badgesRef.current.innerHTML = '';
    if (rulersRef.current) rulersRef.current.innerHTML = '';
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

    el.dataset.swarmBuilding = '1';
    return { shell, heading, extras };
  };

  const releaseAllPartsInEl = (section, el) => {
    if (!el) return;
    delete el.dataset.swarmBuilding;
    el.dataset.swarmBuilt = '1';
    el.style.clipPath = '';
    el.style.transform = '';
    el.querySelectorAll('[data-swarm-shell], [data-swarm-part], h1, h2').forEach((node) => {
      node.dataset.swarmBuilt = '1';
      node.style.clipPath = '';
      node.style.transform = '';
    });
    sectionItems(section).forEach((item) => {
      item.dataset.swarmBuilt = '1';
      item.style.clipPath = '';
      item.style.transform = '';
    });
  };

  const checkAllDone = () => {
    if (builtRef.current.size >= SECTIONS.length && phaseRef.current === 'building') {
      updatePhase('done');
      setCurrentLabel('সব তৈরি!');
      clearAllOverlays();
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

  // Parallel multiplayer choreography per section:
  // Wave 1 (~0.25s): Cursor A drags out the outer Win98 window shell
  //                  (growing #D9D9D9 wireframe -> real window) while
  //                  Cursor B pulls a red alignment guide from the ruler.
  // Wave 2 (~1.4s):  All 4 cursors work simultaneously in parallel:
  //                  - Cursor A types the heading + snaps it to the guide.
  //                  - Cursor B draws Card 1 (master) + sequentially
  //                    Alt-drags duplicate Cards 2..N with the `dup` cursor!
  //                  - Cursors C & D simultaneously draw the section's
  //                    extra boxes/images (Hero image, quote box, buttons,
  //                    Contact form, Navbar taskbar).
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
    const baseIx = SECTIONS.findIndex((s) => s.id === section.id) % COLORS.length;
    const c0 = baseIx;
    const c1 = (baseIx + 1) % COLORS.length;
    const c2 = (baseIx + 2) % COLORS.length;
    const c3 = (baseIx + 3) % COLORS.length;

    const { shell, heading, extras } = prepareSectionParts(section, el);
    const shellEl = shell || el;
    const hRect = heading ? heading.getBoundingClientRect() : null;
    const wantGuide =
      hRect && hRect.width > 0 && hRect.bottom > 0 && hRect.top < window.innerHeight && section.id !== 'nav';

    // Wave 1: Cursor c0 drags the outer window shell while Cursor c1
    // simultaneously pulls a red guide from the left ruler!
    let activeGuide = null;
    await Promise.all([
      drawBoxAuthentic(c0, shellEl, 'rect', 145, section.id),
      wantGuide
        ? pullRulerGuide(c1, 'x', Math.round(hRect.left), section.id).then((g) => {
            activeGuide = g;
          })
        : Promise.resolve(),
    ]);
    if (aborted()) return;
    if (overBudget()) return finishFast();

    // Wave 2: All 4 cursors build the inner elements in parallel!
    const allItems = sectionItems(section).slice(0, MAX_CHOREOGRAPHED_ITEMS);

    // Worker A (c0): Type heading with caret, font-size grow, and guide snap
    const headingJob = (async () => {
      if (!heading) return;
      await typeHeadingAuthentic(c0, heading, activeGuide, section.id);
      if (activeGuide) {
        setTimeout(() => {
          activeGuide.vis = false;
        }, 450);
      }
    })();

    // Worker B (c1 & c2): Draw Master Card 1 with wireframe, then Alt-drag
    // duplicate Cards 2..N with the double-arrow `dup` cursor!
    const cardsJob = (async () => {
      if (allItems.length === 0) return;
      const master = allItems[0];
      if (!master.dataset.swarmBuilt) {
        await drawBoxAuthentic(c1, master, 'rect', 135, section.id);
      }
      let prevRect = master.getBoundingClientRect();
      for (let i = 1; i < allItems.length; i++) {
        if (aborted() || overBudget()) break;
        const item = allItems[i];
        if (!item.dataset.swarmBuilt) {
          const dupCursor = i % 2 === 1 ? c2 : c1;
          await duplicateCardAuthentic(dupCursor, prevRect, item, section.id);
        }
        prevRect = item.getBoundingClientRect();
      }
    })();

    // Workers C & D (c2 / c3): Simultaneously draw extras (Hero image with
    // mountain/sun placeholder icon, description box, action buttons,
    // Contact form as one box, Navbar taskbar).
    const extrasEven = extras.filter((_, idx) => idx % 2 === 0);
    const extrasOdd = extras.filter((_, idx) => idx % 2 === 1);

    const runExtrasWorker = async (workerCursor, list) => {
      for (const { el: partEl, kind } of list) {
        if (aborted() || overBudget()) break;
        if (!partEl || partEl.dataset.swarmBuilt) continue;
        await drawBoxAuthentic(workerCursor, partEl, kind, 130, section.id);
      }
    };

    await Promise.all([
      headingJob,
      cardsJob,
      runExtrasWorker(allItems.length > 0 ? c3 : c2, extrasEven),
      runExtrasWorker(c3, extrasOdd),
    ]);

    if (aborted()) return;

    // Finalize section and guarantee all child parts are marked built.
    releaseAllPartsInEl(section, el);
    guidesStateRef.current = [];
    rulersAlphaRef.current = 0;

    if (section.id === 'hero') {
      const r = el.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) {
        heroVisibleAtRef.current = nowMs();
      }
    }
    builtRef.current.add(section.id);
    setBuiltCount(builtRef.current.size);
    await sleep(35 / speedRef.current, section.id);
    checkAllDone();
  };

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
      el.style.transform = '';
    });
    document
      .querySelectorAll(
        '#projects .win98-window, #victims .win98-window, #skills .grid > .win98-inset, #process .grid > .win98-box',
      )
      .forEach((el) => {
        el.dataset.swarmBuilt = '1';
        el.style.clipPath = '';
        el.style.transform = '';
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
    clearAllOverlays();
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
        el.style.transform = '';
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

    // Intro: cursors swoop in from the sides and orbit the top center
    const cx = window.innerWidth / 2;
    const cy = 120;
    const orbitStart = perfMs();
    const orbit = () => {
      if (tokenRef.current !== token) return;
      const t = (perfMs() - orbitStart) / 1000;
      cursorsRef.current.forEach((c) => {
        const a = c.orbitAngle + t * 2.2;
        const r = Math.max(28, 95 - t * 35);
        c.x += (cx + Math.cos(a) * r - c.x) * 0.25;
        c.y += (cy + Math.sin(a) * r * 0.6 - c.y) * 0.25;
      });
      if (perfMs() - orbitStart < 320) requestAnimationFrame(orbit);
    };
    orbit();
    await sleep((isReplay ? 220 : 320) / speedRef.current);
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

  // 60fps imperative render loop: updates cursors, growing wireframes,
  // SVG selection boxes + 7x7 corner handles + dashed ruler lines + red
  // guides + red spacing lines, and the top/left 20px Figma rulers.
  useEffect(() => {
    if (reducedMotion) return undefined;
    let lastOvS = '';
    let lastBadgeS = '';
    let lastWfS = '';
    let lastRulerS = '';

    const tick = () => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const sx = window.scrollX;
      const sy = window.scrollY;
      const mouse = mouseRef.current;

      // 1. Update cursor positions, shapes, hotspot offsets, and press scale
      cursorsRef.current.forEach((c, i) => {
        const el = cursorElsRef.current[i];
        if (!el) return;
        c.press = Math.max(0, c.press - 0.09);
        if (phaseRef.current === 'done' || phaseRef.current === 'live') {
          const t = perfMs() / 1000;
          const ox = Math.cos(t * 1.4 + i * 1.57) * 32;
          const oy = Math.sin(t * 1.8 + i * 1.57) * 24;
          c.x += (mouse.x + ox - c.x) * 0.16;
          c.y += (mouse.y + oy - c.y) * 0.16;
        }
        el.style.transform = `translate(${f1(c.x)}px, ${f1(c.y)}px)`;
        const svg = el.firstChild;
        if (svg) {
          if (c.renderedShape !== c.shape) {
            svg.innerHTML = renderCursorInnerSvg(c.shape, c.color);
            c.renderedShape = c.shape;
          }
          const [hx, hy] = HOTSPOTS[c.shape] || HOTSPOTS.arrow;
          const sc = f1(1 - c.press * 0.14);
          svg.style.transformOrigin = `${hx}px ${hy}px`;
          svg.style.transform = `translate(${-hx}px, ${-hy}px) scale(${sc})`;
        }
      });

      // 2. Render growing #D9D9D9 wireframe placeholder boxes
      if (wfLayerRef.current) {
        let wfHtml = '';
        for (const c of cursorsRef.current) {
          if (!c.wf) continue;
          const { x, y, w, h, isImg } = c.wf;
          wfHtml += `<div class="swarm-wf-box" style="transform:translate(${f1(x)}px,${f1(y)}px);width:${f1(w)}px;height:${f1(h)}px">${isImg ? IMG_PH_SVG : ''}</div>`;
        }
        if (wfHtml !== lastWfS) {
          wfLayerRef.current.innerHTML = wfHtml;
          lastWfS = wfHtml;
        }
      }

      // 3. Render SVG selection rects, 7x7 corner handles, ruler lines,
      // red alignment guides, and red duplicate spacing measurements
      let svgS = '';
      let badgeS = '';
      const activeBoxesForRuler = [];

      for (const g of guidesStateRef.current) {
        if (!g.vis || g.op <= 0) continue;
        if (g.flash > 0) g.flash = Math.max(0, g.flash - 0.04);
        const sw = f1(1 + g.flash * 1.2);
        const flt = g.flash > 0 ? ` style="filter:drop-shadow(0 0 ${f1(2 + g.flash * 3)}px ${RED})"` : '';
        if (g.axis === 'x') {
          svgS += `<line x1="${f1(g.cur)}" x2="${f1(g.cur)}" y1="0" y2="${H}" stroke="${RED}" stroke-width="${sw}"${flt}/>`;
        } else {
          svgS += `<line x1="0" x2="${W}" y1="${f1(g.cur)}" y2="${f1(g.cur)}" stroke="${RED}" stroke-width="${sw}"${flt}/>`;
        }
      }

      for (const c of cursorsRef.current) {
        if (!c.ov) continue;
        const list = c.ov();
        for (const v of list) {
          if (v.t === 'box') {
            const x = f1(v.b.x);
            const y = f1(v.b.y);
            const w = f1(v.b.w);
            const h = f1(v.b.h);
            const col = v.color === 'red' ? RED : BLUE;
            svgS += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${col}" stroke-width="1"/>`;
            if (v.underline && v.underline.w > 0) {
              const u = v.underline;
              svgS += `<line x1="${f1(u.x)}" x2="${f1(u.x + u.w)}" y1="${f1(u.y)}" y2="${f1(u.y)}" stroke="${BLUE}" stroke-width="1.5"/>`;
            }
            if (v.rulerLines && rulersAlphaRef.current > 0.05) {
              svgS +=
                `<g stroke="${BLUE}" stroke-width="1" stroke-dasharray="2 2" opacity="0.75">` +
                `<line x1="${RULER_SIZE}" x2="${x}" y1="${f1(y + h / 2)}" y2="${f1(y + h / 2)}"/>` +
                `<line x1="${f1(x + w / 2)}" x2="${f1(x + w / 2)}" y1="${RULER_SIZE}" y2="${y}"/>` +
                `</g>`;
            }
            if (v.handles) {
              activeBoxesForRuler.push({ x, y, w, h });
              for (const [hx, hy] of [
                [x, y],
                [x + w, y],
                [x, y + h],
                [x + w, y + h],
              ]) {
                svgS += `<rect x="${f1(hx - 3.5)}" y="${f1(hy - 3.5)}" width="7" height="7" fill="#fff" stroke="${col}" stroke-width="1"/>`;
              }
            }
            if (v.badge && w > 0) {
              const bx = clamp(x + w / 2, 36, W - 36);
              const by = clamp(y + h + 6, 6, H - 28);
              badgeS += `<div class="swarm-badge" style="left:${f1(bx)}px;top:${f1(by)}px;background:${col}">${v.badge}</div>`;
            }
          } else if (v.t === 'measure') {
            const ax = f1(v.a.x);
            const ay = f1(v.a.y);
            const zx = f1(v.b.x);
            const zy = f1(v.b.y);
            svgS += `<line x1="${ax}" y1="${ay}" x2="${zx}" y2="${zy}" stroke="${RED}" stroke-width="1.2"/>`;
            const horiz = Math.abs(ay - zy) < 2;
            const lx = horiz ? (ax + zx) / 2 : ax + 18;
            const ly = horiz ? ay + 6 : (ay + zy) / 2 - 8;
            badgeS += `<div class="swarm-badge" style="left:${f1(lx)}px;top:${f1(ly)}px;background:${RED}">${v.label}</div>`;
          }
        }
      }

      if (ovSvgRef.current && svgS !== lastOvS) {
        ovSvgRef.current.innerHTML = svgS;
        lastOvS = svgS;
      }
      if (badgesRef.current && badgeS !== lastBadgeS) {
        badgesRef.current.innerHTML = badgeS;
        lastBadgeS = badgeS;
      }

      // 4. Render top & left 20px Figma rulers when active
      if (rulersRef.current) {
        if (rulersAlphaRef.current <= 0.01 || phaseRef.current !== 'building') {
          if (lastRulerS !== '') {
            rulersRef.current.innerHTML = '';
            lastRulerS = '';
          }
        } else {
          const step = 100;
          let topTicks = '';
          let leftTicks = '';
          const xStart = Math.floor(sx / step) * step;
          for (let worldX = xStart; worldX - sx < W; worldX += step / 2) {
            const rx = f1(worldX - sx);
            const major = worldX % step === 0;
            topTicks += `<line x1="${rx}" x2="${rx}" y1="${major ? 12 : 15}" y2="${RULER_SIZE}" stroke="#5E5E5E"/>`;
            if (major && rx > 24) {
              topTicks += `<text x="${f1(rx + 3)}" y="10" class="swarm-rtext">${worldX}</text>`;
            }
          }
          const yStart = Math.floor(sy / step) * step;
          for (let worldY = yStart; worldY - sy < H; worldY += step / 2) {
            const ry = f1(worldY - sy);
            const major = worldY % step === 0;
            leftTicks += `<line y1="${ry}" y2="${ry}" x1="${major ? 12 : 15}" x2="${RULER_SIZE}" stroke="#5E5E5E"/>`;
            if (major && ry > 28) {
              leftTicks += `<text x="11" y="${f1(ry - 3)}" class="swarm-rtext" transform="rotate(-90 11 ${f1(ry - 3)})">${worldY}</text>`;
            }
          }
          for (const b of activeBoxesForRuler) {
            topTicks =
              `<rect x="${b.x}" y="0" width="${b.w}" height="${RULER_SIZE}" fill="rgba(13,153,255,0.24)"/>` +
              topTicks +
              `<text x="${f1(b.x + 3)}" y="10" class="swarm-rtext swarm-rsel">${Math.round(b.x + sx)}</text>`;
            leftTicks =
              `<rect x="0" y="${b.y}" width="${RULER_SIZE}" height="${b.h}" fill="rgba(13,153,255,0.24)"/>` +
              leftTicks;
          }
          const rulerHtml =
            `<div class="swarm-ruler swarm-ruler-top"><svg width="${W}" height="${RULER_SIZE}">${topTicks}</svg></div>` +
            `<div class="swarm-ruler swarm-ruler-left"><svg width="${RULER_SIZE}" height="${H}">${leftTicks}</svg></div>` +
            `<div class="swarm-ruler-corner"></div>`;
          if (rulerHtml !== lastRulerS) {
            rulersRef.current.innerHTML = rulerHtml;
            lastRulerS = rulerHtml;
          }
        }
      }

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
        <div ref={wfLayerRef} className="swarm-wf-layer" />
        <svg ref={ovSvgRef} className="swarm-ov-svg" />
        <div ref={badgesRef} className="swarm-badges" />
        <div ref={caretRef} className="swarm-caret" />
        <div ref={rulersRef} className="swarm-rulers" />
        {COLORS.map((color, i) => (
          <div
            key={color}
            ref={(el) => {
              cursorElsRef.current[i] = el;
            }}
            className="swarm-cursor"
            dangerouslySetInnerHTML={{
              __html: `<svg width="28" height="28" viewBox="0 0 28 28">${renderCursorInnerSvg('arrow', color)}</svg>`,
            }}
          />
        ))}
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
