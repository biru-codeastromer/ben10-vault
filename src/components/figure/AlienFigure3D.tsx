import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { Asset, SeriesId } from '../../data/schema';
import { audio } from '../../lib/audio';
import { hologramTexture, inflate, loadImage, sampleImage } from '../../lib/inflate';
import './AlienFigure3D.css';

interface Props {
  asset: Asset;
  seriesId: SeriesId;
  alienName: string;
}

type Mode = 'figure' | 'hologram';

const ERA_GLOW: Record<SeriesId, number> = { os: 0x62d92a, af: 0x3fdc3f, ua: 0x37e15a, ov: 0x3ee63e };

/**
 * Interactive 3D figure of the alien, generated in-browser from the exact canonical artwork
 * (silhouette inflation — see src/lib/inflate.ts). Drag to spin; "Hologram" shows the
 * green Omnitrix-projection look. Falls back to a floating 3D card for artwork without
 * a transparent silhouette (e.g. episode stills).
 */
export default function AlienFigure3D({ asset, seriesId, alienName }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>('figure');
  const modeRef = useRef<Mode>(mode);
  const [status, setStatus] = useState<'loading' | 'ready' | 'flat' | 'error'>('loading');

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let raf = 0;
    const disposables: { dispose(): void }[] = [];

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);
    renderer.domElement.className = 'afigure__canvas';

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 20);
    camera.position.set(0, 0.12, 2.35);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.HemisphereLight(0xdfffe8, 0x0a140c, 1.1));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(1.4, 1.8, 2.2);
    scene.add(key);
    const rim = new THREE.PointLight(ERA_GLOW[seriesId], 4, 6);
    rim.position.set(-1.2, -0.4, -1.4);
    scene.add(rim);

    const rig = new THREE.Group();
    scene.add(rig);

    const MAX_YAW = 1.15; // ~66° — depth reads clearly, but the degenerate edge-on profile is never shown
    const state = { rotY: 0, rotX: 0, velY: 0, dragging: false, lastInteract: 0, ready: false };

    (async () => {
      try {
        const img = await loadImage(asset.path);
        if (disposed) return;
        const { data } = sampleImage(img, 200);
        const mesh = inflate(data, 0.13);
        const flat = mesh.opaqueRatio > 0.9; // no real silhouette → floating-card mode

        const colorTex = new THREE.Texture(img);
        colorTex.colorSpace = THREE.SRGBColorSpace;
        colorTex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        colorTex.needsUpdate = true;
        const holoTex = new THREE.CanvasTexture(hologramTexture(img));
        holoTex.colorSpace = THREE.SRGBColorSpace;
        disposables.push(colorTex, holoTex);

        let figure: THREE.Object3D;
        let figureMat: THREE.MeshStandardMaterial | null = null;
        let holoMat: THREE.MeshBasicMaterial;

        if (!flat) {
          const geo = new THREE.BufferGeometry();
          geo.setAttribute('position', new THREE.BufferAttribute(mesh.positions, 3));
          geo.setAttribute('normal', new THREE.BufferAttribute(mesh.normals, 3));
          geo.setAttribute('uv', new THREE.BufferAttribute(mesh.uvs, 2));
          geo.setAttribute('color', new THREE.BufferAttribute(mesh.colors, 3));
          geo.setIndex(new THREE.BufferAttribute(mesh.indices, 1));
          disposables.push(geo);
          figureMat = new THREE.MeshStandardMaterial({
            map: colorTex,
            roughness: 0.62,
            metalness: 0.04,
            transparent: true,
            alphaTest: 0.08,
            side: THREE.FrontSide,
            vertexColors: true,
          });
          holoMat = new THREE.MeshBasicMaterial({
            map: holoTex,
            transparent: true,
            opacity: 0.92,
            alphaTest: 0.05,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.FrontSide,
            vertexColors: true,
          });
          disposables.push(figureMat, holoMat);
          figure = new THREE.Mesh(geo, figureMat);
          setStatus('ready');
        } else {
          // floating card: double-sided plane, slight curve via cylinder segment feel is overkill — keep plane
          const aspect = mesh.aspect;
          const w = aspect >= 1 ? 1 : aspect;
          const h = aspect >= 1 ? 1 / aspect : 1;
          const geo = new THREE.PlaneGeometry(w, h, 1, 1);
          disposables.push(geo);
          figureMat = new THREE.MeshStandardMaterial({ map: colorTex, roughness: 0.7, metalness: 0.02, side: THREE.DoubleSide });
          holoMat = new THREE.MeshBasicMaterial({
            map: holoTex,
            transparent: true,
            opacity: 0.92,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide,
          });
          disposables.push(figureMat, holoMat);
          figure = new THREE.Mesh(geo, figureMat);
          setStatus('flat');
        }

        const figGroup = new THREE.Group();
        figGroup.add(figure);
        const spanY = mesh.maxY - mesh.minY;
        const fit = Math.min(1, 0.98 / Math.max(spanY, 0.001));
        figGroup.scale.setScalar(fit);
        figGroup.position.y = -((mesh.minY + mesh.maxY) / 2) * fit;
        rig.add(figGroup);

        // hologram projector base
        const baseY = mesh.minY * fit + figGroup.position.y - 0.06;
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.42, 0.014, 12, 64),
          new THREE.MeshBasicMaterial({ color: ERA_GLOW[seriesId], transparent: true, opacity: 0.9 }),
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.y = baseY;
        rig.add(ring);
        disposables.push(ring.geometry, ring.material as THREE.Material);
        const disc = new THREE.Mesh(
          new THREE.CircleGeometry(0.4, 48),
          new THREE.MeshBasicMaterial({ color: 0x07140a, transparent: true, opacity: 0.85 }),
        );
        disc.rotation.x = -Math.PI / 2;
        disc.position.y = baseY - 0.002;
        rig.add(disc);
        disposables.push(disc.geometry, disc.material as THREE.Material);
        // soft glow sprite under the figure
        const glowCanvas = document.createElement('canvas');
        glowCanvas.width = glowCanvas.height = 128;
        const gctx = glowCanvas.getContext('2d')!;
        const grad = gctx.createRadialGradient(64, 64, 4, 64, 64, 64);
        const glowHex = '#' + ERA_GLOW[seriesId].toString(16).padStart(6, '0');
        grad.addColorStop(0, glowHex + 'aa');
        grad.addColorStop(1, glowHex + '00');
        gctx.fillStyle = grad;
        gctx.fillRect(0, 0, 128, 128);
        const glowTex = new THREE.CanvasTexture(glowCanvas);
        const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, opacity: 0.8, depthWrite: false }));
        glow.scale.setScalar(1.15);
        glow.position.y = baseY + 0.05;
        rig.add(glow);
        disposables.push(glowTex, glow.material);

        // swap material on mode change (checked each frame — cheap)
        const applyMode = () => {
          const m = modeRef.current;
          (figure as THREE.Mesh).material = m === 'hologram' ? holoMat : figureMat!;
        };
        state.ready = true;

        const clock = new THREE.Clock();
        const tick = () => {
          if (disposed) return;
          raf = requestAnimationFrame(tick);
          const dt = Math.min(clock.getDelta(), 0.05);
          applyMode();
          // After a fling, momentum decays; once idle the figure eases back to the nearest
          // front-facing pose (k·π) and gently sways — it never parks edge-on.
          const idle = performance.now() - state.lastInteract > 1600;
          if (!state.dragging) {
            state.rotY += state.velY * dt;
            state.velY *= Math.pow(0.12, dt); // exponential spin-down
            if (Math.abs(state.rotY) > MAX_YAW) {
              state.rotY = Math.sign(state.rotY) * MAX_YAW;
              state.velY *= -0.35; // soft rebound off the stop
            }
            if (idle && Math.abs(state.velY) < 0.6) {
              state.rotY += (0 - state.rotY) * Math.min(1, dt * 1.6);
            }
            state.rotX += (0 - state.rotX) * Math.min(1, dt * 2.5);
          }
          const sway = idle && !state.dragging ? Math.sin(performance.now() / 1400) * 0.26 : 0;
          rig.rotation.y = Math.max(-MAX_YAW, Math.min(MAX_YAW, state.rotY)) + sway;
          rig.rotation.x = state.rotX;
          if (modeRef.current === 'hologram') {
            rig.position.y = Math.sin(performance.now() / 700) * 0.012;
          } else {
            rig.position.y = 0;
          }
          renderer.render(scene, camera);
        };
        tick();
      } catch {
        if (!disposed) setStatus('error');
      }
    })();

    // pointer interaction
    const el = renderer.domElement;
    let lastX = 0;
    let lastY = 0;
    const down = (e: PointerEvent) => {
      state.dragging = true;
      state.lastInteract = performance.now();
      lastX = e.clientX;
      lastY = e.clientY;
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!state.dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      state.rotY = Math.max(-MAX_YAW, Math.min(MAX_YAW, state.rotY + dx * 0.011));
      state.velY = dx * 0.45;
      state.rotX = Math.max(-0.45, Math.min(0.45, state.rotX + dy * 0.006));
      state.lastInteract = performance.now();
    };
    const up = () => {
      state.dragging = false;
      state.lastInteract = performance.now();
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);

    const resize = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      for (const d of disposables) d.dispose();
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset.path, seriesId]);

  return (
    <div className="afigure" data-era={seriesId}>
      <div className="afigure__stage" ref={hostRef} role="img" aria-label={`Interactive 3D figure of ${alienName} — drag to rotate`}>
        {status === 'loading' && <div className="afigure__status">Materialising figure…</div>}
        {status === 'error' && <div className="afigure__status">3D view unavailable for this artwork.</div>}
      </div>
      <div className="afigure__bar">
        <div className="afigure__modes" role="tablist" aria-label="Figure mode">
          {(['figure', 'hologram'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              className={`afigure__mode${mode === m ? ' is-on' : ''}`}
              onClick={() => {
                if (m !== mode) audio.play('dial-tick', { volume: 0.4, throttleMs: 80 });
                setMode(m);
              }}
            >
              {m === 'figure' ? 'Figure' : 'Hologram'}
            </button>
          ))}
        </div>
        <span className="afigure__hint">{status === 'flat' ? 'Flat artwork — shown as a floating card · drag to spin' : 'Drag to tilt & turn · settles facing you'}</span>
      </div>
    </div>
  );
}
