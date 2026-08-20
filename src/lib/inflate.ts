/**
 * Silhouette inflation — turns a transparent character render into a 3D "figure" mesh.
 *
 * Nothing is redrawn: the texture is the exact canonical artwork. The geometry is derived
 * mechanically from the image's alpha channel:
 *   1. sample the image onto a coarse grid,
 *   2. chamfer distance transform inside the silhouette,
 *   3. height = rounded profile of the distance (like an inflated vinyl figure),
 *   4. build a front + back displaced sheet that meet at the silhouette edge.
 *
 * Runs in the browser (~30–60 ms per figure) so every alien gets a model with zero extra assets.
 */

export interface InflatedMesh {
  positions: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
  indices: Uint32Array;
  /** share of pixels that are opaque — near 1 means "no silhouette" (screenshot art) */
  opaqueRatio: number;
  /** world-space bounds */
  minY: number;
  maxY: number;
  aspect: number; // width / height of the source image
}

const ALPHA_ON = 40; // alpha (0–255) above which a pixel is part of the character (cuts soft-glow streaks)

export async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`image failed: ${src}`));
    img.src = src;
  });
}

export function sampleImage(img: HTMLImageElement, maxDim = 176): { data: ImageData; W: number; H: number } {
  const scale = maxDim / Math.max(img.naturalWidth, img.naturalHeight);
  const W = Math.max(2, Math.round(img.naturalWidth * scale));
  const H = Math.max(2, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, W, H);
  return { data: ctx.getImageData(0, 0, W, H), W, H };
}

/** Chamfer 3-4 distance transform: distance (in ~pixels ×3) from each inside pixel to the silhouette edge. */
function distanceTransform(alpha: Uint8Array, W: number, H: number): Float32Array {
  const INF = 1e9;
  const d = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) d[i] = alpha[i] ? INF : 0;
  // forward pass
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (d[i] === 0) continue;
      let v = d[i];
      if (x > 0) v = Math.min(v, d[i - 1] + 3);
      if (y > 0) {
        v = Math.min(v, d[i - W] + 3);
        if (x > 0) v = Math.min(v, d[i - W - 1] + 4);
        if (x < W - 1) v = Math.min(v, d[i - W + 1] + 4);
      }
      d[i] = v;
    }
  }
  // backward pass
  for (let y = H - 1; y >= 0; y--) {
    for (let x = W - 1; x >= 0; x--) {
      const i = y * W + x;
      if (d[i] === 0) continue;
      let v = d[i];
      if (x < W - 1) v = Math.min(v, d[i + 1] + 3);
      if (y < H - 1) {
        v = Math.min(v, d[i + W] + 3);
        if (x < W - 1) v = Math.min(v, d[i + W + 1] + 4);
        if (x > 0) v = Math.min(v, d[i + W - 1] + 4);
      }
      d[i] = v;
    }
  }
  for (let i = 0; i < W * H; i++) d[i] /= 3; // back to pixel units
  return d;
}

/**
 * Build the inflated mesh. Unit scale: the larger image dimension spans ~1 world unit.
 * `thickness` is the max half-depth as a fraction of the larger dimension.
 */
