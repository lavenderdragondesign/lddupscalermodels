// TFJS tiling worker to support fixed input shapes like [1,128,128,3]
import * as tf from '@tensorflow/tfjs'
import '@tensorflow/tfjs-backend-webgl'
import '@tensorflow/tfjs-backend-wasm'
import { setWasmPaths } from '@tensorflow/tfjs-backend-wasm'
async function assertReachable(url: string) {
  try {
    const r = await fetch(url, { method: 'HEAD', mode: 'cors' });
    if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`);
  } catch (e:any) {
    throw new Error(`Model fetch failed for ${url} — ${e?.message || e}`);
  }
}

type Job = { id: string; file: File; modelUrl: string }
type Msg =
  | { id: string; type: 'progress'; value: number }
  | { id: string; type: 'done'; blobUrl: string }
  | { id: string; type: 'error'; error: string }

async function toBitmap(file: File) {
  const buf = await file.arrayBuffer()
  return await createImageBitmap(new Blob([buf], { type: file.type }))
}

function drawToCanvas(src: ImageBitmap | HTMLCanvasElement): OffscreenCanvas {
  const w = (src as any).width, h = (src as any).height
  const c = new OffscreenCanvas(w, h)
  const ctx = c.getContext('2d')!
  ctx.drawImage(src as any, 0, 0)
  return c
}

function cropCanvas(src: OffscreenCanvas, x: number, y: number, w: number, h: number): OffscreenCanvas {
  const c = new OffscreenCanvas(w, h)
  const ctx = c.getContext('2d')!
  ctx.drawImage(src, x, y, w, h, 0, 0, w, h)
  return c
}

function canvasToNHWC(canvas: OffscreenCanvas): tf.Tensor4D {
  const w = canvas.width, h = canvas.height
  const ctx = canvas.getContext('2d')!
  const data = ctx.getImageData(0, 0, w, h).data
  const arr = new Float32Array(h * w * 3)
  let ai = 0
  for (let i = 0; i < data.length; i += 4) {
    arr[ai++] = data[i] / 255
    arr[ai++] = data[i + 1] / 255
    arr[ai++] = data[i + 2] / 255
  }
  const t3 = tf.tensor3d(arr, [h, w, 3], 'float32')
  return t3.expandDims(0) // [1,H,W,3]
}

async function tensorToBlobNHWC01(t: tf.Tensor, mime = 'image/png'): Promise<Blob> {
  const [h, w, c] = (t.shape as number[]).slice(-3)
  const cpu = (await t.data()) as Float32Array
  const canvas = new OffscreenCanvas(w, h)
  const ctx = canvas.getContext('2d')!
  const img = ctx.createImageData(w, h)
  let di = 0
  for (let i = 0; i < h * w; i++) {
    img.data[di++] = Math.max(0, Math.min(255, Math.round(cpu[i * c + 0] * 255)))
    img.data[di++] = Math.max(0, Math.min(255, Math.round(cpu[i * c + 1] * 255)))
    img.data[di++] = Math.max(0, Math.min(255, Math.round(cpu[i * c + 2] * 255)))
    img.data[di++] = 255
  }
  ctx.putImageData(img, 0, 0)
  return await new Promise(res => canvas.toBlob(b => res(b!), mime))
}

// Configure WASM path and debug flags
setWasmPaths('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@4.22.0/dist/')
try { tf.env().set('WEBGL_LOG_DEBUG', true); tf.env().set('WEBGL_VALIDATE_SHADERS', true); } catch {}
self.onmessage = (async (e: any) => {
  const { id, file, modelUrl } = e.data || {};
  const post = (msg:any)=> (self as any).postMessage(msg);
  const postErr = (stage: string, err: any) => post({ id, type: 'error', error: String(err?.message || err), stack: String(err?.stack || ''), stage });
  try {
  const { id, file, modelUrl } = e.data
  try {
    ;(self as any).postMessage({ id, type: 'progress', value: 3 } as Msg)
    try { try { await tf.setBackend('webgl'); await tf.ready() } catch { await tf.setBackend('wasm'); await tf.ready() }
    ;(self as any).postMessage({ id, type:'progress', value:1 }) } catch (e) { await tf.setBackend('wasm'); await tf.ready() }
    post({ id, type: 'progress', value: 3 });
    try { await assertReachable(modelUrl) } catch(e) { return postErr('preflight', e) }
    let model;
    try { model = await tf.loadGraphModel(modelUrl) } catch(e) { return postErr('loadGraphModel', e) }
    ;(self as any).postMessage({ id, type: 'progress', value: 8 } as Msg)

    const inShape = model.inputs[0].shape as number[] // e.g., [1,128,128,3]
    const TILE_H = inShape[1] || 128
    const TILE_W = inShape[2] || 128
    const OVERLAP = 16

    const bmp = await toBitmap(file)
    const srcCanvas = drawToCanvas(bmp)
    const W = srcCanvas.width, H = srcCanvas.height

    const testTile = cropCanvas(srcCanvas, 0, 0, Math.min(TILE_W, W), Math.min(TILE_H, H))
    const fitCanvas = new OffscreenCanvas(TILE_W, TILE_H)
    fitCanvas.getContext('2d')!.drawImage(testTile, 0, 0, TILE_W, TILE_H)
    let tin = canvasToNHWC(fitCanvas)
    const feeds0: Record<string, tf.Tensor> = { [model.inputs[0].name]: tin }
    const outAny0 = await model.executeAsync(feeds0)
    const out0 = Array.isArray(outAny0) ? outAny0[0] : outAny0 as tf.Tensor
    const outShape = out0.shape as number[]
    const SCALE = Math.round((outShape[1] || TILE_H) / TILE_H) || 2
    tin.dispose(); (out0 as any).dispose()

    const outCanvas = new OffscreenCanvas(W * SCALE, H * SCALE)
    const outCtx = outCanvas.getContext('2d')!

    const stepX = TILE_W - OVERLAP
    const stepY = TILE_H - OVERLAP
    let processed = 0
    const total = Math.ceil(W / stepX) * Math.ceil(H / stepY)

    for (let y = 0; y < H; y += stepY) {
      for (let x = 0; x < W; x += stepX) {
        const tileW = (x + TILE_W <= W) ? TILE_W : (W - x)
        const tileH = (y + TILE_H <= H) ? TILE_H : (H - y)
        const tile = cropCanvas(srcCanvas, x, y, tileW, tileH)
        const tcanvas = new OffscreenCanvas(TILE_W, TILE_H)
        tcanvas.getContext('2d')!.drawImage(tile, 0, 0, TILE_W, TILE_H)

        const tnhwc = canvasToNHWC(tcanvas)
        const feeds: Record<string, tf.Tensor> = { [model.inputs[0].name]: tnhwc }
        const outAny = await model.executeAsync(feeds)
        const outT = Array.isArray(outAny) ? outAny[0] : outAny as tf.Tensor

        const out3 = (outT as any).squeeze() as tf.Tensor3D
        const blob = await tensorToBlobNHWC01(out3)
        out3.dispose(); tnhwc.dispose(); (outT as any).dispose()

        const drawW = tileW * SCALE
        const drawH = tileH * SCALE
        const img = await createImageBitmap(blob)
        const sx = 0, sy = 0, sW = drawW, sH = drawH
        const dx = x * SCALE, dy = y * SCALE, dW = drawW, dH = drawH
        outCtx.drawImage(img, sx, sy, sW, sH, dx, dy, dW, dH)

        ;(self as any).postMessage({ id, type: 'progress', value: Math.floor(10 + 80 * (++processed / total)) } as Msg)
      }
    }

    const finalBlob = await outCanvas.convertToBlob({ type: 'image/png' })
    const url = URL.createObjectURL(finalBlob)
    ;(self as any).postMessage({ id, type: 'done', blobUrl: url } as Msg)
  } catch (err: any) {
    ;(self as any).postMessage({ id, type: 'error', error: String(err?.message || err) } as Msg)
  }
  } catch (err:any) { postErr('worker-top', err) }
});