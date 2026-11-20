import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Fixed full-screen WebGL particle field.
 * Particles morph between 7 shapes; the active shape is chosen by the chapter
 * currently in view (window.__nxShape, written by PublicExperience) and the
 * field also reacts to scroll velocity + pointer.
 *
 * Shapes: 0 sphere · 1 "NEC" glyphs · 2 terrain wave · 3 orbit rings
 *         4 double helix · 5 spiral galaxy · 6 star tunnel
 */

const SHAPE_COUNT = 7;

function rand(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sampleText(text, count, r) {
  const canvas = document.createElement('canvas');
  const W = 900;
  const H = 320;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 270px Outfit, "Arial Black", sans-serif';
  ctx.fillText(text, W / 2, H / 2 + 10);
  const data = ctx.getImageData(0, 0, W, H).data;
  const pts = [];
  for (let y = 0; y < H; y += 3) {
    for (let x = 0; x < W; x += 3) {
      if (data[(y * W + x) * 4] > 128) pts.push([x, y]);
    }
  }
  const out = new Float32Array(count * 3);
  if (!pts.length) return out;
  for (let i = 0; i < count; i++) {
    const p = pts[Math.floor(r() * pts.length)];
    out[i * 3] = ((p[0] + r() * 3) / W - 0.5) * 9.2;
    out[i * 3 + 1] = -((p[1] + r() * 3) / H - 0.5) * 3.3;
    out[i * 3 + 2] = (r() - 0.5) * 0.7;
  }
  return out;
}

function buildShapes(count) {
  const r = rand(1998);
  const shapes = [];

  // 0 — luminous sphere (fibonacci shell + soft core)
  const sphere = new Float32Array(count * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const rad = Math.sqrt(1 - y * y);
    const th = golden * i;
    const shell = i % 5 === 0 ? 0.35 + r() * 0.6 : 1;
    const R = 2.6 * shell + (r() - 0.5) * 0.08;
    sphere[i * 3] = Math.cos(th) * rad * R;
    sphere[i * 3 + 1] = y * R;
    sphere[i * 3 + 2] = Math.sin(th) * rad * R;
  }
  shapes.push(sphere);

  // 1 — NEC glyphs
  shapes.push(sampleText('NEC', count, r));

  // 2 — terrain wave
  const terrain = new Float32Array(count * 3);
  const side = Math.ceil(Math.sqrt(count));
  for (let i = 0; i < count; i++) {
    const gx = (i % side) / side - 0.5;
    const gz = Math.floor(i / side) / side - 0.5;
    const x = gx * 14;
    const z = gz * 14;
    terrain[i * 3] = x;
    terrain[i * 3 + 1] = Math.sin(x * 0.7) * 0.45 + Math.cos(z * 0.9) * 0.45 - 1.4;
    terrain[i * 3 + 2] = z;
  }
  shapes.push(terrain);

  // 3 — orbit rings (atom / departments)
  const rings = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const ring = i % 4;
    const a = r() * Math.PI * 2;
    const R = ring === 3 ? 0.7 * Math.cbrt(r()) : 2.9 + (r() - 0.5) * 0.12;
    let x = Math.cos(a) * R;
    let y = ring === 3 ? (r() - 0.5) * 1.2 : (r() - 0.5) * 0.08;
    let z = Math.sin(a) * R;
    if (ring === 3) {
      z = (r() - 0.5) * 1.2;
    } else {
      const tilt = ring * (Math.PI / 3);
      const ny = y * Math.cos(tilt) - z * Math.sin(tilt);
      const nz = y * Math.sin(tilt) + z * Math.cos(tilt);
      const rot = ring * 0.9;
      const nx = x * Math.cos(rot) - nz * Math.sin(rot);
      z = x * Math.sin(rot) + nz * Math.cos(rot);
      x = nx;
      y = ny;
    }
    rings[i * 3] = x;
    rings[i * 3 + 1] = y;
    rings[i * 3 + 2] = z;
  }
  shapes.push(rings);

  // 4 — double helix (research)
  const helix = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const t = (i / count) * Math.PI * 10;
    const strand = i % 3;
    const y = (i / count - 0.5) * 9;
    if (strand === 2) {
      const k = r();
      const a1 = t;
      const a2 = t + Math.PI;
      helix[i * 3] = Math.cos(a1) * 1.3 * (1 - k) + Math.cos(a2) * 1.3 * k;
      helix[i * 3 + 1] = y;
      helix[i * 3 + 2] = Math.sin(a1) * 1.3 * (1 - k) + Math.sin(a2) * 1.3 * k;
    } else {
      const a = t + strand * Math.PI;
      helix[i * 3] = Math.cos(a) * 1.3 + (r() - 0.5) * 0.12;
      helix[i * 3 + 1] = y + (r() - 0.5) * 0.12;
      helix[i * 3 + 2] = Math.sin(a) * 1.3 + (r() - 0.5) * 0.12;
    }
  }
  shapes.push(helix);

  // 5 — spiral galaxy
  const galaxy = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const arm = i % 3;
    const d = Math.pow(r(), 1.6) * 5.2;
    const a = d * 1.15 + (arm * Math.PI * 2) / 3;
    const spread = (r() - 0.5) * (0.25 + d * 0.12);
    galaxy[i * 3] = Math.cos(a) * d + spread;
    galaxy[i * 3 + 1] = (r() - 0.5) * 0.35 * (1.2 - d / 6);
    galaxy[i * 3 + 2] = Math.sin(a) * d + spread;
  }
  shapes.push(galaxy);

  // 6 — star tunnel
  const tunnel = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const a = r() * Math.PI * 2;
    const R = 2.2 + r() * 3.5;
    tunnel[i * 3] = Math.cos(a) * R;
    tunnel[i * 3 + 1] = Math.sin(a) * R;
    tunnel[i * 3 + 2] = (r() - 0.5) * 18;
  }
  shapes.push(tunnel);

  return shapes;
}

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uW[7];
  uniform float uTransition;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uVelocity;
  attribute vec3 aS0; attribute vec3 aS1; attribute vec3 aS2; attribute vec3 aS3;
  attribute vec3 aS4; attribute vec3 aS5; attribute vec3 aS6;
  attribute float aRand;
  varying float vRand;
  varying float vDepth;

  void main() {
    // weighted blend → any shape crossfades straight into any other
    vec3 p = aS0 * uW[0] + aS1 * uW[1] + aS2 * uW[2] + aS3 * uW[3]
           + aS4 * uW[4] + aS5 * uW[5] + aS6 * uW[6];

    // mid-transition the swarm breathes outward, then settles into the new form
    float t = uTime * 0.6 + aRand * 6.2831;
    vec3 swirl = vec3(sin(t * 1.3), cos(t * 1.1), sin(t * 0.9));
    p += swirl * (0.035 + uVelocity * 0.25 + uTransition * (0.35 + aRand * 0.5));

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float size = uSize * (0.55 + aRand * 0.9);
    gl_PointSize = size * uPixelRatio * (8.0 / -mv.z);
    vRand = aRand;
    vDepth = clamp((-mv.z - 3.0) / 14.0, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  uniform float uTime;
  varying float vRand;
  varying float vDepth;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float glow = pow(1.0 - d * 2.0, 1.8);
    vec3 col = mix(uColorA, uColorB, smoothstep(0.15, 0.85, vRand));
    col = mix(col, uColorC, step(0.93, vRand));
    float twinkle = 0.75 + 0.25 * sin(uTime * 2.0 + vRand * 40.0);
    gl_FragColor = vec4(col * twinkle, glow * (1.0 - vDepth * 0.65));
  }
`;

export default function ParticleUniverse({ reducedMotion = false }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' });
    } catch (err) {
      console.warn('[NX] WebGL unavailable, particles disabled', err);
      return undefined;
    }

    const isMobile = window.matchMedia('(max-width: 820px)').matches;
    const count = reducedMotion ? 4000 : isMobile ? 7000 : 16000;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.75);

    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 9);

    const geometry = new THREE.BufferGeometry();
    const shapes = buildShapes(count);
    geometry.setAttribute('position', new THREE.BufferAttribute(shapes[0].slice(), 3));
    shapes.forEach((s, i) => geometry.setAttribute(`aS${i}`, new THREE.BufferAttribute(s, 3)));
    const rnd = rand(42);
    const aRand = new Float32Array(count);
    for (let i = 0; i < count; i++) aRand[i] = rnd();
    geometry.setAttribute('aRand', new THREE.BufferAttribute(aRand, 1));
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 30);

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uW: { value: [1, 0, 0, 0, 0, 0, 0] },
        uTransition: { value: 0 },
        uSize: { value: isMobile ? 5.2 : 4.4 },
        uPixelRatio: { value: pixelRatio },
        uVelocity: { value: 0 },
        uColorA: { value: new THREE.Color('#E9B44C') },
        uColorB: { value: new THREE.Color('#4FB8DA') },
        uColorC: { value: new THREE.Color('#FFF4DC') }
      }
    });

    const points = new THREE.Points(geometry, material);
    const group = new THREE.Group();
    group.add(points);
    scene.add(group);

    // faint far dust layer for depth
    const dustCount = isMobile ? 600 : 1400;
    const dustGeo = new THREE.BufferGeometry();
    const dust = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dust[i * 3] = (rnd() - 0.5) * 40;
      dust[i * 3 + 1] = (rnd() - 0.5) * 30;
      dust[i * 3 + 2] = -6 - rnd() * 20;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dust, 3));
    const dustMat = new THREE.PointsMaterial({ color: 0x7d8ea8, size: 0.05, transparent: true, opacity: 0.55, depthWrite: false });
    const dustPoints = new THREE.Points(dustGeo, dustMat);
    scene.add(dustPoints);

    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const onPointer = (e) => {
      pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onPointer, { passive: true });

    let lastScroll = window.scrollY;
    let velocity = 0;
    const weights = [1, 0, 0, 0, 0, 0, 0];
    let rotY = 0;
    let raf = 0;
    let running = true;
    const clock = new THREE.Clock();

    const fitToViewport = () => {
      // keep wide shapes (NEC glyphs, terrain) inside narrow portrait screens
      group.scale.setScalar(Math.max(0.45, Math.min(1, camera.aspect / 1.15)));
    };
    fitToViewport();
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      fitToViewport();
    };
    window.addEventListener('resize', onResize);

    const onVisibility = () => {
      running = !document.hidden;
      if (running) {
        clock.getDelta();
        raf = requestAnimationFrame(tick);
      } else {
        cancelAnimationFrame(raf);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    function tick() {
      if (!running) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.elapsedTime;

      const y = window.scrollY;
      const dy = y - lastScroll;
      lastScroll = y;
      velocity += (Math.min(Math.abs(dy) / 120, 1) - velocity) * 0.08;

      const target = Math.max(0, Math.min(SHAPE_COUNT - 1, Math.round(Number(window.__nxShape ?? 0))));
      const k = 1 - Math.pow(1 - (reducedMotion ? 0.25 : 0.055), dt * 60);
      let sum = 0;
      for (let s = 0; s < SHAPE_COUNT; s++) {
        weights[s] += ((s === target ? 1 : 0) - weights[s]) * k;
        sum += weights[s];
      }
      for (let s = 0; s < SHAPE_COUNT; s++) weights[s] /= sum || 1;
      const transition = 1 - weights[target];

      pointer.x += (pointer.tx - pointer.x) * 0.05;
      pointer.y += (pointer.ty - pointer.y) * 0.05;

      rotY += dt * (reducedMotion ? 0.02 : 0.09) + dy * 0.0009;
      group.rotation.y = rotY + pointer.x * 0.35;
      group.rotation.x = pointer.y * 0.22 + Math.sin(elapsed * 0.2) * 0.05;

      // the "NEC" glyph shape reads best facing camera
      group.rotation.y *= 1 - weights[1] * 0.92;
      // terrain sits as a landscape
      group.rotation.x += weights[2] * 0.35;

      dustPoints.rotation.y = elapsed * 0.01 + pointer.x * 0.08;
      dustPoints.position.y = (y * 0.0012) % 6;

      material.uniforms.uTime.value = elapsed;
      material.uniforms.uW.value = weights;
      material.uniforms.uTransition.value = reducedMotion ? 0 : Math.sin(Math.min(transition, 1) * Math.PI) * 0.9;
      material.uniforms.uVelocity.value = reducedMotion ? 0 : velocity;
      camera.position.z = 9 - velocity * 1.2;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      geometry.dispose();
      material.dispose();
      dustGeo.dispose();
      dustMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [reducedMotion]);

  return <div ref={mountRef} className="nx-universe" aria-hidden="true" />;
}
