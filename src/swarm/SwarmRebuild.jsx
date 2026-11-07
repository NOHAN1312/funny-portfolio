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
    const dur = clamp(dist / 1.1, 200, 950) / speedRef.current;
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
      { duration: 360 / speedRef.current, easing: 'ease-out', fill: 'forwards' },
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
      duration: 380 / speedRef.current,
      easing: 'ease-out',
      fill: 'forwards',
    });
    await sleep(380 / speedRef.current);
    sfx().snap(rect.left + rect.width / 2, window.innerWidth);
    await sleep(160 / speedRef.current);
    g.style.display = 'none';
  };

  const typeAcross = async (cursorIx, rect, text) => {
    const caret = caretRef.current;
    const steps = Math.min(Math.max(text ? text.length : 12, 8), 26);
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
      await sleep(34 / speedRef.current);
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
        { duration: 550 / speedRef.current, easing: 'ease-out' },
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
    await sleep(300 / speedRef.current);
    hideDrawBox();
    if (isDup && prevRect) {
      const sp = spacingRef.current;
      if (sp) {
        sp.style.display = 'block';
        sp.style.left = `${rect.left}px`;
        sp.style.top = `${Math.max(8, rect.top - 26)}px`;
        sp.textContent = `↔ ${Math.round(Math.abs(rect.top - prevRect.bottom))}px`;
        await sleep(220 / speedRef.current);
        sp.style.display = 'none';
      }
      sfx().place('dup', rect.left + rect.width / 2, rect.top, rect.width, rect.height, window.innerWidth, window.innerHeight);
    }
    releaseEl(el, kind === 'image' ? 'image' : 'rect');
    await sleep(150 / speedRef.current);
  };

  const buildSection = async (section) => {
    const token = tokenRef.current;
    const el =
      section.id === 'nav' ? document.querySelector('nav') : document.getElementById(section.id);
    if (!el) {
      builtRef.current.add(section.id);
      setBuiltCount(builtRef.current.size);
      return;
    }
    if (builtRef.current.has(section.id)) return;
    buildingRef.current.add(section.id);
    setCurrentLabel(`${section.label} বানানো হচ্ছে…`);
    const rect = el.getBoundingClientRect();
    const lead = SECTIONS.findIndex((s) => s.id === section.id) % COLORS.length;

    // 1. Draw the section box with a crosshair + live W x H badge.
    await moveCursorTo(lead, rect.left + 10, rect.top + 10, 'cross');
    if (tokenRef.current !== token) return;
    hoverOthers(lead, rect);
    sfx().press(rect.left, window.innerWidth);
    showDrawBox(rect);
    await sleep(360 / speedRef.current);
    hideDrawBox();

    // 2. Ruler guide + typing across the heading.
    const heading = el.querySelector('h1, h2');
    if (heading) {
      const hRect = heading.getBoundingClientRect();
      if (hRect.width > 0) {
        await showGuide(hRect);
        if (tokenRef.current !== token) return;
        await typeAcross(lead, hRect, heading.textContent || '');
      }
    }

    // 3. Build the repeated items inside, one by one.
    let itemSelector = null;
    if (section.id === 'projects') itemSelector = '#projects .win98-window';
    else if (section.id === 'victims') itemSelector = '#victims .win98-window';
    else if (section.id === 'process') itemSelector = '#process .win98-box';
    else if (section.id === 'skills') itemSelector = '#skills .grid .win98-inset';
    if (itemSelector) {
      const items = Array.from(document.querySelectorAll(itemSelector));
      let prevRect = null;
      for (let i = 0; i < items.length; i++) {
        if (tokenRef.current !== token) return;
        const item = items[i];
        if (item.dataset.swarmBuilt) {
          prevRect = item.getBoundingClientRect();
          continue;
        }
        const cursorIx = (lead + i + 1) % COLORS.length;
        await drawItem(cursorIx, item, 'rect', i > 0, prevRect);
        prevRect = item.getBoundingClientRect();
      }
    }

    // Contact form: draw each field in order, but never type into it —
    // the form stays exactly as the user built it.
    if (section.id === 'contact') {
      const fields = Array.from(el.querySelectorAll('form input, form textarea, form button'));
      for (let i = 0; i < fields.length; i++) {
        if (tokenRef.current !== token) return;
        await drawItem((lead + i) % COLORS.length, fields[i], 'rect', false, null);
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

    // 4. Release the real section.
    releaseEl(el, 'rect');
    builtRef.current.add(section.id);
    buildingRef.current.delete(section.id);
    setBuiltCount(builtRef.current.size);
    await sleep(150 / speedRef.current);

    if (builtRef.current.size >= SECTIONS.length) {
      setPhase('done');
      setCurrentLabel('সব তৈরি!');
      sfx().finale();
    }
  };

  const enqueueBuild = (section) => {
    if (builtRef.current.has(section.id) || buildingRef.current.has(section.id)) return;
    buildingRef.current.add(section.id);
    queueRef.current = queueRef.current
      .then(() => {
        buildingRef.current.delete(section.id);
        return buildSection(section);
      })
      .catch(() => {});
  };

  const markAllBuilt = () => {
    document.querySelectorAll('.reveal, nav').forEach((el) => {
      el.dataset.swarmBuilt = '1';
    });
    document
      .querySelectorAll('#projects .win98-window, #victims .win98-window, #skills .grid .win98-inset, #process .win98-box')
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
      if (performance.now() - orbitStart < 1200) requestAnimationFrame(orbit);
    };
    orbit();
    await sleep(isReplay ? 700 : 1300);
    if (tokenRef.current !== token) return;
    sfx().start();
    await enqueueBuild(SECTIONS[0]);
    await enqueueBuild(SECTIONS[1]);
    // Remaining sections build only when they truly enter the viewport.
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const sec = SECTIONS.find((s) => s.id === entry.target.id);
          if (sec) enqueueBuild(sec);
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
    );
    observerRef.current = observer;
    SECTIONS.slice(2).forEach((sec) => {
      const el = document.getElementById(sec.id);
      if (el) observer.observe(el);
    });
    // Mobile: gentle auto-tour after the hero is built.
    if (window.innerWidth < 720) {
      const waitHero = setInterval(() => {
        if (tokenRef.current !== token || phaseRef.current !== 'building') {
          clearInterval(waitHero);
          return;
        }
        if (builtRef.current.has('hero') && !userScrolledRef.current && window.scrollY < 100) {
          clearInterval(waitHero);
          setTourOn(true);
          tourRef.current = true;
          void runTour();
        }
      }, 500);
      setTimeout(() => clearInterval(waitHero), 30000);
    }
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
        Date.now() - started < 20000 &&
        tourRef.current &&
        tokenRef.current === token
      ) {
        await sleep(200);
      }
      await sleep(500 / speedRef.current);
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
    void startRun(false);
    return () => {
      tokenRef.current = -1;
      cancelAnimationFrame(rafRef.current);
      if (observerRef.current) observerRef.current.disconnect();
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
        <button type="button" onClick={toggleSound} title="সাউন্ড (M)">
          {soundBlocked ? '🔊 শব্দের জন্য ট্যাপ করুন' : soundOn ? '🔊 সাউন্ড' : '🔇 নিঃশব্দ'}
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
