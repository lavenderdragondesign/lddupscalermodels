import * as tf from "@tensorflow/tfjs";
import { makeTiles } from "./tiling";

export interface UpscaleOptions {
  file: File;
  modelKey: string; // e.g. "realesrgan/general_plus"
  scale: number;
  tileSize: number;
  overlap: number;
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

function normalize(img: tf.Tensor3D): tf.Tensor3D {
  // Adjust for your models if they expect -1..1 instead of 0..1
  return tf.div(img, tf.scalar(255));
}

function denormalize(img: tf.Tensor3D): tf.Tensor3D {
  return tf.clipByValue(tf.mul(img, tf.scalar(255)), 0, 255);
}

export async function upscaleImage(opts: UpscaleOptions): Promise<Blob> {
  const { file, modelKey, scale, tileSize, overlap, onProgress } = opts;

  const imgBitmap = await createImageBitmap(file);
  const width = imgBitmap.width;
  const height = imgBitmap.height;

  const model = await loadModel(modelKey);

  const outWidth = width * scale;
  const outHeight = height * scale;

  const offscreen = new OffscreenCanvas(outWidth, outHeight);
  const ctx = offscreen.getContext("2d");
  if (!ctx) throw new Error("2D context not available");

  const inputCanvas = new OffscreenCanvas(width, height);
  const inputCtx = inputCanvas.getContext("2d")!;
  inputCtx.drawImage(imgBitmap, 0, 0, width, height);

  const tiles = makeTiles(width, height, tileSize, overlap);
  const total = tiles.length;
  let done = 0;

  for (const tile of tiles) {
    const { sx, sy, sw, sh } = tile;

    const imageData = inputCtx.getImageData(sx, sy, sw, sh);
    const tileTensor = tf.tidy(() => {
      const input = tf.browser.fromPixels(imageData) as tf.Tensor3D;
      const norm = normalize(input);
      const batched = norm.expandDims(0); // [1, h, w, 3]
      return batched;
    });

    const output = (await tf.tidy(() => {
      const out = model.execute(tileTensor) as tf.Tensor4D;
      return out.squeeze() as tf.Tensor3D; // [H', W', 3]
    })) as tf.Tensor3D;

    const denorm = tf.tidy(() => denormalize(output));
    const [outH, outW] = denorm.shape;

    const outImageData = new ImageData(outW, outH);
    const outBuffer = await tf.browser.toPixels(denorm);

    for (let i = 0; i < outBuffer.length; i++) {
      outImageData.data[i] = outBuffer[i];
    }

    for (let i = 3; i < outImageData.data.length; i += 4) {
      if (outImageData.data[i] === 0) {
        outImageData.data[i] = 255;
      }
    }

    const dx = sx * scale;
    const dy = sy * scale;

    const patchCanvas = new OffscreenCanvas(outW, outH);
    const patchCtx = patchCanvas.getContext("2d")!;
    patchCtx.putImageData(outImageData, 0, 0);

    ctx.drawImage(patchCanvas, dx, dy);

    tileTensor.dispose();
    output.dispose();
    denorm.dispose();

    done++;
    if (onProgress) {
      onProgress((done / total) * 100);
    }
  }

  const blob = await offscreen.convertToBlob({ type: "image/png", quality: 0.95 });
  return blob;
}
