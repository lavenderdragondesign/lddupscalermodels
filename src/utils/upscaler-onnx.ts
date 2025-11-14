import * as ort from "onnxruntime-web";

export interface UpscaleOptionsOnnx {
  file: File;
  modelKey: string;
  onProgress?: (pct: number) => void;
}

// Map your modelKey strings to ONNX paths in /public
const MODEL_URLS: Record<string, string> = {
  "onnx/crystal-linework-x4": "/models/onnx_models/swin_unet/art/noise1_scale4x.onnx",
  "onnx/nebula-hd-x4": "/models/onnx_models/swin_unet/photo/noise0_scale4x.onnx",
  "onnx/diamond-clarity-x4": "/models/onnx_models/swin_unet/art_scan/noise2_scale4x.onnx",
  "onnx/ember-studio-x2": "/models/onnx_models/cunet/art/noise0_scale2x.onnx",
};

const sessionCache = new Map<string, ort.InferenceSession>();

async function loadSession(modelKey: string): Promise<ort.InferenceSession> {
  const url = MODEL_URLS[modelKey];
  if (!url) {
    throw new Error(`No ONNX URL configured for modelKey: ${modelKey}`);
  }

  if (sessionCache.has(url)) {
    return sessionCache.get(url)!;
  }

  const session = await ort.InferenceSession.create(url, {
    // WASM only for stability; WebGPU kernels can blow up on huge intermediates.
    executionProviders: ["wasm"],
  });

  sessionCache.set(url, session);
  return session;
}

async function fileToImageData(file: File): Promise<ImageData> {
  const url = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = url;
  });
  URL.revokeObjectURL(url);

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true } as any);
  if (!ctx) {
    throw new Error("2D context not available");
  }
  ctx.drawImage(img, 0, 0);

  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function imageDataToNCHW(image: ImageData): Float32Array {
  const { data, width, height } = image;
  const hw = width * height;
  const out = new Float32Array(3 * hw);

  let idx = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;

    out[idx] = r;
    out[idx + hw] = g;
    out[idx + 2 * hw] = b;
    idx++;
  }

  return out;
}

function nchwToImageData(arr: Float32Array, width: number, height: number): ImageData {
  const hw = width * height;
  const out = new ImageData(width, height);
  const dst = out.data;

  for (let i = 0; i < hw; i++) {
    const r = arr[i];
    const g = arr[i + hw];
    const b = arr[i + 2 * hw];

    const j = i * 4;
    dst[j] = Math.max(0, Math.min(255, Math.round(r * 255)));
    dst[j + 1] = Math.max(0, Math.min(255, Math.round(g * 255)));
    dst[j + 2] = Math.max(0, Math.min(255, Math.round(b * 255)));
    dst[j + 3] = 255;
  }

  return out;
}

async function runTile(
  session: ort.InferenceSession,
  tile: ImageData
): Promise<{ image: ImageData; width: number; height: number }> {
  const srcW = tile.width;
  const srcH = tile.height;

  const inputName = session.inputNames[0];
  const inputData = imageDataToNCHW(tile);

  const feeds: Record<string, ort.Tensor> = {
    [inputName]: new ort.Tensor("float32", inputData, [1, 3, srcH, srcW]),
  };

  const results = await session.run(feeds);
  const outputName = session.outputNames[0];
  const output = results[outputName];

  const dims = output.dims;
  if (!dims || dims.length !== 4) {
    throw new Error(`Unexpected ONNX output dims: ${dims}`);
  }

  const [, c, outH, outW] = dims;
  if (c !== 3) {
    throw new Error(`Unexpected channel count from ONNX output: ${c}`);
  }

  const outData = output.data as Float32Array;
  const outImage = nchwToImageData(outData, outW, outH);
  return { image: outImage, width: outW, height: outH };
}

