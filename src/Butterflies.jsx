import { useEffect, useRef } from 'react';
import { isLowPower, observeVisibility } from './perf';
import './butterflies.css';

export default function Butterflies() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Prevent duplicate canvas creation during React HMR/renders
    if (container.querySelector('canvas')) return;

    let pc = null;
    let cancelled = false;
    let booting = false;

    // Intercept event listener registrations to prevent the library from blocking mouse wheel and touch scrolling
    const originalAddEventListener = container.addEventListener;
    container.addEventListener = function (type, listener, options) {
      if (
        type === 'wheel' ||
        type === 'mousewheel' ||
        type === 'DOMMouseScroll' ||
        type === 'touchmove'
      ) {
        // Do not register these listeners to keep default scrolling behavior intact
        return;
      }
      originalAddEventListener.call(this, type, listener, options);
    };

    // The effect library is ~200 KB and previously loaded as a static import,
    // which blocked first paint on a third-party request. Now it is fetched
    // lazily, and only once the section is actually near the viewport.
    const boot = async () => {
      if (booting || cancelled || container.querySelector('canvas')) return;
      booting = true;

      let butterfliesBackground;
      try {
        ({ butterfliesBackground } = await import(
          /* @vite-ignore */ 'https://unpkg.com/threejs-toys@0.0.8/build/threejs-toys.module.cdn.min.js'
        ));
      } catch {
        booting = false;
        return;
      }

      if (cancelled) return;

      const opts = {
        el: container,
        eventsEl: container, // Handle pointer events (hover/drag) on the section container
        background: 0x100c1a, // Match the dark theme background color
        material: 'phong',
        lights: [
          { type: 'ambient', params: [0xffffff, 0.5] },
          { type: 'directional', params: [0xffffff, 1], props: { position: [10, 0, 0] } }
        ],
        materialParams: { transparent: true, alphaTest: 0.5 },
        texture: '/butterflies.png', // Reference the local image served by Vite from the public directory
        textureCount: 4,
        wingsScale: [2, 2, 2],
        wingsWidthSegments: 16,
        wingsHeightSegments: 16,
        wingsSpeed: 0.75,
        wingsDisplacementScale: 1.25,
        noiseCoordScale: 0.01,
        noiseTimeCoef: 0.0005,
        noiseIntensity: 0.0025,
        attractionRadius1: 100,
        attractionRadius2: 150,
        maxVelocity: 0.1,
      };

      // The GPGPU simulation texture is the dominant cost here, so shrink it
      // on phones along with the wing tessellation.
      pc = butterfliesBackground(
        isLowPower
          ? {
              ...opts,
              gpgpuSize: 10,
              wingsWidthSegments: 8,
              wingsHeightSegments: 8,
              attractionRadius1: 60,
              attractionRadius2: 90,
            }
          : { ...opts, gpgpuSize: 18 }
      );
    };

    // Start the download early (300px ahead) but never while far offscreen.
    const stopObserving = observeVisibility(container, (inView) => {
      if (inView) boot();
    }, { rootMargin: '300px 0px' });

    return () => {
      cancelled = true;
      stopObserving();
      // Restore the original event listener registration method
      container.addEventListener = originalAddEventListener;
      if (pc && typeof pc.destroy === 'function') {
        pc.destroy();
      }
    };
  }, []);

  return (
    <section id="butterflies" className="butterflies-section">
      <div ref={containerRef} id="butterflies-app" />
    </section>
  );
}
