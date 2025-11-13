
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
    executionProviders: ["webgpu", "wasm"],
  });

  sessionCache.set(url, session);
  return session;
}

async function fileToImageData(file: File): Promise<ImageData> {
  const img = new Image();
  img.decoding = "async";
  img.src = URL.createObjectURL(file);

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = e => reject(e);
  });

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("2D context not available");
  }
  ctx.drawImage(img, 0, 0);
  URL.revokeObjectURL(img.src);

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

  let j = 0;
  for (let i = 0; i < hw; i++) {
    const r = Math.max(0, Math.min(255, arr[i] * 255));
    const g = Math.max(0, Math.min(255, arr[i + hw] * 255));
    const b = Math.max(0, Math.min(255, arr[i + 2 * hw] * 255));

    dst[j++] = r;
    dst[j++] = g;
    dst[j++] = b;
    dst[j++] = 255;
  }

  return out;
}

export async function upscaleImageOnnx(opts: UpscaleOptionsOnnx): Promise<Blob> {
  const { file, modelKey, onProgress } = opts;

  if (onProgress) onProgress(1);

  const srcImage = await fileToImageData(file);
  const srcW = srcImage.width;
  const srcH = srcImage.height;

  const session = await loadSession(modelKey);

  if (onProgress) onProgress(10);

  const inputTensorData = imageDataToNCHW(srcImage);

  const inputName = session.inputNames[0];
  const feeds: Record<string, ort.Tensor> = {
    [inputName]: new ort.Tensor("float32", inputTensorData, [1, 3, srcH, srcW]),
  };

  const results = await session.run(feeds);
  const outputName = session.outputNames[0];
  const output = results[outputName];

  const [n, c, outH, outW] = output.dims;
  if (c !== 3) {
    throw new Error(`Unexpected channel count from ONNX output: ${c}`);
  }

  const outData = output.data as Float32Array;
  const outImage = nchwToImageData(outData, outW, outH);

  if (onProgress) onProgress(90);

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D context not available");

  ctx.putImageData(outImage, 0, 0);

  const blob: Blob = await new Promise(resolve => {
    canvas.toBlob(b => resolve(b!), "image/png");
  });

  if (onProgress) onProgress(100);

  return blob;
}