// Basic tiled ONNX upscaling.
// NOTE: This is intentionally simpler than the TFJS path: it tiles + draws,
// without fancy overlap feathering. Engines are exposed as "beta" for dev use.
export async function upscaleImageOnnx(opts: UpscaleOptionsOnnx): Promise<Blob> {
  const { file, modelKey, onProgress } = opts;

  const src = await fileToImageData(file);
  const srcW = src.width;
  const srcH = src.height;


const totalPixels = srcW * srcH;
const MAX_PIXELS = 4096 * 4096; // ~16M pixels safety cap for browser WASM

if (totalPixels > MAX_PIXELS) {
  throw new Error(
    `Image too large for ONNX engine in browser (${srcW}×${srcH}). ` +
    "Please use a smaller image, lower resolution, or switch to the standard engine."
  );
}

  const session = await loadSession(modelKey);

  // Reasonable patch size for browser WASM; you can tweak these.
  const TILE = 128;
  const OVERLAP = 16;

  // Helper to extract a patch from the source ImageData.
  function extractPatch(sx: number, sy: number, sw: number, sh: number): ImageData {
    const canvas = document.createElement("canvas");
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext("2d", { willReadFrequently: true } as any);
    if (!ctx) throw new Error("2D context not available");

    // Put the whole source once, then slice from it.
    // However ImageData can't be drawn directly; we cache a bitmap canvas once.
    ctx.putImageData(src, -sx, -sy);
    return ctx.getImageData(0, 0, sw, sh);
  }

  // Build a cached canvas for the full source to avoid re-putting ImageData each time
  const srcCanvas = document.createElement("canvas");
  srcCanvas.width = srcW;
  srcCanvas.height = srcH;
  const srcCtx = srcCanvas.getContext("2d", { willReadFrequently: true } as any);
  if (!srcCtx) throw new Error("2D context not available");
  srcCtx.putImageData(src, 0, 0);

  function extractPatchFromCanvas(sx: number, sy: number, sw: number, sh: number): ImageData {
    return srcCtx.getImageData(sx, sy, sw, sh);
  }

  // Run a single sample tile to determine scale factor
  const sampleW = Math.min(TILE, srcW);
  const sampleH = Math.min(TILE, srcH);
  const sample = extractPatchFromCanvas(0, 0, sampleW, sampleH);
  const sampleOut = await runTile(session, sample);
  const scaleX = sampleOut.width / sampleW;
  const scaleY = sampleOut.height / sampleH;
  const scale = (scaleX + scaleY) / 2 || 1;

  const outW = Math.round(srcW * scale);
  const outH = Math.round(srcH * scale);

  const outCanvas = document.createElement("canvas");
  outCanvas.width = outW;
  outCanvas.height = outH;
  const outCtx = outCanvas.getContext("2d", { willReadFrequently: true } as any);
  if (!outCtx) throw new Error("2D context not available");
  outCtx.clearRect(0, 0, outW, outH);

  const step = TILE - OVERLAP;
  const tilesX = Math.ceil(srcW / step);
  const tilesY = Math.ceil(srcH / step);
  const totalTiles = tilesX * tilesY;
  let doneTiles = 0;

  for (let ty = 0; ty < tilesY; ty++) {
    for (let tx = 0; tx < tilesX; tx++) {
      const sx = tx * step;
      const sy = ty * step;
      const sw = Math.min(TILE, srcW - sx);
      const sh = Math.min(TILE, srcH - sy);

      if (sw <= 0 || sh <= 0) {
        doneTiles++;
        continue;
      }

      const patch = extractPatchFromCanvas(sx, sy, sw, sh);
      const outPatch = await runTile(session, patch);

      const dx = Math.round(sx * scale);
      const dy = Math.round(sy * scale);

      const patchCanvas = document.createElement("canvas");
      patchCanvas.width = outPatch.width;
      patchCanvas.height = outPatch.height;
      const pctx = patchCanvas.getContext("2d", { willReadFrequently: true } as any);
      if (!pctx) throw new Error("2D context not available");
      pctx.putImageData(outPatch.image, 0, 0);

      // Simple draw; later we can add fancy blending if needed.
      outCtx.drawImage(
        patchCanvas,
        0,
        0,
        outPatch.width,
        outPatch.height,
        dx,
        dy,
        outPatch.width,
        outPatch.height
      );

      doneTiles++;
      if (onProgress) {
        // ONNX beta progress lives roughly in 0–95%; App handles 100% on completion.
        const pct = (doneTiles / totalTiles) * 95;
        onProgress(pct);
      }
    }
  }

  const finalBlob: Blob = await new Promise((resolve) => {
    outCanvas.toBlob((b) => resolve(b!), "image/png");
  });

  if (onProgress) onProgress(100);

  return finalBlob;
}
