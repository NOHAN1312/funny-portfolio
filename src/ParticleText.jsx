import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import './particleText.css';

export default function ParticleText() {
  const containerRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const [inputText, setInputText] = useState('');
  const morphFnRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvasContainer = canvasContainerRef.current;
    if (!container || !canvasContainer) return;

    // Prevent duplicate canvas creation during React HMR/re-renders
    if (canvasContainer.querySelector('canvas')) return;

    // Setup Three.js scene
    const scene = new THREE.Scene();
    
    // Setup camera relative to container dimensions
    let currentWidth = canvasContainer.clientWidth || window.innerWidth;
    let currentHeight = canvasContainer.clientHeight || 650;

    const camera = new THREE.PerspectiveCamera(75, currentWidth / currentHeight, 0.1, 1000);
    camera.position.z = 25;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(currentWidth, currentHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x100c1a, 1); // Solid background matching theme
    canvasContainer.appendChild(renderer.domElement);

    const count = 12000;
    let currentState = 'text'; // 'text' or 'sphere'
    let currentTween = null;
    let resetTimeout = null;

    // Helper for spherical distribution
    function sphericalDistribution(i) {
      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;
      return {
        x: 5.8 * Math.cos(theta) * Math.sin(phi),
        y: 5.8 * Math.sin(theta) * Math.sin(phi),
        z: 5.8 * Math.cos(phi)
      };
    }

    // Text parsing function using hidden canvas
    function createTextPoints(text) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const fontSize = 100;
      const padding = 20;

      ctx.font = `bold ${fontSize}px Arial`;
      const textMetrics = ctx.measureText(text);
      const textWidth = textMetrics.width;
      const textHeight = fontSize;

      canvas.width = textWidth + padding * 2;
      canvas.height = textHeight + padding * 2;

      ctx.fillStyle = 'white';
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillText(text, canvas.width / 2, canvas.height / 2);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      const points = [];
      const threshold = 128;

      // Calculate dynamic divisor based on text length and aspect ratio to ensure it fits the screen
      const aspect = currentWidth / currentHeight;
      let divisor = 10; // base divisor for <= 5 characters
      if (text.length > 5) {
        divisor = 10 * (text.length / 5);
      }
      // Scale down further on narrow viewports
      const aspectScale = Math.max(1, 1.35 / aspect);
      divisor *= aspectScale;

      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i] > threshold) {
          const x = (i / 4) % canvas.width;
          const y = Math.floor((i / 4) / canvas.width);

          if (Math.random() < 0.35) {
            points.push({
              x: (x - canvas.width / 2) / divisor,
              y: -(y - canvas.height / 2) / divisor
            });
          }
        }
      }

      return points;
    }

    // Get initial text points for default 'N4HAN' text
    const initialTextPoints = createTextPoints('N4HAN');

    // Create particles geometry
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      if (i < initialTextPoints.length) {
        positions[i * 3] = initialTextPoints[i].x;
        positions[i * 3 + 1] = initialTextPoints[i].y;
        positions[i * 3 + 2] = 0;

        const normX = (initialTextPoints[i].x + 10) / 20;
        const color = new THREE.Color();
        color.setHSL(0.77 - normX * 0.2, 0.8, 0.6);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      } else {
        // Disperse excess particles in a circular background cloud
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 20 + 10;
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = Math.sin(angle) * radius;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 10;

        const color = new THREE.Color('#3A0CA3');
        colors[i * 3] = color.r * 0.3;
        colors[i * 3 + 1] = color.g * 0.3;
        colors[i * 3 + 2] = color.b * 0.3;
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Morph to Text (Optimized to use a single GSAP tween for 12,000 particles)
    function morphToText(text) {
      currentState = 'text';
      if (resetTimeout) clearTimeout(resetTimeout);
      if (currentTween) currentTween.kill();

      const textPoints = createTextPoints(text);
      console.log('Dynamic Scaling Debug:', {
        text,
        textPointsCount: textPoints.length,
        currentWidth,
        currentHeight,
        minX: textPoints.length ? Math.min(...textPoints.map(p => p.x)) : 0,
        maxX: textPoints.length ? Math.max(...textPoints.map(p => p.x)) : 0,
      });

      const targetPositions = new Float32Array(count * 3);
      const targetColors = new Float32Array(count * 3);

      // Reset rotation back to 0 so the text is readable
      gsap.to(particles.rotation, {
        x: 0,
        y: 0,
        z: 0,
        duration: 0.5
      });

      for (let i = 0; i < count; i++) {
        if (i < textPoints.length) {
          targetPositions[i * 3] = textPoints[i].x;
          targetPositions[i * 3 + 1] = textPoints[i].y;
          targetPositions[i * 3 + 2] = 0;

          const normX = (textPoints[i].x + 10) / 20;
          const color = new THREE.Color();
          color.setHSL(0.77 - normX * 0.2, 0.8, 0.6);
          targetColors[i * 3] = color.r;
          targetColors[i * 3 + 1] = color.g;
          targetColors[i * 3 + 2] = color.b;
        } else {
          // Disperse excess particles in a circular background cloud
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * 20 + 10;
          targetPositions[i * 3] = Math.cos(angle) * radius;
          targetPositions[i * 3 + 1] = Math.sin(angle) * radius;
          targetPositions[i * 3 + 2] = (Math.random() - 0.5) * 10;

          const color = new THREE.Color('#3A0CA3');
          targetColors[i * 3] = color.r * 0.3;
          targetColors[i * 3 + 1] = color.g * 0.3;
          targetColors[i * 3 + 2] = color.b * 0.3;
        }
      }

      const initialPositions = particles.geometry.attributes.position.array.slice();
      const initialColors = particles.geometry.attributes.color.array.slice();
      const progressObj = { progress: 0 };

      currentTween = gsap.to(progressObj, {
        progress: 1,
        duration: 2,
        ease: "power2.inOut",
        onUpdate: () => {
          const t = progressObj.progress;
          const pos = particles.geometry.attributes.position.array;
          const cols = particles.geometry.attributes.color.array;
          for (let i = 0; i < count * 3; i++) {
            pos[i] = initialPositions[i] * (1 - t) + targetPositions[i] * t;
            cols[i] = initialColors[i] * (1 - t) + targetColors[i] * t;
          }
          particles.geometry.attributes.position.needsUpdate = true;
          particles.geometry.attributes.color.needsUpdate = true;
        }
      });

      // Schedule transition after 6 seconds
      resetTimeout = setTimeout(() => {
        if (text.toUpperCase() === 'N4HAN') {
          morphToSphere();
        } else {
          morphToText('N4HAN');
        }
      }, 6000);
    }

    // Morph to Sphere
    function morphToSphere() {
      currentState = 'sphere';
      if (resetTimeout) clearTimeout(resetTimeout);
      if (currentTween) currentTween.kill();

      const targetPositions = new Float32Array(count * 3);
      const targetColors = new Float32Array(count * 3);

      for (let i = 0; i < count; i++) {
        const point = sphericalDistribution(i);
        targetPositions[i * 3] = point.x + (Math.random() - 0.5) * 0.5;
        targetPositions[i * 3 + 1] = point.y + (Math.random() - 0.5) * 0.5;
        targetPositions[i * 3 + 2] = point.z + (Math.random() - 0.5) * 0.5;

        const depth = Math.sqrt(point.x * point.x + point.y * point.y + point.z * point.z) / 5.8;
        const color = new THREE.Color();
        color.setHSL(0.5 + depth * 0.2, 0.7, 0.4 + depth * 0.3);

        targetColors[i * 3] = color.r;
        targetColors[i * 3 + 1] = color.g;
        targetColors[i * 3 + 2] = color.b;
      }

      const initialPositions = particles.geometry.attributes.position.array.slice();
      const initialColors = particles.geometry.attributes.color.array.slice();
      const progressObj = { progress: 0 };

      currentTween = gsap.to(progressObj, {
        progress: 1,
        duration: 2,
        ease: "power2.inOut",
        onUpdate: () => {
          const t = progressObj.progress;
          const pos = particles.geometry.attributes.position.array;
          const cols = particles.geometry.attributes.color.array;
          for (let i = 0; i < count * 3; i++) {
            pos[i] = initialPositions[i] * (1 - t) + targetPositions[i] * t;
            cols[i] = initialColors[i] * (1 - t) + targetColors[i] * t;
          }
          particles.geometry.attributes.position.needsUpdate = true;
          particles.geometry.attributes.color.needsUpdate = true;
        }
      });

      // Schedule morphing back to 'N4HAN' after 6 seconds of spinning
      resetTimeout = setTimeout(() => {
        morphToText('N4HAN');
      }, 6000);
    }

    // Expose morphing function to React ref
    morphFnRef.current = morphToText;

    // Animation loop
    let animationFrameId;
    function animate() {
      animationFrameId = requestAnimationFrame(animate);

      if (currentState === 'sphere') {
        // Spin the sphere
        particles.rotation.y += 0.003;
        particles.rotation.x += 0.001;
      } else {
        // Subtle 3D floating movement for organic feel and readability
        particles.rotation.y = Math.sin(Date.now() * 0.0005) * 0.15;
        particles.rotation.x = Math.cos(Date.now() * 0.0005) * 0.08;
      }

      renderer.render(scene, camera);
    }
    animate();

    // Start the first transition loop from N4HAN to Sphere after 6 seconds
    resetTimeout = setTimeout(() => {
      morphToSphere();
    }, 6000);

    // Resize Handler bounded to container element
    const handleResize = () => {
      const w = canvasContainer.clientWidth || window.innerWidth;
      const h = canvasContainer.clientHeight || 650;
      currentWidth = w;
      currentHeight = h;
      camera.aspect = currentWidth / currentHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentWidth, currentHeight);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(canvasContainer);

    // Unmount cleanup logic
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (resetTimeout) clearTimeout(resetTimeout);
      if (currentTween) currentTween.kill();

      // Dispose Three.js entities
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (canvasContainer.contains(renderer.domElement)) {
        canvasContainer.removeChild(renderer.domElement);
      }
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim() && morphFnRef.current) {
      morphFnRef.current(inputText.trim());
    }
  };

  return (
    <section ref={containerRef} id="particle-text" className="particle-text-section">
      <div ref={canvasContainerRef} className="particle-text-canvas-container" />
      
      <div className="particle-text-content">
        <div className="particle-text-headers">
          <h2 className="text-center text-4xl md:text-5xl font-black mb-6 text-white text-glow" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
            পার্টিকেল <span className="sunset-text">টেক্সট ম্যাজিক</span>
          </h2>
          <p className="text-center text-[#afa8bc] text-lg max-w-md mx-auto mb-6 leading-relaxed">
            নিচের বক্সে ইংরেজি কোনো শব্দ লিখে সাবমিট করুন আর দেখুন ম্যাজিক!
          </p>
        </div>

        <form className="particle-text-input-container" onSubmit={handleSubmit}>
          <div className="particle-text-input-wrapper">
            <input 
              type="text" 
              placeholder="Type something in English..." 
              maxLength="20"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <button type="submit">
              <span className="button-content">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Create</span>
              </span>
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
