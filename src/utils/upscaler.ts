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
interface ModelPathConfig {
  path: string;
}

// Map friendly engine keys from the UI to actual TFJS model folders
// backed by the UpscalerJS model collection we copied into /public/models.
const MODEL_PATHS: Record<string, ModelPathConfig> = {
  // LDD Crystal (RealESRGAN-style photo engines)
  "realesrgan/general_fast-64":        { path: "div2k/017-4x" }, // fast 4×
  "realesrgan/general_plus-64":        { path: "div2k/017-4x" }, // high quality 4×

  // Extra sharp / denoise variants mapped to PSNR / IDEALO style models
  "realesrgan/x4plus-64":              { path: "psnr-small-quant-uint8" },
  "realesrgan/x4plus_anime-64":        { path: "idealo/gans" },

  // 'WDN' + 'anime_video' mapped to div2k variants
  "realesrgan/general_wdn-64":         { path: "div2k/005-2x" },
  "realesrgan/anime_video-64":         { path: "div2k/019-3x" },

  // RealCUGAN-style keys mapped to a mix of 2× / 3× / 4× models
  "realcugan/2x-conservative-64":      { path: "div2k/005-2x" },
  "realcugan/3x-conservative-64":      { path: "div2k/019-3x" },
  "realcugan/4x-conservative-64":      { path: "div2k/017-4x" },
};

function resolveModelFolder(modelKey: string): string {
  const cfg = MODEL_PATHS[modelKey];
  return cfg ? cfg.path : modelKey;
}


async function loadModel(modelKey: string): Promise<tf.GraphModel> {
  if (modelCache.has(modelKey)) {
    return modelCache.get(modelKey)!;
  }
  const folder = resolveModelFolder(modelKey);
  const url = `/models/${folder}/model.json`;
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


// Always feed 64x64 patches to the model; infer scale from first patch output.
export async function upscaleImage(opts: UpscaleOptions): Promise<Blob> {
  const { file, modelKey, onProgress } = opts;

  const imgBitmap = await createImageBitmap(file);
  const width = imgBitmap.width;
  const height = imgBitmap.height;

  const model = await loadModel(modelKey);

  const PATCH = 64;

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
      return normalizeForce(t).expandDims(0); // [1,64,64,3]
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

  const outCanvas = (typeof OffscreenCanvas !== "undefined")
    ? new OffscreenCanvas(outWidth, outHeight)
    : document.createElement("canvas");
  const outCtx = outCanvas.getContext("2d", { willReadFrequently: false } as any);
  if (!outCtx) throw new Error("2D context not available");
  (outCanvas as any).width = outWidth;
  (outCanvas as any).height = outHeight;

  const tilesX = Math.ceil(width / PATCH);
  const tilesY = Math.ceil(height / PATCH);
  const totalTiles = tilesX * tilesY;
  let done = 0;

  for (let ty = 0; ty < tilesY; ty++) {
    for (let tx = 0; tx < tilesX; tx++) {
      const sx = tx * PATCH;
      const sy = ty * PATCH;
      const sw = Math.min(PATCH, width - sx);
      const sh = Math.min(PATCH, height - sy);

      if (sw <= 0 || sh <= 0) {
        done++;
        continue;
      }

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
        return normalizeForce(t).expandDims(0); // [1,64,64,3]
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

      outCtx.drawImage(patchCanvasOut, dx, dy);

      tileTensor.dispose();
      output.dispose();

      done++;
      if (onProgress) {
        onProgress((done / totalTiles) * 100);
      }
    }
  }

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