export function inflate(imageData: ImageData, thickness = 0.13): InflatedMesh {
  const { width: W, height: H, data: px } = imageData;
  const N = W * H;
  const alpha = new Uint8Array(N);
  let opaque = 0;
  for (let i = 0; i < N; i++) {
    const a = px[i * 4 + 3];
    if (a >= ALPHA_ON) alpha[i] = 1;
    if (a >= 250) opaque++;
  }
  const opaqueRatio = opaque / N;

  const dist = distanceTransform(alpha, W, H);
  let dmax = 0;
  for (let i = 0; i < N; i++) if (dist[i] > dmax) dmax = dist[i];
  const scaleRef = Math.max(W, H);
  // Rounded profile: h = T * sqrt(1 - (1 - t)^2), t = d / dcap. dcap caps how far the
  // "dome" grows so limbs stay slimmer than the torso.
  const dcap = Math.min(Math.max(dmax * 0.72, 3), scaleRef * 0.16);
  const T = thickness * scaleRef;
  const h = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    if (!alpha[i]) continue;
    const t = Math.min(dist[i] / dcap, 1);
    h[i] = T * Math.sqrt(1 - (1 - t) * (1 - t));
  }

  // cells: require ≥3 inside corners (keeps thin parts, avoids lone-pixel spikes)
  const cellOk = (x: number, y: number) => {
    const i = y * W + x;
    const c = alpha[i] + alpha[i + 1] + alpha[i + W] + alpha[i + W + 1];
    return c >= 3;
  };

  const vertIndex = new Int32Array(N).fill(-1);
  const verts: number[] = [];
  let vCount = 0;
  for (let y = 0; y < H - 1; y++) {
    for (let x = 0; x < W - 1; x++) {
      if (!cellOk(x, y)) continue;
      for (const [cx, cy] of [
        [x, y],
        [x + 1, y],
        [x, y + 1],
        [x + 1, y + 1],
      ]) {
        const i = cy * W + cx;
        if (vertIndex[i] === -1) {
          vertIndex[i] = vCount++;
          verts.push(i);
        }
      }
    }
  }

  const s = 1 / scaleRef;
  const cxOff = (W - 1) / 2;
  const cyOff = (H - 1) / 2;
  // two sheets: front (z=+h) then back (z=-h)
  const positions = new Float32Array(vCount * 2 * 3);
  const normals = new Float32Array(vCount * 2 * 3);
  const uvs = new Float32Array(vCount * 2 * 2);
  let minY = Infinity;
  let maxY = -Infinity;

  const hAt = (x: number, y: number) => h[Math.min(H - 1, Math.max(0, y)) * W + Math.min(W - 1, Math.max(0, x))];

  for (let v = 0; v < vCount; v++) {
    const i = verts[v];
    const pxx = i % W;
    const pyy = (i / W) | 0;
    const wx = (pxx - cxOff) * s;
    const wy = (cyOff - pyy) * s;
    const wz = h[i] * s;
    if (wy < minY) minY = wy;
    if (wy > maxY) maxY = wy;
    // numeric gradient of h in world units
    const dhdx = ((hAt(pxx + 1, pyy) - hAt(pxx - 1, pyy)) / 2) * 1; // per-pixel
    const dhdy = ((hAt(pxx, pyy + 1) - hAt(pxx, pyy - 1)) / 2) * 1;
    // front normal (world y is flipped vs pixel y)
    let nx = -dhdx;
    let ny = dhdy;
    let nz = 1;
    let len = Math.hypot(nx, ny, nz);
    const f = v;
    positions[f * 3] = wx;
    positions[f * 3 + 1] = wy;
    positions[f * 3 + 2] = wz;
    normals[f * 3] = nx / len;
    normals[f * 3 + 1] = ny / len;
    normals[f * 3 + 2] = nz / len;
    uvs[f * 2] = pxx / (W - 1);
    uvs[f * 2 + 1] = 1 - pyy / (H - 1);
    // back sheet: z = -h, outward normal keeps the lateral slope but faces -z
    const b = vCount + v;
    positions[b * 3] = wx;
    positions[b * 3 + 1] = wy;
    positions[b * 3 + 2] = -wz;
    nx = -dhdx;
    ny = dhdy;
    nz = -1;
    len = Math.hypot(nx, ny, nz);
    normals[b * 3] = nx / len;
    normals[b * 3 + 1] = ny / len;
    normals[b * 3 + 2] = nz / len;
    uvs[b * 2] = pxx / (W - 1);
    uvs[b * 2 + 1] = 1 - pyy / (H - 1);
  }

  const idx: number[] = [];
  for (let y = 0; y < H - 1; y++) {
    for (let x = 0; x < W - 1; x++) {
      if (!cellOk(x, y)) continue;
      const a = vertIndex[y * W + x];
      const b = vertIndex[y * W + x + 1];
      const c = vertIndex[(y + 1) * W + x];
      const d2 = vertIndex[(y + 1) * W + x + 1];
      // front (CCW when viewed from +z; world y up means pixel y down → order below)
      idx.push(a, c, b, b, c, d2);
      // back (reversed winding), offset
      const o = vCount;
      idx.push(a + o, b + o, c + o, b + o, d2 + o, c + o);
    }
  }

  return {
    positions,
    normals,
    uvs,
    indices: new Uint32Array(idx),
    opaqueRatio,
    minY: minY === Infinity ? -0.5 : minY,
    maxY: maxY === -Infinity ? 0.5 : maxY,
    aspect: W / H,
  };
}

/** Green "Omnitrix hologram" variant of the artwork: grayscale → green tint + scanlines, baked to a canvas. */
export function hologramTexture(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const W = Math.min(1024, img.naturalWidth);
  const H = Math.round((W * img.naturalHeight) / img.naturalWidth);
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  ctx.filter = 'saturate(0) brightness(1.35) contrast(1.05)';
  ctx.drawImage(img, 0, 0, W, H);
  ctx.filter = 'none';
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = '#49f06a';
  ctx.fillRect(0, 0, W, H);
  // scanlines
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = 'rgba(0, 40, 8, 0.5)';
  for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1.5);
  ctx.globalCompositeOperation = 'source-over';
  return canvas;
}
