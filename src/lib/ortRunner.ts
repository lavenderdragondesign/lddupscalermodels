import * as ort from 'onnxruntime-web';

export type Layout = 'NCHW' | 'NHWC';

export interface RunOptions {
  padMultiple?: number;
  normalize?: boolean;
  bgr?: boolean;
}

export interface RunResult {
  image: ImageData;
  tensor: ort.Tensor;
}

export async function createSessionFromUrl(modelUrl: string, opts?: ort.InferenceSession.SessionOptions) {
  return await ort.InferenceSession.create(modelUrl, {
    executionProviders: ['wasm'],
    graphOptimizationLevel: 'all',
    ...opts,
  });
}

export function getModelLayout(session: ort.InferenceSession): { name: string; layout: Layout; dims: readonly number[] } {
  const name = session.inputNames[0];
  const meta = session.inputMetadata[name];
  const dims = (meta?.dimensions ?? []) as number[];
  if (dims.length >= 4) {
    if (dims[1] === 3) return { name, layout: 'NCHW', dims };
    if (dims[dims.length - 1] === 3) return { name, layout: 'NHWC', dims };
  }
  return { name, layout: 'NCHW', dims };
}

function rgbaToNCHWFloat32(img: ImageData, normalize = true, bgr = false) {
  const { data, width: W, height: H } = img;
  const size = W * H;
  const out = new Float32Array(3 * size);
  for (let i = 0; i < size; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const R = normalize ? r / 255 : r;
    const G = normalize ? g / 255 : g;
    const B = normalize ? b / 255 : b;
    if (bgr) {
      out[i] = B; out[i + size] = G; out[i + 2 * size] = R;
    } else {
      out[i] = R; out[i + size] = G; out[i + 2 * size] = B;
    }
  }
  return { tensor: out, H, W };
}

function rgbaToNHWCFloat32(img: ImageData, normalize = true, bgr = false) {
  const { data, width: W, height: H } = img;
  const out = new Float32Array(W * H * 3);
  for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
    const r = normalize ? data[i] / 255 : data[i];
    const g = normalize ? data[i + 1] / 255 : data[i + 1];
    const b = normalize ? data[i + 2] / 255 : data[i + 2];
    if (bgr) { out[j] = b; out[j + 1] = g; out[j + 2] = r; }
    else { out[j] = r; out[j + 1] = g; out[j + 2] = b; }
  }
  return { tensor: out, H, W };
}

function nchwToImageData(t: ort.Tensor): ImageData {
  const [n, c, H, W] = t.dims as number[];
  if (n !== 1 || c !== 3) throw new Error(`Unexpected output dims for NCHW: ${t.dims}`);
  const plane = W * H;
  const f = t.data as Float32Array;
  const out = new Uint8ClampedArray(W * H * 4);
  for (let i = 0; i < plane; i++) {
    const r = Math.round(Math.max(0, Math.min(1, f[i])) * 255);
    const g = Math.round(Math.max(0, Math.min(1, f[i + plane])) * 255);
    const b = Math.round(Math.max(0, Math.min(1, f[i + 2 * plane])) * 255);
    const j = i * 4;
    out[j] = r; out[j + 1] = g; out[j + 2] = b; out[j + 3] = 255;
  }
  return new ImageData(out, W, H);
}

function nhwcToImageData(t: ort.Tensor): ImageData {
  const [n, H, W, c] = t.dims as number[];
  if (n !== 1 || c !== 3) throw new Error(`Unexpected output dims for NHWC: ${t.dims}`);
  const f = t.data as Float32Array;
  const out = new Uint8ClampedArray(W * H * 4);
  for (let i = 0, j = 0; i < out.length; i += 4, j += 3) {
    const r = Math.round(Math.max(0, Math.min(1, f[j])) * 255);
    const g = Math.round(Math.max(0, Math.min(1, f[j + 1])) * 255);
    const b = Math.round(Math.max(0, Math.min(1, f[j + 2])) * 255);
    out[i] = r; out[i + 1] = g; out[i + 2] = b; out[i + 3] = 255;
  }
  return new ImageData(out, W, H);
}

function padToMultiple(img: ImageData, k: number): { padded: ImageData; padW: number; padH: number } {
  if (!k || k <= 1) return { padded: img, padW: 0, padH: 0 };
  const targetW = Math.ceil(img.width / k) * k;
  const targetH = Math.ceil(img.height / k) * k;
  if (targetW === img.width && targetH === img.height) return { padded: img, padW: 0, padH: 0 };
  const c = document.createElement('canvas');
  c.width = targetW; c.height = targetH;
  const ctx = c.getContext('2d')!;
  const tmp = document.createElement('canvas');
  tmp.width = img.width; tmp.height = img.height;
  tmp.getContext('2d')!.putImageData(img, 0, 0);
  ctx.drawImage(tmp, 0, 0);
  const padded = ctx.getImageData(0, 0, targetW, targetH);
  return { padded, padW: targetW - img.width, padH: targetH - img.height };
}

function cropImageData(img: ImageData, width: number, height: number): ImageData {
  if (img.width === width && img.height === height) return img;
  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  const ctx = c.getContext('2d')!;
  const tmp = document.createElement('canvas');
  tmp.width = img.width; tmp.height = img.height;
  tmp.getContext('2d')!.putImageData(img, 0, 0);
  ctx.drawImage(tmp, 0, 0, width, height, 0, 0, width, height);
  return ctx.getImageData(0, 0, width, height);
}

export async function runImageModel(
  session: ort.InferenceSession,
  img: ImageData,
  options: RunOptions = {}
): Promise<RunResult> {
  const { layout, name } = getModelLayout(session);
  const padK = options.padMultiple ?? 8;
  const normalize = options.normalize ?? true;
  const bgr = options.bgr ?? false;

  const origW = img.width, origH = img.height;
  const { padded } = padToMultiple(img, padK);

  let input: ort.Tensor;
  if (layout === 'NCHW') {
    const { tensor, H, W } = rgbaToNCHWFloat32(padded, normalize, bgr);
    input = new ort.Tensor('float32', tensor, [1, 3, H, W]);
  } else {
    const { tensor, H, W } = rgbaToNHWCFloat32(padded, normalize, bgr);
    input = new ort.Tensor('float32', tensor, [1, H, W, 3]);
  }

  const results = await session.run({ [name]: input });
  const out = results[session.outputNames[0]];

  let outImage: ImageData;
  const od = out.dims as number[];
  if (od.length === 4 && od[1] === 3) outImage = nchwToImageData(out);
  else if (od.length === 4 && od[3] === 3) outImage = nhwcToImageData(out);
  else outImage = nchwToImageData(out);

  const scaleW = outImage.width / padded.width;
  const scaleH = outImage.height / padded.height;
  const approxScale = Math.round((scaleW + scaleH) / 2);
  const targetW = Math.round(origW * approxScale);
  const targetH = Math.round(origH * approxScale);

  const finalImage = cropImageData(outImage, targetW, targetH);
  return { image: finalImage, tensor: out };
}

export async function runImageModelFromUrl(
  modelUrl: string,
  img: ImageData,
  options?: RunOptions,
  sessionOpts?: ort.InferenceSession.SessionOptions
): Promise<RunResult> {
  const session = await createSessionFromUrl(modelUrl, sessionOpts);
  return await runImageModel(session, img, options);
}
