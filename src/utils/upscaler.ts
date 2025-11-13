import * as tf from "@tensorflow/tfjs";

export interface UpscaleOptions {
  file: File;
  modelKey: string;
  tileSize: number; // kept for signature compatibility, ignored
  overlap: number;  // ignored
  scale: number;    // hint only, actual scale inferred from model
  onProgress?: (p: number) => void;
}

const modelCache = new Map<string, tf.GraphModel>();

async function loadModel(modelKey: string): Promise<tf.GraphModel> {
  if (modelCache.has(modelKey)) {
    return modelCache.get(modelKey)!;
  }
  const url = `/models/${modelKey}/model.json`;
  const model = await tf.loadGraphModel(url);
  modelCache.set(modelKey, model);
  return model;
}

// Force 0–1 float range safely, even if input is already float or comes from odd ImageData.
function normalizeForce(img: tf.Tensor3D): tf.Tensor3D {
  return tf.tidy(() => {
    const f = img.toFloat();
    const divided = tf.div(f, tf.scalar(255));
    return tf.clipByValue(divided, 0, 1);
  });
}


// Use a fixed patch size; infer scale from first patch output.
export async function upscaleImage(opts: UpscaleOptions): Promise<Blob> {
  const { file, modelKey, onProgress } = opts;

  const imgBitmap = await createImageBitmap(file);
  const width = imgBitmap.width;
  const height = imgBitmap.height;

  const model = await loadModel(modelKey);

  const PATCH = 128;

  // Input canvas
  const inputCanvas = (typeof OffscreenCanvas !== "undefined")
    ? new OffscreenCanvas(width, height)
    : document.createElement("canvas");

  const inputCtx = inputCanvas.getContext("2d", { willReadFrequently: true } as any);
  if (!inputCtx) throw new Error("2D context not available");
  (inputCanvas as any).width = width;
  (inputCanvas as any).height = height;
  inputCtx.drawImage(imgBitmap, 0, 0, width, height);

  // Determine patch scale using a single test patch at (0,0)
  let patchScale = 4;
  {
    const w = Math.min(PATCH, width);
    const h = Math.min(PATCH, height);
    const srcData = inputCtx.getImageData(0, 0, w, h);

    // Put into a 64x64 RGBA buffer with padding if needed
    const paddedCanvas = (typeof OffscreenCanvas !== "undefined")
      ? new OffscreenCanvas(PATCH, PATCH)
      : document.createElement("canvas");
    const paddedCtx = paddedCanvas.getContext("2d", { willReadFrequently: true } as any)!;
    (paddedCanvas as any).width = PATCH;
    (paddedCanvas as any).height = PATCH;
    paddedCtx.clearRect(0, 0, PATCH, PATCH);
    paddedCtx.putImageData(srcData, 0, 0);

    const patchData = paddedCtx.getImageData(0, 0, PATCH, PATCH);
    const patchTensor = tf.tidy(() => {
      const t = tf.browser.fromPixels(patchData) as tf.Tensor3D;
      return normalizeForce(t).expandDims(0); // [1,H,W,3]
    });

    const out = await tf.tidy(() => {
      const y = model.execute(patchTensor) as tf.Tensor4D;
      return y.squeeze() as tf.Tensor3D; // [H', W', 3]
    });

    const [outH, outW] = out.shape;
    patchScale = outH / PATCH;
    if (!isFinite(patchScale) || patchScale <= 0) {
      patchScale = 4;
    }

    patchTensor.dispose();
    out.dispose();
  }

  const outWidth = Math.round(width * patchScale);
  const outHeight = Math.round(height * patchScale);

  // Main accumulation canvas (holds summed RGB values)
  const outCanvas = (typeof OffscreenCanvas !== "undefined")
    ? new OffscreenCanvas(outWidth, outHeight)
    : document.createElement("canvas");
  const outCtx = outCanvas.getContext("2d", { willReadFrequently: false } as any);
  if (!outCtx) throw new Error("2D context not available");
  (outCanvas as any).width = outWidth;
  (outCanvas as any).height = outHeight;

  // Weight canvas tracks how many tiles contributed to each pixel
  const weightCanvas = (typeof OffscreenCanvas !== "undefined")
    ? new OffscreenCanvas(outWidth, outHeight)
    : document.createElement("canvas");
  const weightCtx = weightCanvas.getContext("2d", { willReadFrequently: false } as any);
  if (!weightCtx) throw new Error("2D context not available");
  (weightCanvas as any).width = outWidth;
  (weightCanvas as any).height = outHeight;

  outCtx.clearRect(0, 0, outWidth, outHeight);
  weightCtx.clearRect(0, 0, outWidth, outHeight);

  // Slight overlap between tiles to hide seams
  const STEP = PATCH - 16;

  const tiles: { sx: number; sy: number; sw: number; sh: number }[] = [];
  for (let sy = 0; sy < height; sy += STEP) {
    for (let sx = 0; sx < width; sx += STEP) {
      const sw = Math.min(PATCH, width - sx);
      const sh = Math.min(PATCH, height - sy);
      if (sw > 0 && sh > 0) {
        tiles.push({ sx, sy, sw, sh });
      }
    }
  }

  const totalTiles = tiles.length;
  let done = 0;

  // Use additive blending so we can normalize later
  outCtx.globalCompositeOperation = "lighter";
  weightCtx.globalCompositeOperation = "lighter";

  for (const tile of tiles) {
    const { sx, sy, sw, sh } = tile;

    const srcData = inputCtx.getImageData(sx, sy, sw, sh);

    const paddedCanvas = (typeof OffscreenCanvas !== "undefined")
      ? new OffscreenCanvas(PATCH, PATCH)
      : document.createElement("canvas");
    const paddedCtx = paddedCanvas.getContext("2d", { willReadFrequently: true } as any)!;
    (paddedCanvas as any).width = PATCH;
    (paddedCanvas as any).height = PATCH;
    paddedCtx.clearRect(0, 0, PATCH, PATCH);
    paddedCtx.putImageData(srcData, 0, 0);

    const patchData = paddedCtx.getImageData(0, 0, PATCH, PATCH);

    const tileTensor = tf.tidy(() => {
      const t = tf.browser.fromPixels(patchData) as tf.Tensor3D;
      return normalizeForce(t).expandDims(0); // [1,H,W,3]
    });

    const rawOutput = (await tf.tidy(() => {
      const y = model.execute(tileTensor) as tf.Tensor4D;
      return y.squeeze() as tf.Tensor3D;
    })) as tf.Tensor3D;

    const output = tf.clipByValue(rawOutput, 0, 1);
    const [outH, outW] = output.shape;

    const outImageData = new ImageData(outH ? outW : 0, outH || 0);
    const outBuffer = await tf.browser.toPixels(output);
    rawOutput.dispose();
    for (let i = 0; i < outBuffer.length; i++) {
      outImageData.data[i] = outBuffer[i];
    }
    for (let i = 3; i < outImageData.data.length; i += 4) {
      if (outImageData.data[i] === 0) {
        outImageData.data[i] = 255;
      }
    }

    const dx = Math.round(sx * patchScale);
    const dy = Math.round(sy * patchScale);

    const patchCanvasOut = (typeof OffscreenCanvas !== "undefined")
      ? new OffscreenCanvas(outW, outH)
      : document.createElement("canvas");
    const patchCtxOut = patchCanvasOut.getContext("2d", { willReadFrequently: false } as any)!;
    (patchCanvasOut as any).width = outW;
    (patchCanvasOut as any).height = outH;
    patchCtxOut.putImageData(outImageData, 0, 0);

    // Draw into accumulation canvas
    outCtx.drawImage(patchCanvasOut, dx, dy);

    // Mark coverage in weight canvas
    weightCtx.fillStyle = "#ffffff";
    weightCtx.fillRect(dx, dy, outW, outH);

    tileTensor.dispose();
    output.dispose();

    done++;
    if (onProgress) {
      onProgress((done / totalTiles) * 100);
    }
  }

  // Restore default blend mode
  outCtx.globalCompositeOperation = "source-over";
  weightCtx.globalCompositeOperation = "source-over";

  // Normalize accumulated colors by how many tiles contributed per pixel
  const accumData = outCtx.getImageData(0, 0, outWidth, outHeight);
  const weightData = weightCtx.getImageData(0, 0, outWidth, outHeight);

  const a = accumData.data;
  const w = weightData.data;

  for (let i = 0; i < a.length; i += 4) {
    const weight = w[i]; // red channel
    if (weight > 0) {
      const factor = 255 / weight;
      a[i] = Math.min(255, Math.round(a[i] * factor));
      a[i + 1] = Math.min(255, Math.round(a[i + 1] * factor));
      a[i + 2] = Math.min(255, Math.round(a[i + 2] * factor));
      a[i + 3] = 255;
    }
  }

  outCtx.putImageData(accumData, 0, 0);

  // Crop in case of rounding differences
  const finalW = Math.round(width * patchScale);
  const finalH = Math.round(height * patchScale);

  const finalCanvas = (typeof OffscreenCanvas !== "undefined")
    ? new OffscreenCanvas(finalW, finalH)
    : document.createElement("canvas");
  const finalCtx = finalCanvas.getContext("2d", { willReadFrequently: false } as any)!;
  (finalCanvas as any).width = finalW;
  (finalCanvas as any).height = finalH;
  finalCtx.drawImage(outCanvas, 0, 0, finalW, finalH, 0, 0, finalW, finalH);

  const blob: Blob = await (finalCanvas as any).convertToBlob
    ? await (finalCanvas as any).convertToBlob({ type: "image/png", quality: 0.95 })
    : await new Promise((resolve) => {
        (finalCanvas as HTMLCanvasElement).toBlob(b => resolve(b!), "image/png");
      });

  return blob;
}
