import { useEffect, useRef } from 'react';
import { butterfliesBackground } from 'https://unpkg.com/threejs-toys@0.0.8/build/threejs-toys.module.cdn.min.js';
import './butterflies.css';

export default function Butterflies() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Prevent duplicate canvas creation during React HMR/renders
    if (container.querySelector('canvas')) return;

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

    const pc = butterfliesBackground({
      el: container,
      eventsEl: container, // Handle pointer events (hover/drag) on the section container
      gpgpuSize: 18,
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
      maxVelocity: 0.1
    });

    return () => {
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
